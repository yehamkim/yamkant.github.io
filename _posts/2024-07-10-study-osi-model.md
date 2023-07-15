---
layout: archive
title:  "[Study] Python Clean Code - OOP"
date:   2023-07-10 10:05:07 +0900
categories: 
    - Study
---

## SOLID 원칙
- S: 단일 책임 원칙 (Single Responsibility Principle)
- O: 개방/폐쇄의 원칙
- L: 리스코프(Liskov) 치환 원칙
- I: 인터페이스 분리 원칙 (Interface Segregation Principle)
- D: 의존성 역전 원칙 (Dependency Inversion Principle)

### 단일 책임 원칙
- SRP은 소프트웨어 컴포넌트가 단 하나의 책임을 져야한다는 원칙입니다.
- 따라서, 구체적인 하나의 일을 담당해야하며, 변화해야할 이유는 단 하나뿐입니다.
- 관계형 데이터베이스 설계에서의 정규화 개념과 유사합니다. 객체으 속성이나 메서드의 특성이 다른 그룹에서 발견되면 이들을 다른 곳으로 옮겨야합니다. 

### 개방/폐쇄 원칙
- 클래스를 디자인 할 때는 유지보수가 쉽도록 로직을 캡슐화하여, 확장에는 열려있고 수정에는 닫있도록 해야합니다.
- 새로운 기능을 추가하다가 기존 코드를 수정했다면, 기존 로직이 잘못 디자인 되었음을 의미합니다.

**좋지 않은 코드 예시**
```python
class Event:
    def __init__(self, raw_data):
        self.raw_data = raw_data
    
class UnkownEvent(Event):
    """데이터만으로 식별할 수 없는 이벤트"""

class LoginEvent(Event):
    """로그인 사용자에 의한 이벤트"""

class LogoutEvent(Event):
    """로그아웃 사용자에 의한 이벤트"""

class SystemMonitor:
    """시스템에서 발생한 이벤트 분류"""
    def __init__(self, event_data):
        self.event_data = event_data
    
    def identify_event(self):
        if self.event_data["before"]["session"] == 0 \
            and self.event_data["after"]["session"] == 1:
            return LoginEvent(self.event_data)
        elif self.event_data["before"]["session"] == 1 \
            and self.event_data["after"]["session"] == 0:
            return LogoutEvent(self.event_data)
        
        return UnkownEvent(self.event_data)
```
- 위 코드들은, SystemMonitor를 생성할 때 `event_data` 딕셔너리 값에 따라서 반환하는 클래스가 달라집니다. 하지만, 몇가지 문제가 있습니다.
- 이벤트 유형을 결정하는 논리가 일체형으로 중앙 집중화 되어있습니다. 이벤트가 늘어날수록 메서드도 커질 것 입니다.
- 따라서, 한가지 일만 할 수 없을 뿐더러 한가지 일을 제대로 하지도 못합니다. 새로운 유형의 이벤트가 추가될 때마다 수정해야하므로, 수정에 닫혀있지 않습니다.

**리팩토링된 코드**
```python
class Event:
    def __init__(self, raw_data):
        self.raw_data = raw_data
    @staticmethod
    def meets_condition(event_data: dict):
        return False
    
class UnkownEvent(Event):
    """데이터만으로 식별할 수 없는 이벤트"""

class LoginEvent(Event):
    """로그인 사용자에 의한 이벤트"""

    @staticmethod
    def meets_condition(event_data: dict):
        return (event_data["before"]["session"] == 0 \
            and event_data["after"]["session"] == 1
        )

class LogoutEvent(Event):
    """로그아웃 사용자에 의한 이벤트"""
    def meets_condition(event_data: dict):
        return (event_data["before"]["session"] == 1 \
            and event_data["after"]["session"] == 0
        )

class SystemMonitor:
    """시스템에서 발생한 이벤트 분류"""
    def __init__(self, event_data):
        self.event_data = event_data
    
    def identify_event(self):
        for event_cls in Event.__subclasses__():
            try:
                if event_cls.meets_condition(self.event_data):
                    return event_cls(self.event_data)
            except KeyError:
                continue
        return UnkownEvent(self.event_data)
```
- `SystemMonitor`를 추상적인 이벤트와 협력하도록 변경하고, 이벤트에 대응하는 개별 로직은 각 이벤트 클래스에 위임합니다.
- `Event` 클래스 관련 인터페이스들은 `meets_condition` 메서드를 구현하여 다형성을 보장합니다.
- 만약, 새로운 요구사항에 의해 사용자 트랜잭션에 대응하는 이벤트를 지원해야한다고 가정한다면, 아래와 같이 클래스 하나만 추가하면 됩니다.
    ```python
    class TransactionEvent(Event):
        """시스템에서 발생한 트랜잭션 이벤트"""
        @staticmethod
        def meets_condition(event_data: dict):
            return event_data["after"].get("transaction") is not None
    ```

