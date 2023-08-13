---
layout: archive
title:  "[Study] Python Clean Code - Good Code"
date:   2023-08-12 00:05:07 +0900
categories: 
    - Study
---

## 계약에 의한 디자인
- 계약: 소프트웨어 컴포넌트 간의 통신 중에 반드시 지켜져야 하는 규칙을 강제하는 것입니다.
- 사전조건: 코드가 실행되기 전에 확인해야 할 조건들로, 유효성 검사, DB 및 파일 등에 대한 것들로, 서버가 담당할 부분입니다.
- 사후조건: 코드 실행 이후에 함수 반환 값의 유효성 검사로, 클라이언트가 담당할 부분입니다.
- 위의 두 가지 조건을 통해, 책임소재를 신속히 파악할 수 있습니다. 사전조건 검증에 실패한다면 클라이언트의 결함, 사후조건에 실패하면 컴포넌트의 결함입니다.

### 사전조건(precondition)
- 함수나 메서드가 제대로 동작하기 위해 보장해야 하는 모든 것을 의미하며, 적절한 데이터를 전달해야 합니다.
- 파이썬은 동적으로 타입이 결정되기 때문에, 전달된 데이터가 적절한 타입인지 확인하는 경우도 있습니다.
- 클라이언트가 함수를 호출하기 전, 모든 유효성을 검사하는 방식은 tolerant 접근법으로, 함수가 어떤 값이라도 수용하게 됩니다.
- 하지만, 함수가 자체적으로 로직을 실행하기 전에 검사하도록 한다면 demanding 접근 방법입니다.
- DRY 원칙에 의해, 이때도 검증 로직은 클라이언트에 두거나 함수 자체에 두어야 합니다.

### 사후조건(postcondition)
- 메서드 또는 함수가 반환된 후의 상태를 강제하는 계약의 일부입니다.
- 사후조건 검증에 통과하고 클라이언트는 반환 객체를 아무 문제 없이 사용할 수 있어야 합니다.

## 방어적 프로그래밍
- 방어적 프로그래밍은 계약에 의한 디자인과 다른 접근방식을 따릅니다.
- 계약에서 예외를 발생시키고 실패하게 되는 조건을 기술하는 대신, 코드의 모든 부분을 유효하지 않은 것으로부터 스스로 보호할 수 있도록 합니다.
- 에러핸들링(예상할 수 있는 시나리오의 오류를 처리하는 방법)과 어썰션(발생하지 않아야 하는 오류를 처리하는 방법)을 사용합니다.

### 에러 핸들링
- 예상되는 에러에 대해 실행할 수 있을지, 프로그램을 중단할지를 판단하기 위한 절차입니다.

**값 대체**  
- 일부 시나리오에서 오류에 의해 소프트웨어가 잘못된 값을 생성하거나 전체가 종료될 위험이 있는 경우, 결괏값을 다른 값으로 대체합니다.
  ```python
  import os
  os.getenv("DBPORT", 5432) # "DBPORT"가 env에 없는 경우 5432 반환
  def connect_database(host="localhost", port=5432):
      ...
  ```
- 데이터가 누락될 경우 None 때문에 발생하게 되는 오류를 방지합니다.

**예외 처리**
- 함수 호출 실패는 외부 컴포넌트 중 하나의 문제로 인한 것일 수 있습니다.
- 함수는 심각한 오류에 대해 명확하고 분명하게 알려주어 적절하게 해결할 수 있도록 해야 합니다.
- 예외가 많을수록 호출자는 함수에 대해 더 많은 것을 알아야 하므로, 캡슐화를 약화시킵니다.

```python
class DataTransport:
    retry_threshold: int = 5
    retry_n_times: int = 3

    def __init__(self, connector):
        self._connector = connector
        self.connection = None
      
    def deliver_event(self, event):
        try:
            self.connect()
            data = event.decode()
            self.send(data)
        except ConnectionError as e:
            logger.info("연결 실패: %s", e)
            raise
        except ValueError as e:
            logger.error("%r 잘못된 데이터 포함: %s", event, e)
            raise
    
    def connect(self):
        for _ in range(self.retry_n_times):
            try:
                self.connection = self._connector.connect()
            except ConnectionError as e:
                logger.info("%s: 새로운 연결 시도 %is", e, self.retry_threshold)
            else:
              return self.connection
        raise ConnectionError(f"{self.retry_n_times} 번째 재시도 연결 실패")
    
    def send(self, data):
        return self.connection.send(data)
```
- `deliver_event`의 경우, 두 가지의 예외상황이 발생할 수 있습니다. `connect` 메서드를 사용할 때 혹은 `decode()` 메서드를 사용할 때의 경우로, 구현을 수정할 필요가 있습니다.

