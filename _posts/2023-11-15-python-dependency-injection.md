---
layout: archive
title:  "[Study] 파이썬에서 사용할 수 있는 의존성 주입 방법"
date:   2023-11-15 00:05:07 +0900
categories: 
    - Study
---

## 간단한 개념설명
### 의존성이란?
- 두 개의 컴포넌트 사이의 의존성이란 하나의 컴포넌트의 변경 사항이 다른 컴포넌트에도 영향을 미칠 가능성을 의미합니다.
- 기능이 추가됨에 따라 코드는 복잡해지며, 코드 내의 객체 간에 의존성이 발생하기 마련입니다. 
- 애플리케이션 설계가 유연해지도록 이러한 의존성을 낮추는 작업이 필요하며, 각각의 컴포넌트들은 실행 컨텍스트에 대한 구체적인 사항을 최소한으로 가져야합니다.

### 의존성 주입이란?
- 객체 내에서 구체적으로 구현된 객체를 사용하는 방식이 아닌, 외부의 독립적인 객체가 인스턴스를 생성 후 이를 전달하여 의존성을 해결하는 방법입니다.
- 객체의 생성을 다른 곳(컨테이너)에서 담당하도록 하여 결합도를 낮출 수 있습니다.
- Fake, Mocking 등의 객체를 주입하여 테스트에 용이하게 만들 수 있습니다.
- 의존성 역전의 원칙: 상위 모듈은 하위 모듈에 의존해서는 안되며, 추상화는 세부사항(구현체)에 의존해서는 안됩니다.

## 파이썬 프레임워크에서의 DI
### Django
- Django에서는 settings.py 파일에 환경별 depencency를 key-value 형태로 명시하여 의존성을 주입합니다.
- DRF에서는 class 기반으로 의존성을 주입합니다. 따라서, `APIView` 기반으로 되어있는 클래스들은 권한, 파서, 렌더 등의 클래스들을 주입할 수 있습니다.

### Spring
- Annotation 기반의 IoC 및 Dependency Injection이 가능합니다.
- 기본적으로 가지고 있는 ApplicationContext라는 컨테이너를 통해, Bean(싱글톤 자바 객체)을 관리하며 Bean을 통해 컨텍스트 내의 다양한 컴포넌트에 접근하여 사용 가능합니다.

## 파이썬 Dependency Injector 모듈
- 테스트 코드만 보고도 사용방법을 알 수 있는 편리함이 있습니다.
- 다른 프레임워크에 종속되지 않고, 파이썬을 사용하는 모든 애플리케이션에서 사용할 수 있습니다.

### 간단한 예시
- 차량에 따른 타이어를 교체하는 코드가 우선 아래와 같다고 생각해봅니다.
    ```python
    from abc import abstractmethod, ABC

    class Tier(ABC):
        @abstractmethod
        def get_name(self):
            pass

    class SnowTier(Tier):
        def get_name(self):
            print("스노우 타이어")


    class CommonTier(Tier):
        def get_name(self):
            print("일반 타이어")


    class Car:
        def __init__(self, tier: Tier):
            self.tier = tier

        def get_tier(self):
            return self.tier.get_name()


    if __name__ == "__main__":
        common_car = Car(CommonTier())
        snow_car = Car(SnowTier())
    ```
    - Car 객체를 생성할 때, `__main__`에서와 같이  타이어 클래스를 생성자 주입해줍니다.
- 위 코드를 Dependency Injection 라이브러리를 사용한 Provider Factory 패턴을 사용하여 아래와 같이 리팩토링할 수 있습니다.
    ```python
    from abc import abstractmethod, ABC
    from dependency_injector import containers, providers

    class Tier(ABC):
        @abstractmethod
        def get_name(self):
            pass

    class SnowTier(Tier):
        def get_name(self):
            print("스노우 타이어")

    class CommonTier(Tier):
        def get_name(self):
            print("일반 타이어")

    class Car:
        def __init__(self, tier: Tier):
            self.tier = tier

        def get_tier(self):
            return self.tier.get_name()

    class Container(containers.DeclarativeContainer):
        common_tier_factory = providers.Factory(CommonTier)
        car_factory = providers.Factory(
            Car,
            tier=common_tier_factory,
        )

    if __name__ == "__main__":
        container = Container()

        snow_car = container.car_factory(tier=SnowTier())
        common_car = container.car_factory()
    ```
    - `DeclarativeContainer`를 사용하면, 의존성 관리 뿐만 아니라 애플리케이션의 설정 또한 관리할 수 있습니다.
    - Factory Provider는 Signleton과 반대로, 매번 객체를 생성하는 매커니즘입니다. 
    - 생성자의 인자를 이용하는 방법과 더불어 Factory Provider Chaning을 통해 의존성 주입이 가능합니다.