### 리스코프 치환 원칙(LSP)
- 설계 시 안전성을 유지하기 위해 객체 타입이 유지되어야 한다는 일련의 특성을 말합니다.
- 만약 S가 T의 하위 타입이라면, 프로그램을 변경하지 않고 T 타입의 객체를 S 타입의 객체로 치환할 수 있어야 합니다.
- 좋은 클래스는 명확하고 간결한 인터페이스를 가지고 있습니다.
- 여러 타입의 객체를 사용하는 클라이언트 클래스가 있다면, 클라이언트는 어떤 인터페이스를 통해 객체와 상호작용하기를 원할 것입니다. 클라이언트 클래스에 추가적인 작업을 하지 않더라도, 모든 하위 클래스의 인스턴스로 작업할 수 있어야 합니다. (하위 클래스와 부모 클래스의 사용 시점을 변경핻봐도 문제가 없어야 합니다.)
- 하위 클래스는 부모 클래스에 정의된 것보다 사전 조건을 엄격하게 만들면 안됩니다.
- 하위 클래스는 부모 클래스에 정의된 것보다 약한 사후조건을 만들면 안됩니다.
- Mypy나 Pylint같은 모듈을 통해 위반하는 클래스를 검출할 수 있습니다.

**리팩토링 코드**
```python
class Event:
    def __init__(self, raw_data):
        self.raw_data = raw_data
    @staticmethod
    def meets_condition(event_data: dict):
        return False
    @staticmethod
    def meets_condition_pre(event_data: dict):
        """인터페이스 계약의 사전조건
        'eveent_data' 파라미터의 유효성 검사
        """
        assert isinstance(event_data, dict), f"{event_data!r} is not a dict"
        for moment in ("before", "after"):
            assert moment in event_data, f"{moment} not in {event_data}"
            assert isinstance(event_data[moment], dict)
        return False
    
...

class SystemMonitor:
    """시스템에서 발생한 이벤트 분류"""
    def __init__(self, event_data):
        self.event_data = event_data
    
    def identify_event(self):
        Event.meets_condition_pre(self.event_data)
        event_cls = next(
            (
                event_cls for event_cls in Event.__subclasses__()
                if event_cls.meets_condition(self.event_data)
            ),
            UnkownEvent,
        )
        return event_cls(self.event_data)
```
- 사전조건에서 파라미터의 타입을 분석하기 때문에, 클라이언트는 KeyError를 받지 않으므로 발전된 캡슐화가 되었습니다.
- LSP는 다형성을 강조하기 때문에 좋은 디자인의 기초가 됩니다. 새로운 클래스가 원래의 계약과 호환되지 않는 확장을 하려면 클라이언트와의 계약이 깨집니다.. 이를 주의해서 설계해야 합니다.

### 인터페이스 분리 원칙
- 인터페이스는 객체가 노출하는 메서드의 집합입니다. 파이썬에서는 클래스 메서드의 형태를 보고 암시적으로 정해지며, 이는 덕타이핑 원리를 따릅니다.
- 인터페이스는 각각 하나의 메서드를 가진 두 개의 다른 인터페이스로 분리하는 것이 좋습니다.
- 예를 들어, `XMLEventParser`에서 파생된 클래스는 `from_xml()` 메서드만을 구현하면 되고, `JSONEventParser`에서 파생된 클래스는 `from_json()` 메서드만을 구현하면 됩니다.
- 이 원칙을 준수하지 않으면 별개의 기능이 결합된 인터페이스가 만들어지며, 상속된 클래스는 SRP를 준수할 수 없게 됩니다.

### 의존성 역전
- 추상화를 통해 세부 사항에 의존하지 않도록 해야 하지만, 반대로 세부 사항 (구체적인 구현)은 추상화에 의존해야 한다.
- 저수준 내용에 따라 고수준 클래스가 변경되는 것은 좋은 디자인이 아닙니다. 이를 해결하기 위해서는 고수준 클래스에서 저수준 클래스를 구체 클래스 형태가 아닌 인터페이스 형태로 담당하는 것입니다.
- 상속은 is a 관계입니다. The apple is a fruit. 과 같이 표현할 수 있다면, apple은 fruit을 상속받을 수 있습니다.