```python
def connection_with_retry(connector, retry_n_times, retry_threshold=5):
    for _ in range(retry_n_times):
      try:
        return connector.connect()
      except ConnectionError as e:
          logger.info("%s: 새로운 연결 시도 %is", e, self.retry_threshold)
          time.sleep(retry_threshold)
      exc = ConnectionError(f"{self.retry_n_times} 번째 재시도 연결 실패")
      logger.exception(exc)
      raise exc

class DataTransport:
    retry_threshold: int = 5
    retry_n_times: int = 3

    def __init__(self, connector):
        self._connector = connector
        self.connection = None

    def deliver_event(self, event):
        self.connection = connection_with_retry(self._connector, self.retry_n_times, self.retry_threshold)
        self.send(event)

    def send(self, event):
        try:
            return self.connection.send(event.decode())
        except ValueError as e:
            logger.error("%r 잘못된 데이터 포함: %s", event, e)
            raise
    ...
```
- 연결과 연결 예외까지를 담당하는 `connection_with_retry` 메서드를 독립적으로 구현합니다.
- 위와 같이 방식을 변경하면, 예외처리를 `deliver_event`에서 따로 관리할 필요가 없게 되고, 의도적으로 예외가 발생하도록 내버려 둘 수 있습니다.

### 예외처리시 주의사항
**Traceback 노출 금지**
- 예외 처리시 발생하는 오류가 전파되었을 때, 세부사항을 사용자에게 보이지 않도록 해야 합니다.
- 파이썬에서의 traceback은 중요 정보들을 유출하게될 가능성이 있기 때문입니다.

**비어있는 except 블록 사용 금지**
```python
try:
    process_data()
except:
    pass
```
- 파이썬의 철학은, "에러는 조용히 전달되어서는 안된다는 것"입니다. 위와 같은 방식은 코드를 숨기고 에러 수정을 어렵게 합니다.
- `Exception`과 같이 광범위한 예외 보다는 `보다 구체적인 예외`를 사용해야합니다.

**원본 예외 포함**
- 오류 처리 과정에서 다른 오류를 발생시키고 메시지를 변경하는 경우가 있을 수 있습니다.
- 이 때, 원본의 예외를 포함하는 것이 좋습니다.
```python
class InternalDataError(Exception):
    """업무 도메인 데이터의 예외"""

def process(data_dictionary, record_id):
    try:
        return data_dictionary[record_id]
    except KeyError as e:
      raise InternalDataError("Record not present") from e
```
- 위와 같이, 기본 예외를 상속받아, 커스텀 예외로 처리하는 방식도 있습니다.

### 파이썬에서 어썰션 사용하기
- 절대로 일어나지 않아야하는 상황에서 사용됩니다. 따라서, assert 문이 작동하면, 소프트웨어에 결함이 있음을 의미합니다.
- 따라서, 프로그램을 중단해야할 가능성이 있는 오류로, 결함을 수정하기 위해 프로그램을 중지하는 것이 좋습니다.
```python
result = condition.holds()
assert result > 0, "에러 {0}".format(result)
```

## 관심사의 분리
- 프로그램의 각 부분은 기능의 일부분(관심사)에 대해서만 책임을 지며, 나머지 부분에 대해서는 알 필요가 없습니다.
- 소프트웨어의 관심사를 분리하는 목표는 파급 효과(한 지점의 변화가 전체로 전파되는 것)를 최소화하여 유지보수성을 향상시키는데 있습니다.

### 응집력
- 객체는 작고 잘 정의된 목적을 가져야 하며, 가능하면 작아야 합니다.
- 객체의 응집력이 높을수록 더 유용하고 재사용성이 높아지므로, 더 좋은 디자인입니다.

### 결합력
- 두 개 이상의 객체가 서로 어떻게 의존하는지를 나타냅니다.
- 객체 또는 메서드의 두 부분이 서로 너무 의존적이라면, 다음과 같은 결과를 가져옵니다.
- 1. 낮은 재사용성: 어떤 함수가 특정 객체에 지나치게 의존하거나 너무 많은 파라미터를 가진다면, 해당 객체에 결합하게 됩니다.
- 2. 파급효과: 너무 가깝게 붙어있게 되면, 두 부분 중 하나를 변경할 때 다른 부분에도 영향을 미칩니다.
- 3. 낮은 수준의 추상화: 두 함수가 너무 가깝게 관련되어 있으면, 서로 다른 추상화 레벨에서 문제를 해결하기 어렵습니다.

## 컴포지션과 상속

### 상속의 좋은 예시
- public 메서드와 속성 인터페이스를 정의한 컴포넌트를 그대로 물려받으면서 추가 기능을 더하려고 하는 경우 및 특정 기능을 수정하는 경우에 좋습니다.
- 예를 들어, `http.server` 패키지에서 `BaseHTTPRequsetHandler` 기본 클래스와, 이를 변경한 `SimpleHTTPRequestHandler`가 있습니다.
- 예외처리를 담당하는 `Exception` 클래스의 경우, 상속을 사용하는 것이 좋습니다.

