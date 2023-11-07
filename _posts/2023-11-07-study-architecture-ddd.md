---
layout: archive
title:  "[Architecture] Clean Architecture in Python"
date:   2023-11-07 00:05:07 +0900
categories: 
    - Study
---

[https://github.com/Enforcer/clean-architecture](https://github.com/Enforcer/clean-architecture)

[Python으로 클린 아키텍처 적용하기](https://velog.io/@jahoy/Python%EC%9C%BC%EB%A1%9C-Clean-Architecture-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0)

## 도메인 주도 설계 (DDD)가 필요하게 된 이유

**일반적 설계 모델(CRUD 방식)의 문제점**

- 생명주기(Invariant Span)가 single model을 넘어서는 경우에 로직이 복잡해집니다.
- code가 서로 강하게 결합(tightly coupled)되어 있는 경우, 비즈니스 로직을 테스트하기 위해 미리 많은 작업을 세팅해야하는 경우가 생깁니다. (db 불러오기, 웹 프레임워크 코드 실행)
- 써드파티 서비스들과의 결합이 어려워집니다. 예를 들어, 외부 결제 모듈과 처음 코드를 결합시켰다면, 다른 결제 모듈로 대체하는 경우 수정하기 어려워집니다.

**Clean Architecture의 장점**

- Framework의 독립성: 프레임워크를 업그레이드 하거나, 교체하기 쉬워집니다.
- Testaiblity: 모든 비즈니스 로직을 unit test할 수 있습니다.
- UI/API, 서드파티 모듈, 데이터베이스를 독립적으로 사용할 수 있습니다.
- 매우 유연하며, 확장 가능이 쉽습니다. (CQRS, Event-Sourcing, DDD 방식을 필요로 한다면 적용 가능)

**비즈니스 룰**

- 컴퓨터 프로그램에서 실세계의 규칙에 따라 데이터를 생성, 표시, 저장, 변경하는 부분을 일컬으며, 도메인 로직이라고도 말합니다.
- 유저의 입력(UI)과 DB 사이에서 발생한 정보 교환을 위한 특정 알고리즘이나 규칙이 정의되며, 고객의 요구에 따라 변경될 수 있습니다.

**시스템 아키텍쳐**

- 시스템의 구조(structure), 행위(behavior), 뷰(views)를 정의하는 개념 모델입니다.
- 시스템의 목적을 달성하기 위해 각 컴포넌트가 어떻게 상호작용하며, 어떻게 정보가 교환 되는지 설명합니다.

## **Layers of Clean Architecture**

- External World: DB, API, Network등 코드의 바깥쪽 외부 세계를 의미합니다.
- Infrastructure: DB와 API와 같은 것들에 대한 adapter의 역할을 의미합니다.
    
    **Adapters**
    
    - Domain과 Infrastructure 사이의 번역기 역할을 수행합니다.
    - GUI의 MVC 아키텍처를 완전히 내포합니다. GUI(클라이언트)의 데이터를 받아 Use case들과 Entity들에게 편리한 형태로 repackage 합니다.
- Application
    - Use Case: 하나의 비즈니스 로직으로, 유저 하나의 액션으로 구성됩니다. 입찰하기, 입찰 취소하기 등을 의미합니다. (interface의 구체화 버전으로 생각할 수 있습니다.)
    - Interface: 추상화된 use case와 infrastructure을 추상화합니다.
    
    ```python
    # application/interfaces/email_sender.py
    import abc
    class EmailSender(abc.ABC):
           @abc.abstractmethod
           def send(self, message: EmailMessage) -> None:
               pass
    # infrastructure/adapters/email_sender.py
    import smtplib
    from application.interfaces.email_sender import EmailSender
    class LocalhostEmailSender(EmailSender):
        def send(self, message: EmailMessage) -> None:
            server = smtplib.SMTP('localhost', 1025)
            # etc
    ```
    
- Domain: identity를 가진 Entity로 구성되며, 비즈니스 룰을 담고 있습니다

### 클린 아키텍쳐의 계층과 방향성

- External World → Infrastructure → Application → Domain의 방향성을 가집니다.

- **Dependency Rule**: 화살표 방향으로 의존성을 가지고 있습니다.
    - Application은 Domain을 사용해도, Domain은 Application을 사용하지 못합니다.
    - Infrastructure은 Application을 사용해도, Application은 Infrastructure을 사용하지 못합니다.
- **Business Rules, Processes**: Application Layer와 Domain Layer 상에서 이루어지며, External World를 전혀 모르는 상태로 쉽게 Buisiness Logic의 테스트 코드를 작성할 수 있습니다.
- **Boundary**: 여러개의 Interface들로 정의 됩니다. 모든 detail은 boundary 뒤에 숨어있습니다.
- **Input DTO, Output DTO, Input Boundary**: Application Layer 안에 Detail을 숨기는 Boundary를 형성합니다.
    - Input DTO: Boundary에 진입할 수 있는 input argument(Request)입니다.
    - Output DTO: Response
    - Input Boundary: Use Case들을 추상화한 Interface입니다.

```python
@dataclass
class PlacingBidInputDto:
    bidder_id: int
    auction_id: int
    amount: Decimal   
    
@dataclass
class PlacingBidOutputDto:
    is_winning: bool
    current_price: Decimal                                   
    
class PlacingBidInputBoundary:
    @abc.abstractmethod
    def execute(self, request: PlacingBidInputDto) -> None:
```

## Control Flow in Architecture

1. Controller: HTTP 요청을 repack하여 Input DTO로 보내며, 이는 Input Boundary(Use Case의 인터페이스)의 input으로 전달됩니다.
2. Input Boundary: Input DTO를 이용하여 Input DTO의 데이터를 사용하며, 필요한 Entity들을 데이터 액세스 인터페이스를 통해 DB로부터 fetch합니다.
3. Entity: 비즈니스 로직을 수행합니다. 데이터 액세스 인터페이스를 통해 변경 사항을 저장합니다.
4. Use Case: Output Boundary(Presenter의 인터페이스 역할을 함)에 Output DTO를 전달합니다. 이 때, Presenter는 Output DTO의 데이터를 reformat하여 View에 최종적으로 보여주는 역할을 합니다.

- Input DTO, Input Boundary, Output Boundary, OutputDto, UseCase, Data Access Interface는 Application Layer에 속합니다.
- Entity는 Domain Layer에 속합니다.

### Sequence diagram

#### 비즈니스 요구사항 (예시)

- 입찰자들은 경매에 입찰할 수 있다.
- 경매에는 모든 입찰자가 볼 수 있는 실시간 가격이 있다.
    - 현재 가격은 가장 낮은 낙찰가의 양에 따라 결정된다.
    - 승자가 되려면, 현재 가격보다 높은 가격을 제공해야 한다.
- 경매에는 시작 가격이 있으며, 시작 가격보다 낮은 금액의 새로운 입찰은 수락되지 않는다.


#### Input Boundary, Input DTO

[데이터 클래스(dataclasses)](https://velog.io/@sawol/%EB%8D%B0%EC%9D%B4%ED%84%B0-%ED%81%B4%EB%9E%98%EC%8A%A4dataclasses)

```python
@dataclass
class PlacingBidInputDto:
    bidder_id: int
    auction_id: int
    amount: Decimal
 
class PlacingBidInputBoundary(abc.ABC):
    @abc.abstractmethod
    def execute(self, input_dto: PlacingBidInputDto, 
    		presenter: PlacingBidOutputBoundary) -> None:
	pass
```

- 입력 데이터와 관련된 부분입니다.
- `@dataclass`는 클래스 내부의 필드들의 형식을 정의함과 동시에, 매직 메서드(__init__, __repr__ 등)을 기본적으로 세팅해주어 편리합니다.
- `@abc.abstractmethod`는 해당 추상 클래스를 상속받는 구체 클래스에서 반드시 메서드를 사용하도록 강제하는 애노테이션입니다.
- Input Boundary는 Use Case를 추상화합니다.

#### Use Case

```python
class PlacingBidUseCase(PlacingBidInputBoundary):
"""
1. Auction entity를 data access를 통해 retrieve
2. entity의 place bid 메소드 호출 (비즈니스 로직 수행)
3. Command 역할: 업데이트 상태변경 및 저장, return 값 없는 것이 특징
4. Output DTO 생성
5. Output DTO를 Output Boundary에 전달
"""
    def __init__(self, data_access: AuctionsDataAccess, output_boundary:
       PlacingBidOutputBoundary) -> None:
        self._data_access = data_access
        self._output_boundary = output_boundary
        
    def execute(self, input_dto: PlacingBidInputDto) -> None:
        auction = self._data_access.get_auction(input_dto.auction_id)
        auction.place_bid(input_dto.bidder_id, input_dto.amount)
        self._data_access.save_auction(auction)
        output_dto = PlacingBidOutputDto(
            input_dto.bidder_id in auction.winners, auction.current_price
        )
        self._output_boundary.present(output_dto)
```

- 모든 비즈니스 로직이 담긴 부분입니다.
- interface들(Higher Layer)과 코드를 구성하고 결합합니다.
- 앞서 말한 방향성에 따라, 뒷단에서 이루어지는 concrete Implementation은 모릅니다.
(Dependency Injection을 통해 Mapping 해주게 될 것이기 때문)
- PlacingBidUseCase는 Use Case로, Input Boundary를 구체화합니다.

#### Output Boundary, Output DTO

```python
@dataclass
class PlacingBidOutputDto:
    is_winning: bool
	current_price: Decimal

class PlacingBidOutputBoundary(abc.ABC):
    @abc.abstractmethod
    def present(self, output_dto: PlacingBidOutputDto) -> None:
    	pass
        
    @abc.abstractmethod
    def get_presented_data(self) -> dict:
    	pass
```

- Output Boundary는 Presenter를 추상화합니다.

#### Presenter

```python
# Presenter: 최종적으로 view에 보여줄 data를 reformat 시키는 역할
class PlacingBidWebPresenter(PlacingBidOutputBoundary):
    def present(self, output_dto: PlacingBidOutputDto) -> None:
        self._formatted_data = {
            'current_price': f'${output_dto.current_price.quantize(".01")}',
            'is_winning': 'Congratulations!' if output_dto.is_winning else ':('
        }
        
    def get_presented_data(self) -> dict:
        return self._formatted_data
```

- Presenter는 View에 최종 결과를 보여주게 됩니다.

### inject 모듈을 사용한 Dependency Rule 생성

```python
import inject

def di_config(binder: inject.Binder) -> None:
    binder.bind(AuctionsDataAccess, DbAuctionsDataAccess())
    binder.bind_to_provider(PlacingBidOutputBoundary, PlacingBidWebPresenter)

inject.configure(di_config)
```

- `di_config`: 추상 클래스와 구현체를 연결하여 Dependency Rule을 생성합니다. 이를 통해, 추상 클래스를 사용할 때 특정 Implementation이 사용되도록 할 수 있습니다.

```python
class AuctionsDataAccess(abc.ABC):
    @abc.abstractmethod
    def get(self, auction_id: int) -> None:
        pass
        
    @abc.abstractmethod
    def save(self, auction: Auction) -> None:
    	pass
```

- `Data Access`: 데이터베이스의 인터페이스 역할을 수행합니다.

```python
@dataclass
class Bid:
    id: Optional[int]
    bidder_id: int
    amount: Decimal

# Entities - Auction
class Auction:
    def __init__(self, id: int, starting_price: Decimal, bids: typing.List[Bid]):
       self.id = id
       self.starting_price = starting_price
       self.bids = bids
       
    def place_bid(self, user_id: int, amount: Decimal) -> None:
       pass
       
    @property
    def current_price(self) -> Decimal:
       pass
       
    @property
    def winners(self) -> typing.List[int]:
       pass
```

## Clean Architecture 변형할 수 있는 형태 소개

### Presenter에서 get 함수 사용

- View의 return 값으로 Presenter의 템플릿을 반환하므로써, Presenter가 렌더링 역할을 담당하도록 합니다.

```python
def index(request: HttpRequest) -> HttpResponse:
	return HttpResponse(f'Hello, world!')
---
def index(request: HttpRequest) -> HttpResponse:
	...
	return presenter.get_html_response()
```

### CQRS 방식

- Output DTO와 Output Boundary 대신, CQRS 방식으로 처리하는 방법도 있습니다.

### Input Boundary 제거가능

## User Case 대안

### Facade 패턴

- User Case가 복잡하지 않은 형태라면 Facade 패턴을 사용하여 디자인할 수 있습니다.
- 순차적인 메서드들을 single function 안에 넣어서 구현하는 방식입니다.
- get an Entity using Data Access Interface, call an Entity’s method, then save it back.

### Mediator(Command Bus)

- Output DTO를 사용하지 않는다면, Input DTO를 CQRS의 Commands로 대체하고, Command Bus라고 불리는 Mediator를 도입하는 것도 좋은 대안이 될 수 있습니다.
- 이 때, Use Case는 Command Handler가 되며, Command는 DTO가 됩니다.

```python
def placing_bid_view(...) -> None:
	command = PlaceBid(..)
	command_bus.dispatch(command)
```

- Handler로부터 완전히 decouple 시킬 수 있습니다. 따라서, Command classes와 Command Bus만 알고 있으면 됩니다.

## Dependency Injection

- 추상화에 대응되는 어떤 Implementation을 mapping 합니다.

```python
class CreditCardPaymentGateway(PaymentGateway):
	pass

# tight coupling (implementation을 그대로 사용한 경우)
class Order:
	def finalise(self) -> None:
		payment_gateway = CreditCardPaymentGateway(
			settings.payment['url'], settings.payment['credentials']
		)
		payment_gateway.pay(self.total)

# loose coupling (payment_gateway로 추상화한 class를 사용하는 경우)
class Order:
	def __init__(self, payment_gateway: PaymentGateway) -> None:
		self._payment_gateway = PaymentGateway
	def finalise(self) -> None:
		self._payment_gateway.pay(self.total)
```

- Configuration을 통해 Dependency Injection을 관리하면, if문을 사용하지 않아도 됩니다.

## CQRS

- 시스템의 상태를 변경하는 코드와 상태 변경없이 data를 read하는 코드를 분리합니다.
- CQRS는 writing을 위해 정규화된 데이터를 사용는 것과, 주기적인 간격으로 업데이트를 유지하는 데이터 메커니즘을 쿼링하기 위해 비정규화된 데이터를 사용하는 것을 허용합니다.
- Event Sourcing 방식과의 궁합이 좋습니다.

### **Commands**

- 시스템의 상태를 변화시킵니다.
- Business requirements 변화에 영향을 많이 받습니다.
- 실행 순서가 중요합니다.

### **Queries**

- 시스템의 상태를 변경하지 않기 때문에, 간단하고 안전합니다.

![Untitled](Clean%20Architecture%20in%20Python%2002f338c7dcc741178f7b7df9c3804592/Untitled%204.png)

### **Command**

- Commands는 DTO역할을 하며 Command Handlers에 의해 실행됩니다.
- 개발자는 application에서 service들을 사용하기 위해 Command Handler의 존재를 알 필요가 없습니다.
- Use Case를 sending a Command로 대체해서 생각합니다.
    
    Command(DTO) - Command Bus - Command Handler
    

### **Query**

#### Query를 DTO로 다루는 방법

- Command를 다루는 방식과 동일하게 동작합니다. 각각의 쿼리를 single class (DTO) 형태로 나타냅니다.
- 개발자는 Query Handler의 존재를 알 필요가 없습니다.
- Query class는 Application Layer에 속하고, Query Handler는 Infrastructure layer에 속합니다.
    
    Query(DTO) - Query Bus - Query Handler
    

```python
class GetListOfDeliveryAddresses(Query):
	Dto = List[DeliveryAddress]
	def __init__(self, user_id: int) -> None:
		self.user_id = user_id
	def query_handler(query: GetListOfDeliveryAddreses)
			-> GetListOfDeliveryAddresses.Dto:
		...

# using via QueryBus
query = GetListOfDeliveryAddresses(user_id=1)
result = query_bus.dispatch(query)
```

#### Queries를 분리된 클래스들로 다루는 방법

- Query Bus, Query Handler를 사용하지 않고, 각각의 Query는 Abstract class로 Application Layer에 있도록 합니다.
- concrete implementation은 Infrastructure Layer에 위치하도록 합니다.

```python
# somewhere in Application Layer
class GettingListOfDeliveryAddresses(Query):
	Dto = List[DeliveryAddress]
	def __init__(self, user_id: int) -> None:
		self.user_id = user_id
	@abc.abstractmethod
	def excute(self) -> Dto:
		pass

# in Infrastructure layer
class SqlGettingListOfDeliveryAddresses(GettingListOfDeliveryAddresses):
	def excute(self) -> GettingListOfDeliveryAddresses.Dto:
		models = self.session.query(Address).filter(
			(Address.type == Address.DELIVERY) & (Address.user_id == self.user_id)
		)
		return [self._to_dto(model) for model in models]

# 설정파일에서 Sql 관련 설정으로 바인드 해줍니다.
@inject(config=Config)
def configure(binder, config):
	binder.bind(
		GettingListOfDeliveryAddresses,
		to=SqlGettingListOfDeliveryAddresses,
	)

@app.route("/auction/bids", methods=["POST"])
def auction_bids(query: GettingListOfDeliveryAddresses) -> Response:
	result = query.excute()
	...

```