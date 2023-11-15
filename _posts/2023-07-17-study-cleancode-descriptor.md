---
layout: archive
title:  "[Study] Python Clean Code - Descriptor"
date:   2023-07-17 10:05:07 +0900
categories: 
    - Study
---
## Descriptor

- 디스크립터를 구현하기 위해 두 가지 클래스(클라이언트 클래스, 디스크립터 클래스)가 필요합니다.

**핵심 용어**  
- `client`: `ClientClass`의 인스턴스입니다.
- `descriptor`: `DescriptorClass`의 인스턴스입니다.
- `ClientClass`: 솔루션을 위해 생성한 일반적인 추상화 객체입니다. class attribute로 `discriptor`를 갖습니다. (필수)
- `DescriptorClass`: 디스크립터 로직의 구현체로, 디스크립터 프로토콜을 구현한 클래스의 인스턴스입니다. 매직메서드 `__get__`, `__set__`, `__delete__`, `__set_name` 중 최소 하나 이상을 포함해야합니다.

**동작 원리**
- 클래스 속성을 객체로 선언하면 디스크립터로 인식되고, 클라이언트에서 해당 속성을 호출하면 `__get__`의 결과를 반환합니다.

    ```python
    class DescriptorClass:
        def __get__(self, instance, owner):
            if instance is None:
                return self
            logger.info(
                "Call: %s.__get__(%r, %r)",
                self.__class__.__name__, instance, owner
            )

    class ClientClass:
        desciptor = DescriptorClass()

    client = ClientClass()
    logger.info(client.desciptor)
    ```

-  `ClientClass` 인스턴스의 `descriptor`에 접근하면, `DescriptorClass` 인스턴스를 반환하지 않고, `__get__`의 반환 값을 사용합니다.
- 이를 이용해, `__get__` 메서드 뒤쪽으로 모든 종류의 논리를 추상화하여 클라이언트에게 내용을 숨긴 채로 변환을 투명하게 실행할 수 있습니다. (캡슐화)

### 디스크립터 프로토콜의 메서드 탐색
- 디스크립터는 객체이기 때문에, self를 첫 번째 파라미터로 사용하며,  self는 객체 자신을 의미합니다.

#### `__get__(self, instance, owner)`  
- instance는 디스크립터를 호출한 객체입니다. (client 객체)
- owner는 해당 객체의 클래스를 의미합니다. (ClientClass 클래스)
- 즉, instance는 디스크립터가 행동을 취하려는 객체이며, owner는 인스턴스의 클래스입니다.

    ```python
    class DescriptorClass:
        def __get__(self, instance, owner):
            if instance is None:
                return f"{self.__class__.__name__}.{owner.__name__}"
            return f"value for {instance}"

    class ClientClass:
        descriptor = DescriptorClass()
    ```
- 위의 예제에서, `ClientClass.descriptor`로 호출하면 instance가 있는 형태로 호출하는 것이지만,
- `ClientClass().descriptor`로 호출하면 instance를 None으로 인식하여 단순히 디스크립터 자체를 반한합니다.

#### `__set__(self, instance, value)`  
- 꼭 구현할 필요는 없으며, 구현한 디스크립터에 대해서만 활성화됩니다.
- `instance` 파라미터는 `client`이며 `value` 인자는 문자열을 갖습니다.

    ```python
    class Validation:
        def __init__(self, validation_function, error_msg: str):
            self.validation_function = validation_function
            self.error_msg = error_msg
        
        def __call__(self, value):
            if not self.validation_function(value):
                raise ValueError(f"{value!r} {self.error_msg}")
        
    class Field:
        def __init__(self, *validations):
            self._name = None
            self.validations = validations
        
        def __set_name__(self, owner, name):
            self._name = name
        
        def __get__(self, instance, owner):
            if instance is None:
                return self
            return instance.__dict__[self._name]
        
        def validate(self, value):
            for validation in self.validations:
                validation(value)
        
        def __set__(self, instance, value):
            self.validate(value)
            instance.__dict__[self._name] = value

    class ClientClass:
        descriptor = Field(
            Validation(lambda x: isinstance(x, (int, float)), "는 숫자가 아닙니다."),
            Validation(lambda x: x >= 0, "는 음수입니다."),
        )

    # 사용 예시
    client = ClientClass()
    client.descriptor = 42
    client.descriptor = -42 # 음수이므로, Validation 에러 발생
    client.descriptor = "invalid value" # 문자열이므로, Validation 발생
    ```
- `__set__()` 메서드가 @property.setter가 하던 일을 대신하게 됩니다.
- 위와 같이, 프로퍼티 자리에 놓일 수 있는 부분은 디스크립터로 추상화가 가능합니다.