### Container
- 프로바이더들의 집합으로, 애플리케이션의 의존성을 하나의 클래스로 만들거나 여러 개의 컨테이너를 조합해서 사용할 수 있습니다.
- `Declarative Container`: 일반적으로 사용되는 컨테이너 방식입니다.
- `Dynamic Container`: 동적으로 의존성을 생성하는 방식으로, 권장되지 않습니다.

### Providers
- 실질적으로 객체/의존성을 모아줍니다. 객체를 생성하고, 의존성을 다른 프로바이더에 주입시킵니다.

#### Configuration Provider
- 컨테이너에서 선언을 해두고, 사용하는 부분에서 데이터를 주입합니다.  
  (*.ini, *.yaml, Pydantic Settings, dictionary, 환경변수 등)
- pydantic 클래스를 사용하여 validation 로직을 작성하는 방식이 권장됩니다.
- 아래와 같은 식으로 설정 값을 주입할 수 있습니다.
    ```python
    # apps.container.py
    ...
    class DatabaseSettings(BaseSettings):
        url: str = Field(default="sqlite:///", env="db_url")

    class ApplicationSettings(BaseSettings):
        db = DatabaseSettings()

    class ApplicationContainer(containers.DeclarativeContainer):
        config = providers.Configuration()
        ...
    ```
    ```python
    # main.py 
    from app.containers import ApplicationContainer, ApplicationSettings

    if __name__ == '__main__':
        container = ApplicationContainer()
        container.config.from_pydantic(ApplicationSettings())
        ...

    ```

#### Factory Provider
- 팩토리 클래스의 첫 번째 인자에는 생성할 객체, 그 뒤에 생성자에 주입할 인자를 넣어줄 수 있습니다.
- 앞서 설명한 바와 같이, 이를 체이닝하여 사용하는 방식도 가능합니다. (타이어 예시 참고)

#### Singleton Provider
- 싱글톤 방식으로 동작하는 객체를 만들며, 주로 DB 엔진이나 세션을 싱글톤으로 만듭니다.
- 하나의 컨테이너당 하나의 객체가 바인딩 되도록 합니다.
- 스레드에서 공유하기 위한 싱글톤 객체가 필요하다면, `ThreadSafeSingleton` Provider를 사용할 수도 있습니다.
- DB 세션을 하나만 사용한다면 다음과 같이 싱글톤 패턴으로 관련 세팅을 주입할 수 있습니다.  
    ```python
    # main.py
    class ApplicationContainer(containers.DeclarativeContainer):
        config = providers.Configuration()
        engine = providers.Singleton(create_engine, url=config.db.url, echo=True, connect_args={'check_same_thread': False}, poolclass=StaticPool)
        session_factory = providers.Singleton(sessionmaker, bind=engine)
        session = providers.Singleton(ScopedSession, session_factory)
    
    ```
    - Configuration Provider의 예시와 같습니다.

### Wiring
- 앞서 설정한 의존성들을 애플리케이션 로직에 주입시켜 주는 역할을 합니다. 
- 컨테이너와 그 안의 프로바이더에서 만ㄴ든 의존성을 사용해주기 위해, 주입을 할 파이썬 모듈을 선택해야합니다.
- 의존성을 사용할 함수에 `@inject` 데코레이터를 추가합니다. 데코레이터가 추가된 함수의 인자에 Provider를 추가하여 내부에서 이를 사용할 수 있습니다. 




### 참고
- [humphreyahn님의 블로그](https://www.humphreyahn.dev/blog/dependency-injector)
- [neonkid님의 블로그](https://blog.neonkid.xyz/279)