### 상속의 안티패턴
- 도메인 문제를 해결하기 위해, 적절한 데이터 구조를 만든 후, 이를 사용하는 객체를 만들지 않고 데이터 구조(딕셔너리/셋/리스트 등) 자체를 객체로 만드는 경우입니다.
- 또한, public 인터페이스를 통해 노출된 public 메서드를 사용하게 되기 때문에, 필요없는 메서드에도 접근할 수 있는 coupling에 대한 문제가 발생합니다.
```python
class TransactionPolicy(collections.UserDict):
    """잘못된 상속 예시"""
    def change_in_policy(self, customer_id, **new_policy_data):
        self[customer_id].update(**new_policy_data)
    
```
- 올바른 해결책은 컴포지션을 사용하는 것입니다. `TransactionalPolicy` 자체가 딕셔너리가 되는 것이 아니라 딕셔너리를 활용하는 것입니다.
- 사전을 private 속성에 저장하고 `__getitem__()`으로 사전의 프록시를 만들고 나머지 필요한 public 메서드를 추가적으로 구현하는 것입니다.
```python
class TransactionPolicy:
    """컴포지션을 사용한 리팩토링 예시"""
    def __init__(self, policy_data, **extra_data):
        self._data = {**policy_data, **extra_data}
    
    def change_in_policy(self, customer_id, **new_policy_data):
        self._data[customer_id].update(**new_policy_data)

    def __getitem__(self, customer_id):
        return self._data[customer_id]
    
    def __len__(self):
        return len(self._data)
```
- `TransacctionalPolicy` 자체가 딕셔너리가 되는 것이 아닌, 딕셔너리를 활용하는 것입니다. 즉, 딕셔너리를 private 속성에 저장하고 `__getitem__()`으로 딕셔너리의 프록시를 생성합니다.
- 이 방법은 개념적으로 정확하며, 현재 딕셔너리의 데이터 구조를 변경하더라도 인터페이스만 유지하면, 사용자는 영향을 받지 않습니다.

### 파이썬 다중상속
- 파이썬은 다중상속을 지원하지만, 이를 잘못 사용하면 큰 문제를 초래할 수 있습니다.
- 다중 상속의 올바른 해결책으로는 믹스인(mixin)을 활용한 디자인 패턴이 있습니다.

**믹스인(mixin)**
- 믹스인은 코드를 재사용하기 위해, 일반적인 행동을 캡슐화한 기본 클래스입니다.
- 믹스인 클래스는 그 자체로는 유용하지 않으며, 대부분이 클래스에 정의된 메서드나 속성에 의존하기 때문에 확장에서는 동작하지 않습니다.
```python
class BaseTokenizer:
    def __init__(self, str_token):
        self.str_token = str_token
    
    def __iter__(self):
        yield from self.str_token.split("-")

class UpperIterableMixin:
  def __iter__(self):
      return map(str.upper, super().__iter__())

class Tokenizer(UpperIterableMixin, BaseTokenizer):
    pass

>>> tk = BaseTokenizer("28a2320b-fd3f-4627-9792-a2b38e3c46b0")
>>> list(tk)
['28a2320b', 'fd3f', '4627', '9792', 'a2b38e3c46b0']
```
- 위에서 mixin과 함께 `BaseTokenizer`를 사용한 `Tokenizer` 클래스의 경우, 일종의 데코레이터 역할을 합니다.
- 믹스인에서 `__iter__`를 호출하고 다시 `super()`를 호출하여 `BaseTokenizer`에 위임합니다.

### 파이썬의 함수 인자 동작방식
- 파이썬의 첫 번째 규칙은 모든 인자가 passed by a value 된다는 것입니다. 따라서, 함수 인자에 있는 변수를 할당하고 나중에 사용합니다.
- 함수의 인자가 mutable한지 immutable한지에 따라서 함수 내부에서 값이 의도치 않게 변형되는 경우가 발생할 수 있습니다.
**가변인자**
- 파이썬에서 가변인자를 사용하려면 해당 인자를 packing할 변수 이름 앞에 `*`를 붙입니다.
```python
# packing 예시
def f(first, second):
    print(first, second)

>>> l = [1, 2]
>>> f(*l)
1 2

# unpacking 예시
>>> a, b = [1, 2]
>>> print(a, b)
1 2
```
- 인자를 딕셔너리로 패킹하려면 변수 이름 앞에 `**`를 붙입니다.
```python
def function(**kwargs):
    print(kwargs)

>>> function(key="value")
{'key': 'value'}
```