#### `__delete__(self, instance)`
- self는 descriptor 속성을 나타내며, instance는 client를 나타냅니다.

    ```python
    class ProtctedAttribute:
        def __init__(self, requires_role=None) -> None:
            self.permission_required = requires_role
            self._name = None
        
        def __set_name__(self, owner, name):
            self._name = name
        
        def __set__(self, user, value):
            if value is None:
                raise ValueError(f"{self._name}를 None으로 설정할 수 없습니다.")
            user.__dict__[self._name] = value
        
        def __delete__(self, user):
            if self.permission_required in user.permissions:
                user.__dict__[self._name] = None
            else:
                raise ValueError(
                    f"{user!s} 사용자는 {self.permission_required} 권한이 없습니다."
                )

    class User:
        """admin 권한을 가진 사용자만 이메일 주소를 제거할 수 있습니다."""

        email = ProtctedAttribute(requires_role="admin")

        def __init__(self, username: str, email: str, permission_list: list = None) -> None:
            self.username = username
            self.email = email
            self.permissions = permission_list or []
        
        def __str__(self):
            return self.username

    admin = User("root", "root@example.com", ["admin"])
    logger.info(admin.email)
    del admin.email
    logger.info(admin.email)

    user = User("user", "user@example.com", ["email", "helpdesk"])
    logger.info(user.email)
    del user.email
    ```
- User 클래스는 username과 email 파라미터를 필수로 받습니다. 
- email은 "admin" 권한이 있는 사용자만 제거할 수 있습니다.

#### `__set_name__(self, owner, name)`
- 디스크립터에 필요한 이름을 지정하기 위한 메서드입니다.
- 속성의 이름은 `__dict__`에서 `__get__`과 `__set__` 메서드로 읽고 쓸 때 사용됩니다.

    ```python
    class DescriptorWithName:
        def __init__(self, name=None) -> None:
            self.name = name
        
        def __set_name__(self, owner, name):
            self.name = name
            print(f'__set_name__(owner: {owner}, name: {name})')

    class ClientClass:
        descriptor1 = DescriptorWithName() #1
        descriptor2 = DescriptorWithName() #2

    logger.info(ClientClass())
    ```
- 위와 같이 사용하면, #1 Descriptor 이름은 `descriptor1`이 됩니다.
- 즉, 필드명을 descriptor명이 되도록 동작시키는 역할이라고 볼 수 있습니다.

### 디스크립터의 유형

#### 비데이터 디스크립터
- `__get__` 메서드만을 구현한 디스크립터입니다.

    ```python
    class NonDataDescriptor:
        def __get__(self, instance, owner):
            if instance is None:
                return self
            return 42

    class ClientClass:
        descriptor = NonDataDescriptor()

    client = ClientClass()
    # vars(): 클래스의 __dict__를 반환합니다.
    logger.info(vars(client)) #1

    client.descriptor = 43 #2
    logger.info(vars(client)) #3
    ```
- 비데이터 디스크립터의 경우, `__set__`과 `__delete__`를 구현하지 않기 때문에, #2와 같이 속성 값을 변경하는 경우, descriptor instance는 일반 정수로 변경됩니다.
- 따라서, #1의 결과는 비어있는 딕셔너리지만, #3의 결과는 descriptor 속성이 일반 정수 43으로 갖는 것으로 출력됩니다.
- 이 때, #2에서 지정한 descriptor를 `del client.descriptor`로 제거한다면, 원래 동작과(#1)과 같이 수행됩니다.

#### 데이터 디스크립터
- `__set__`이나 `__delete__` 메서드를 구현한 경우입니다. 

    ```python
    class DataDescriptor:
        def __get__(self, instance, owner):
            if instance is None:
                return self
            return 42
        
        def __set__(self, instance, value):
            logger.info("%s.descriptor를 %s 값으로 설정", instance, value)
            instance.__dict__["descriptor"] = value

    class ClientClass:
        descriptor = DataDescriptor()

    client = ClientClass()
    logger.info(vars(client)) #1

    client.descriptor = 43
    logger.info(client.descriptor) #2
    logger.info(vars(client)) #3
    ```
- `__set__` 메서드를 구현한 데이터 디스크립터의 경우, #2에서 출력 결과가 변경되지 않고 42임을 알 수 있습니다.
- 하지만, `vars()` 메서드를 사용하여 속성을 분석하면, descriptor 속성이 추가되면서 값이 바뀌어 있게됩니다.
- 데이터 디스크립터에서 속성을 조회하면 객체의 `__dict__`에서 조회하는 대신 클래스의 `descriptor`를 먼저 조회합니다.
- 즉, 데이터 디스크립터는 인스턴스의 `__dict__`를 오버라이드하여 인스턴스 사전보다 높은 우선순위를 가지지만, 비데이터 디스크립터는 인스턴스 사전보다 낮은 우선순위를 가집니다.