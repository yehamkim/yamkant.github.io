var store = [{
        "title": "[Error Async] Promise.allSettled",
        "excerpt":"문제 발생 상황 외부 발주사에서 상품을 등록하는 API를 호출하던 중에, Sequelize가 Too many connections를 반환하며 서버가 비정상적으로 동작하였습니다. 코드를 살펴보니, 다른 개발자가 Promise all 코드를 통해 API 호출 및 Database에 값을 반영하는 작업을 모두 비동기적으로 진행하고 있었습니다. 비동기 작업과 Sequelizer Database 점유에 대한 학습의 필요성을 느끼게 되었습니다. 참고링크 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled#try_it...","categories": ["Error Async"],
        "tags": [],
        "url": "/error%20async/errorasync-promise-allsettled/",
        "teaser": null
      },{
        "title": "[Django] ORM 사용 방법을 위한 기록",
        "excerpt":"글을 작성하게 된 계기 ‘우아한테크세미나’에서 이동욱(향로)님께서 제어할 수 없는 것들에 의존하지 않기라는 주제로 발표하셨습니다. 제어하기 쉬운 부분은 Business Logic을 담당하는 애플리케이션이고, UI와 Data 파트는 상대적으로 제어하기가 어려운 영역입니다. 제어할 수 없는 부분인 Database가 SQL이든, NoSQL이든 어떻게 변경 되더라도 대응하기 쉬운 애플리케이션 코드를 작성하는 것이 좋은 코드라는 말씀에 공감되었습니다. Django ORM의...","categories": ["Django Deep"],
        "tags": [],
        "url": "/django%20deep/django-orm-deep1/",
        "teaser": null
      },{
        "title": "[Django] ORM 사용시 주의사항",
        "excerpt":"글을 작성하게 된 계기 ORM 사용에 익숙해지면 알더라도 정리하지 않고 넘어가는 부분이 많습니다. 실수하기 쉬운 부분들을 정리해두고 주기적으로 해당 게시글을 회독하면 좀 더 지혜롭게 코드를 작성할 수 있을 거라고 생각되어 작성했습니다. 레퍼런스 ‘2020 파이콘’에서 김성렬님의 강의 김성렬님의 ORM 관련 블로그 글 1 김성렬님의 ORM 관련 블로그 글 2 쿼리셋 캐시를...","categories": ["Django Deep"],
        "tags": [],
        "url": "/django%20deep/django-orm-deep2/",
        "teaser": null
      },{
        "title": "[Study] 백엔드 로드맵 따라가며 공부하기",
        "excerpt":"Python pip 테스트 unittest/pyUnit pytest doctest 동기/비동기 프레임워크 동기: Pyramid / Flask 비동기: Tornado / gevent / aiohttp 웹관련 웹서버: Coddy / Apache / Nginx Restful APIs MVC 패턴 인증: JWT / OAuth2.0 SOLID 정규 표현식 보안 GraphQL Docker DB RDB: 오라클 / PostgreSQL / MariaDB / MySQL / MSSQL...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-1/",
        "teaser": null
      },{
        "title": "[Django] Logger는 어떻게 설정할까?",
        "excerpt":"글을 작성하게 된 계기 퇴근 이후의 로그를 보는 것이 하루의 일과의 시작인 만큼, 로그가 구체적일수록 어떻게 보다 나은 서비스를 만들 수 있을까 뚜렷하게 고민하게 되는 것 같습니다. 로거를 공부하며 장고 미들웨어에 대해 학습할 수 있었습니다. 이를 계기로, 커스텀 데코레이터 사용 방법 또한 정리해 두면 좋을 것 같다고 생각했습니다. 로그 작성에...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-logger/",
        "teaser": null
      },{
        "title": "[Django] 배치서버는 어떻게 구성할까?",
        "excerpt":"글을 작성하게 된 계기 배치 서버는 자동화에 필수적인 기능이기 때문에, 사용의 편의성을 어마어마하게 가져다줍니다. 배치 서버를 사용하게 되면, 동기/비동기 처리 등 프레임워크에서 제공하는 다양한 기술들을 사용해보기 용이할 것 같다고 생각되었습니다. Django에서 배치서버를 설정하는 방법에 대해 소개합니다. 설정 참고: https://cholol.tistory.com/531 Django에서 Command는 python manage.py &lt;command&gt;로 동작되는 기능들입니다. 예제: python manage.py makemigrations...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-batch/",
        "teaser": null
      },{
        "title": "[Django] Swagger는 어떻게 설정할까?",
        "excerpt":"swagger 설정 현재 디렉터리 레벨 .venv code - api(app) - urls.py - mysite(base) - settings.py - urls.py - static 설치항목 관련 모듈 설치 및 settings.py에 설정 항목을 추가합니다. $ pip install drf-yasg # settings.py INSTALLED_APPS = [ ... 'django.contrib.staticfiles', 'drf_yasg', ... ] ... STATIC_URL = '/static/' STATICFILES_DIRS = [BASE_DIR, 'static',]...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-swagger/",
        "teaser": null
      },{
        "title": "[Django] Transaction은 어떻게 사용할까?",
        "excerpt":"Database transactions Django의 기본 동작은 autocommit 모드를 실행시키는 것으로, transaction이 활성화되지 않으면, 각 쿼리는 즉시 db에 커밋됩니다. Django는 transaction 들이나 savepoint를 자동으로 사용하여 ORM 연산들(쿼리들의 update/delete)의 묶음을 보장합니다. transaction은 기본적으로 사용비용이 드는 편이기 때문에, overhead를 최소화하기 위해 가능한 한 transaction을 짧게 유지하는 것이 좋습니다. HTTP 요청들에 transaction들 연결하기 연결을 위해...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-transaction/",
        "teaser": null
      },{
        "title": "[Book] 가상 면접 사례로 배우는 대규모 시스템 설계 기초",
        "excerpt":"가상 면접 사례로 배우는 대규모 시스템 설계 기초 4장 처리율 제한 장치 수용 가능한 트래픽 이상의 트래픽이 발생할 때 처리하는 방식을 생각합니다. 보통 API 서버 측에 트래픽 제한 장치 뿐 라니라, SSL 종단, 사용자 인증을 담당하는 클라우드 서비스를 사용합니다. 처리율 제한 알고리즘 검색해 보기. http 규약에서 트래픽 관련 한도 제한이...","categories": ["Book"],
        "tags": [],
        "url": "/book/book-1/",
        "teaser": null
      },{
        "title": "[Django] Sequelizer는 어떻게 사용할까?",
        "excerpt":"글을 작성하게 된 계기 Data를 함수간 전달하거나 다른 레이어로 전달하는 경우에 항상 빠진 요소가 없는지, Validation 확인이 필요한지 판단하는 코드를 작성해야합니다. 이를 수월하게 하기 위해 custom exception을 만든 적도 있고, @dataclass를 활용한 적도 있지만 drf가 제공하는 기능을 사용할 때 model과의 연동도 수월하며 사용성이 좋았어서 공유하고자 글을 작성합니다. 참고: https://www.django-rest-framework.org/api-guide/serializers/ Post의...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-serializer/",
        "teaser": null
      },{
        "title": "[Server] Nginx를 이용한 무중단 배포 방법 (Nginx - Django)",
        "excerpt":"글을 작성하게 된 계기 기존 서비스에서는 하나의 docker-compose 안에 nginx, django, api_server, db 등 모든 컨테이너를 넣어 한 번에 실행시켰습니다. 하지만, 이러한 구조는 network를 서로 공유할 수 있다는 편리함을 가졌지만 서로 독립적으로 제어할 수 없다는 단점을 가지고 있습니다. server 증설 및 감축을 위해 설정을 간소화하는 방법을 모색 중에, 컨테이너를 분리하고...","categories": ["Server"],
        "tags": [],
        "url": "/server/server-1/",
        "teaser": null
      },{
        "title": "[Django] 배포/개발 환경은 어떻게 설정할까?",
        "excerpt":"최종 목표 .env 파일에 설정된 DJANGO_SETTINGS_MODULE에 따라서 배포환경에 맞는 settings.py 사용 Django Container Setting Django 폴더 구조 web - Dockerfile - apps/ - config/ - settings/ - base.py - development.py - production.py - wsgi/ - development.py - production.py ... - entrypoint.sh - manage.py - requirements.txt - .env Django 배포 환경...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-setting/",
        "teaser": null
      },{
        "title": "[Django] Form 클래스는 어떻게 사용할까?",
        "excerpt":"FORM HTML Form은 웹 페이지에서 필드나 위젯들의 묶음을 말합니다. 폼을 통해 사용자의 입력들을 받으므로, POST 요청으로 server에 데이터를 전달합니다. (CSRF 토큰을 통해 위조를 방지하기 위한 안정적인 대책을 세울 수 있습니다.) Djnago 폼 처리 과정 브라우저에서 form을 포함한 페이지를 요청합니다. Django는 “unbound” default form을 서빙합니다. (이 시점에서 폼은 초기값이 있지만, Client가...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-form/",
        "teaser": null
      },{
        "title": "[SQL] dbcp란 무엇이며, api 서버와 DB는 어떻게 통신할까?",
        "excerpt":"DBCP (DB Connection Pool) 참고: https://youtu.be/zowzVqx3MQ4 해당 글은 위의 쉬운코드 님의 영상을 토대로 요약한 글입니다. 통신방법 백엔드 서버와 DB 서버는 TCP 기반으로 통신합니다. 따라서, connection을 맺어 열거나 닫아서 연결하는 과정이 필요합니다. DB 서버를 열고 닫을 때마다 시간적인 비용이 발생하게 되고, 이는 서비스 성능에 좋지 않습니다. DBCP의 개념과 원리 백엔드 서버는...","categories": ["Database"],
        "tags": [],
        "url": "/database/database-dbcp/",
        "teaser": null
      },{
        "title": "[Book] [Real MySQL 8.0] 내용 정리 ",
        "excerpt":"CH 4.1.4 플러그인 스토리지 엔진 모델 MySQL의 독특한 구조 중 대표적인 것이 플러그인 모델입니다. MySQL에서 쿼리가 실행되는 과정 대부분은 MySQL엔진에서 처리되고, 마지막 ‘데이터 읽기/쓰기’ 자업만 스토리지 엔진에 의해 처리됩니다. (데이터 읽기/쓰기 작업은 대부분 1건의 레코드 단위로 처리) MySQL 엔진은 스토리지 엔진을 조정하기 위해 핸들러를 사용합니다. 따라서 Handler_로 시작되는 상태변수가 많습니다....","categories": ["Book"],
        "tags": [],
        "url": "/book/database-1/",
        "teaser": null
      },{
        "title": "[Error Async] connection pool 제한에 따른 비동기 처리",
        "excerpt":"오류 내용 상품의 상태(재고량 및 단종여부)를 주기적으로 업데이트하기 위해, 배치서버를 통해 국민클럽B2B(폐쇄몰)의 업데이트하는 배치 함수를 비동기적으로 실행시킵니다. 하지만, DBCP를 고려하지 않은 설계로 인해, too many connections 오류와 함께 서버가 중단되었습니다. 해결 내용 정해진 개수의 connection pool에만 접근 가능하도록 Sequelize option을 사용하여 connection pool을 제한하였습니다. 제한된 connection pool에서 task들이 비동기적으로 실행될...","categories": ["Error Async"],
        "tags": [],
        "url": "/error%20async/errorasync-promise-pool/",
        "teaser": null
      },{
        "title": "[Django] 커스텀 유저 및 jwt는 어떤 방식으로 설정할까?",
        "excerpt":"Custom User Registration # requirements.txt asgiref==3.6.0 Django==4.2.1 djangorestframework==3.14.0 djangorestframework-simplejwt==5.2.2 PyJWT==2.7.0 pytz==2023.3 rest-framework-simplejwt==0.0.2 sqlparse==0.4.4 djangorestframework-simplejwt를 사용하여 개발합니다. # settings.py INSTALLED_APPS = [ 'django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles', # restframework \"rest_framework\", \"rest_framework_simplejwt\", \"rest_framework_simplejwt.token_blacklist\", # custom apps \"members\", \"core\", \"mytest\", ] ... # Settings for JWT Authentication SIMPLE_JWT = { \"ACCESS_TOKEN_LIFETIME\": timedelta(hours=1),...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-auth/",
        "teaser": null
      },{
        "title": "[Django] API를 어떻게 명세하여 사용할까?",
        "excerpt":"Open API와 OAS, Swagger Open API란? Open API는 누구나 사용할 수 있도록 endpoint가 개방된 API를 의미합니다. OpenAPI Specification(OAS)는 OpenAPI(띄어쓰기 없음)가 표기하기도 하며, RESTful 형식의 API 정의된 규약에 따라 json이나 yaml로 표현하는 방식을 의미합니다. 직접 소스코드나 문서를 보지 않더라도 서비스를 이해할 수 있다는 장점이 있습니다. Swagger란? 2010년대 초 Tam Wordnik이 개발하기...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-spectacular/",
        "teaser": null
      },{
        "title": "Django Custom User",
        "excerpt":"Django custom user 생성을 위한 설정 추가 작업을 위한 Directory Level web - apps/ - config/ - settings/ - base.py - development.py - production.py ... - core/ - serializers.py - models.py ... - members/ - urls/ - members.py - models.py - serializers.py - views.py ... # config.settings.base.py INSTALLED_APPS = [...","categories": [],
        "tags": [],
        "url": "/django-custom-user/",
        "teaser": null
      },{
        "title": "[Server] AWS ECS를 사용한 기본적인 배포환경 구성",
        "excerpt":"최종 목표 ECS 내에서 nginx와 django를 사용한 서버 구성 참고: git repository - 구체적인 코드 및 이미지를 볼 수 있습니다. 이후 포스팅: VPC 구성 / ALB 구성 / Network Bridge 모드에서 Namespace 사용 순서 AWS ECS CLI 설치 및 계정 생성 Docker 구성 및 테스트 ECR 생성 및 업로드 ECS...","categories": ["Server"],
        "tags": [],
        "url": "/server/server-aws-ecs/",
        "teaser": null
      },{
        "title": "[Server] Github action을 활용한 CI/CD 구성",
        "excerpt":"Github action Work Flow 구성 github action에서는 아래 템플릿을 기본적으로 제공합니다. (Repository -&gt; Actions -&gt; New workflow [배너] -&gt; 원하는 Framework 검색) 템플릿은 해당 프로젝트 리파지토리의 /.github/workflows/ 디렉토리에 .yaml 형식으로 작성합니다. 이 때, .env 파일 내의 정보는 보안상 workflow에 기입할 수 없으므로, 각각 github repository settings에서 관리합니다. (Repository -&gt; Settings...","categories": ["Server"],
        "tags": [],
        "url": "/server/server-githubaction/",
        "teaser": null
      },{
        "title": "[Study] AWS 기본 개념",
        "excerpt":"Amazon VPC AWS에 생성하는 가상의 네트워크(Virtual Private Cloud)를 의미합니다. EC2나 RDS의 경우, VPC를 먼저 선택해야합니다. VPC내에 서버를 설치하면 해당 네트워크에 소속되지만, 별도로 설정하지 않으면 격리된 네트워크입니다. 외부와 통신하기 위해 인터넷 혹은 회사 LAN과 연결해야합니다. 기능 네트워킹 환경을 설정합니다. IPv4, IPv6 둘 다 사용가능합니다. CIDR 블록, 서브넷 마스크를 설정할 수 있습니다....","categories": ["Study"],
        "tags": [],
        "url": "/study/study-aws-concept/",
        "teaser": null
      },{
        "title": "[Study] Python Clean Code - OOP",
        "excerpt":"SOLID 원칙 S: 단일 책임 원칙 (Single Responsibility Principle) O: 개방/폐쇄의 원칙 L: 리스코프(Liskov) 치환 원칙 I: 인터페이스 분리 원칙 (Interface Segregation Principle) D: 의존성 역전 원칙 (Dependency Inversion Principle) 단일 책임 원칙 SRP은 소프트웨어 컴포넌트가 단 하나의 책임을 져야한다는 원칙입니다. 따라서, 구체적인 하나의 일을 담당해야하며, 변화해야할 이유는 단 하나뿐입니다....","categories": ["Study"],
        "tags": [],
        "url": "/study/study-osi-model/",
        "teaser": null
      },{
        "title": "[Study] Python Clean Code - Decorator",
        "excerpt":"Decorator 원본 함수(외에도 메서드, 제너레이터, 클래스)를 직접 수정하지 않더라도, 간접적으로 기능을 수정할 수 있는 방법입니다. 함수 데코레이터 아래와 같은 방식으로 데코레이터의 형태를 구현할 수 있습니다. def retry(operation): @wraps(operation) def wrapped(*args, **kwargs): last_raised = None RETRIES_LIMIT = 3 for _ in range(RETRIES_LIMIT): try: return operation(*args, **kwargs) except ControlledException as e: logger.info(\"retrying...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cleancode-decorator/",
        "teaser": null
      },{
        "title": "[Study] Python Clean Code - Descriptor",
        "excerpt":"Descriptor 디스크립터를 구현하기 위해 두 가지 클래스(클라이언트 클래스, 디스크립터 클래스)가 필요합니다. 핵심 용어 client: ClientClass의 인스턴스입니다. descriptor: DescriptorClass의 인스턴스입니다. ClientClass: 솔루션을 위해 생성한 일반적인 추상화 객체입니다. class attribute로 discriptor를 갖습니다. (필수) DescriptorClass: 디스크립터 로직의 구현체로, 디스크립터 프로토콜을 구현한 클래스의 인스턴스입니다. 매직메서드 __get__, __set__, __delete__, __set_name 중 최소 하나 이상을 포함해야합니다....","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cleancode-descriptor/",
        "teaser": null
      },{
        "title": "[Study] Python Clean Code - Unittest",
        "excerpt":"Unit Test 단위 테스트란, 다른 코드의 일부분이 유효한지를 검사하는 코드입니다. 단위 테스트는 소프트웨어의 핵심이 되는 필수적인 기능으로서 일반 비즈니스 로직과 동일한 수준으로 다루어져야 합니다. 격리: 단위 테스트는 독립적이며, 비즈니스 로직에만 집중합니다. 이전 상태와 관계없이 임의 순서로 실행될 수 있어야 합니다. 성능: 신속하게 실행되어야 하며, 반복적으로 여러 번 실행될 수 있어야...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cleancode-unittest/",
        "teaser": null
      },{
        "title": "[Study] Load Balancer",
        "excerpt":"작성 계기 면접질문 중, nginx를 사용한 로드밸런싱이 OSI Layer의 어떤 계층에서 일어나는지에 대한 질문에 대해 대답하지 못해, 공부를 시작하게 되었습니다. 로드밸런서 트래픽을 받아서 여러 대의 서버에 분산시키는 하드웨어/소프트웨어를 의미합니다. 부하 분산에는 L4 Load Balancer와 L7 Load Balancer가 사용됩니다. L4 Load Balancer IP Port를 활용하여 서버부하분산을 하는 것을 의미합니다. 적합한 server...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-load-balancer/",
        "teaser": null
      },{
        "title": "[Study] Python Clean Code - Good Code",
        "excerpt":"계약에 의한 디자인 계약: 소프트웨어 컴포넌트 간의 통신 중에 반드시 지켜져야 하는 규칙을 강제하는 것입니다. 사전조건: 코드가 실행되기 전에 확인해야 할 조건들로, 유효성 검사, DB 및 파일 등에 대한 것들로, 서버가 담당할 부분입니다. 사후조건: 코드 실행 이후에 함수 반환 값의 유효성 검사로, 클라이언트가 담당할 부분입니다. 위의 두 가지 조건을 통해,...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cleancode-goodcode/",
        "teaser": null
      },{
        "title": "[Study] Django - ORM Basic",
        "excerpt":"ORM이란 무엇인가? 객체지향 프로그래밍은 클래스를 사용하지만, 관계형 데이터베이스는 테이블을 사용하기 때문에, 객체 모델과 관계형 모델 간에 불일치가 발생합니다. ORM은 SQL문을 자동으로 생성하여 이러한 불일치를 해결할 수 있습니다. ORM의 장단점 장점 완벽한 객체지향적인 코드 SQL문이 아닌 클래스의 메서드를 통한 데이터베이스 조작이 가능하기 때문에, 개발자가 객체 모델만을 이용해서 프로그래밍을하는데 집중할 수 있습니다....","categories": ["Django Study"],
        "tags": [],
        "url": "/django%20study/study-django-orm-basic/",
        "teaser": null
      },{
        "title": "[Study] Django - 설계 철학",
        "excerpt":"기본을 충실히 하자! 구현을 서둘러 하다보니, 기본적인 프레임워크의 철학과 기본기를 돌아볼 여유가 없어왔던 것 같습니다. 프레임워크에 대해서나 왜 사용하게 되었는지를 생각해 볼 때 설득력있는 설명을 할 수 있는 방법이 궁금했습니다. 설계 철학 Django를 선택하는 이유 개발이 빠릅니다. Django는 포괄적인 도구와 라이브러리를 제공하여 새로운 프로젝트를 신속하게 구축할 수 있도록 합니다. 확장성이...","categories": ["Django Study"],
        "tags": [],
        "url": "/django%20study/study-django-philosophy/",
        "teaser": null
      },{
        "title": "[Study] Django - 코딩 스타일",
        "excerpt":"Pre-commit checks flake8 모듈을 사용하여 코딩 컨벤션을 확인하는 방법도 있습니다. git hook: git과 관련된 이벤트 발생시, 특정 스크립트를 실행할 수 있도록 하는 기능입니다. pre-commit은 pre-commit hook들을 관리하는 프레임워크로, 이를 통해 리뷰를 위한 코드 커밋 전, 간단한 이슈들을 확인할 수 있습니다. Python style 모든 파일은 black auto-fomatter를 사용하여 포맷되어야합니다. 프로젝트 레포지토리는...","categories": ["Django Study"],
        "tags": [],
        "url": "/django%20study/study-django-coding-style/",
        "teaser": null
      },{
        "title": "[Study] Network - OSI 계층",
        "excerpt":"OSI 7계층 7 계층 - Application Layer 사용자에게 보이는 부분으로, 최종 사용자에게 가장 가까운 계층으로, 사용자와 직접적으로 상호작용합니다. 애플리케이션 목적에 맞는 통신 방법을 제공합니다. HTTP, DNS, SMTP, FTP등의 대표적인 프로토콜이 해당 레이어에 속합니다. 6 계층 - Presentation Layer 애플리케이션 통신에서 메시지 포맷을 관리하는 계층입니다. 데이터를 안전하게 전송하기 위해 암호화, 복호화하여...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cs-network-osi/",
        "teaser": null
      },{
        "title": "[Study] Network - TCP",
        "excerpt":"TCP 통신이란? 네트워크 통신에서 데이터를 안정적이고 신뢰성 있게 전송하기 위한 연결방식입니다. unreliable network에서 reliable network를 보장할 수 있도록 하는 프로토콜입니다. network congetion avoidance algorithm을 사용합니다. reliable network를 보장한다? 아래 문제들을 해결하는 것 packet이 손실될 수 있는 문제 packet의 순서가 바뀌는 문제 네트워크가 혼잡하게(congestion) 되는 문제 receiver가 과부화(overload) 되는 문제 흐름제어...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cs-network-tcp/",
        "teaser": null
      },{
        "title": "[Study] Operating System - Process, Thread",
        "excerpt":"프로세스 메모리 상에서 실행 중인 프로그램입니다. 디스크로부터 메모리에 적재되어 CPU의 할당을 받습니다. 운영체제로부터 주소 공간, 파일, 메모리 등을 할당받습니다. 코드 영역: 프로그램의 소스 코드 자체를 구성하는 메모리 영역 데이터 영역: 전역변수, 정적변수, 배열 등에 대한 메모리 영역 (초기화 데이터는 data 영역에, 초기화되지 않은 데이터는 bss 영역에 저장) Heap 영역: 동적...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cs-os-process-thread-old/",
        "teaser": null
      },{
        "title": "[Study] Database - SQL/NoSQL, Partitioning/Sharding/Replication",
        "excerpt":"SQL과 NoSQL SQL 데이터는 테이블에 레코드로 저장되며, 각 테이블마다 명확히 정의된 구조(필드의 이름, 데이터 유형)가 있습니다. 정해진 스키마에 따라야지만 데이터를 저장할 수 있습니다. 데이터는 서로간에 관계를 통해 여러 테이블에 분산됩니다. 장점 명확하게 스키마가 정의되어있으며, 데이터의 무결성을 보장합니다. 관계는 각 테이블에 중복없이 한 번만 저장하도록 하여 중복도를 낮출 수 있습니다. 단점...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cs-database/",
        "teaser": null
      },{
        "title": "[Django] 테스트는 어떻게 수행할까? (query count 포함)",
        "excerpt":"글을 작성하게 된 계기 테스트 환경을 구축하는 것이 초반에는 번거로울지 모르지만, 기능 구현에 대한 발전 과정 / 리팩토링 과정을 공유하고 특정 기능에 대해 구체적인 예시로 살펴볼 수 있다는 점에 있어서 편리하다고 생각되었습니다. 서비스를 실행시키고 postman 혹은 화면작업을 통한 이벤트로 구현한 작업을 실행하는 번거로운 작업보다 간단한 python3 manage.py test ~ 명령어를...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-strategy-test/",
        "teaser": null
      },{
        "title": "[Django] permissions",
        "excerpt":"글을 작성한 계기 최근 과제전형을 보며, 백오피스로 주로 사용하는 Django에서 권한 관리에 대한 중요성을 많이 느끼게 되었습니다. ViewSet의 메서드를 사용할 때 Global Permission을 적용시켜야 하는지, Object-level Permission을 적용시켜야하는지 등 기본에 충실해서 학습해야함을 느꼈습니다. 아래 내용들은 단순히 DRF 문서의 번역이 아닌, 실제 사용하며 분석한 내용과 사용 전략이 포함되어있습니다. Django Permissions ModelViewSet등...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/study-django-strategy-permissions/",
        "teaser": null
      },{
        "title": "[Django] DRF에서 Viewset은 어떻게 사용할까?",
        "excerpt":"글을 작성하는 이유 Django의 ViewSet은 유저의 요청에 알맞은 반환값을 반환하도록 동작합니다. 프레임워크 내부적으로 중복되는 부분을 최소화시키기 위해 웬만한 기능들이 구현되어 있기 때문에, 상황에 맞는 기능을 찾아서 적절히 사용하는 것이 중요합니다. 따라서, ViewSet을 작성하는데 있어, 필수적인 기능과 유용한 기능들을 정리해 보고 상황에 맞게 참고하여 사용하기 위해 글을 작성합니다. ModelViewSet 사용 전략...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-strategy-view/",
        "teaser": null
      },{
        "title": "[Study] Operating System - Process, Thread, System call",
        "excerpt":"컴퓨터의 구조 (코어와 스레드) OS kernel은 사용자 프로그램과 Memory, CPU, Device를 다루는 연결고리 역할을 합니다. 코어와 스레드 코어는 코어 자체의 연산작업에 비해, 메모리에서 데이터를 기다리는 시간이 오래 걸립니다. 이는 결국 코어의 자원 낭비로 이어집니다. Q. OS 스레드 여덟 개를 하이퍼 스레딩이 적용된 인텔 듀얼코드 위에서 동작시키려면 OS 스레드들을 어떻게 코어에...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cs-os-process-thread-new/",
        "teaser": null
      },{
        "title": "[Study] Operating System - Sync, Async",
        "excerpt":"Race condition 여러 프로세스/스레드가 동시에 같은 데이터에 접근할 때 타이밍이나 접근 순서에 따라 결과가 달라지는 상황을 말합니다. 동기화: 여러 프로세스/스레드를 동시에 실행하더라도 공유 데이터의 일관성을 유지하도록 하는 것을 의미합니다. critical section: 공유 데이터의 일관성을 보장하기 위해 하나의 프로세스/스레드만 진입해서 실행 가능한 영역을 의미합니다. do { entry section # critical section에...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cs-os-sync-async/",
        "teaser": null
      },{
        "title": "[Study] Database - TRIGGER, Transaction",
        "excerpt":"SQL Trigger 데이터에 변경(INSERT, UPDATE, DELETE)이 생겼을 때 자동적으로 실행되는 프로시저를 의미합니다. INSERT, UPDATE, DELETE를 한 번에 감지하도록 설정 또한 가능합니다. (MySQL은 불가능) 애플리케이션이 알 수 없는 데이터베이스 서버의 로직이기 때문에, 문제사항 발생 시 대응하기 어렵다는 단점이 있습니다. 트리거를 지나치게 많이 발생시키면, 연쇄적인 트리거 발생이 생길 수 있고 이는 DB에...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-cs-dbms/",
        "teaser": null
      },{
        "title": "[Django] Push 알람은 어떤식으로 구현할 수 있을까?",
        "excerpt":"글을 작성하게 된 계기 진행하던 사이드 프로젝트에서, 이미지를 업로드 시킬 때, 이미지에 따라 처리 시간이 오래 걸리는 현상이 있었습니다. 이미지 업로드 진행 중에도, 유저들이 사용하는데 지장이 없도록 Celery를 활용한 비동기처리는 되어있는 상태였습니다. 하지만, Celery 작업을 마친 후, wsgi 서비스에서 클라이언트에게 알람을 전달하도록 하는 것이 효율적일 것이라고 생각하게 되어서 푸시알람 구현을...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-strategy-push-notification/",
        "teaser": null
      },{
        "title": "[Django] Channels란 무엇일까?",
        "excerpt":"Channels 모듈이란? Django에서 기본적으로 제공하는 비동기 뷰를 감싸서 Django가 HTTP 뿐 아니라 웹소켓, 챗봇, 라디오 등의 프로토콜을 처리할 수 있도록 합니다. 이는 Django의 동기적인 방식과 양립할 수 있고, 원하는 방식으로 작성할 수 있습니다. 인증, 세션 시스템과 통합될 수 있고, HTTP 용으로 개발된 프로젝트를 다른 프로토콜로 쉽게 확장할 수 있습니다. 이벤트...","categories": ["Strategy"],
        "tags": [],
        "url": "/strategy/django-strategy-channels/",
        "teaser": null
      },{
        "title": "[Django] web server, was, cgi, wsgi, asgi",
        "excerpt":"각 용어의 정의 웹서버 인터넷을 통해서 요청된 웹 컨텐츠의 전달을 도와주는 하드웨어와 소프트웨어입니다. 웹서버는 기본적으로 ‘정적’인 파일을 전달합니다. 클라이언트가 HTTP 요청을 통해 리소스를 요청하면, 리소스를 그대로 보내줍니다. CGI (Common Gateway Interface) 웹서버에서 애플리케이션(프로그램, 스크립트)을 동작시키기 위한 인터페이스입니다. 정적인 웹서버를 동적으로 기능하기 위해서 등장하였으며, 서버 프로그램과 외부 프로그램 간의 인터페이스가 CGI입니다....","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-cgi/",
        "teaser": null
      },{
        "title": "[Study] elastic search 사용하기",
        "excerpt":"설치 및 간단한 설정 $ docker pull docker.elastic.co/elasticsearch/elasticsearch:8.7.0 $ docker run -p 9200:9200 -p 9300:9300 \\ --name my-elasticsearch \\ -e \"discovery.type=single-node\" \\ docker.elastic.co/elasticsearch/elasticsearch:8.7.0 9200 포트를 통해 엘라스틱 서치에 접속할 수 있도록, 9300 포트를 통해 내부에서 통신하도록 설정합니다. 단일 노드로 실행하기 위해 discovery.type=signle-node 옵션을 추가합니다. https://localhost:9200/으로 접속하면 로그인을 통해 접속 가능합니다....","categories": ["Study"],
        "tags": [],
        "url": "/study/elastic-search/",
        "teaser": null
      },{
        "title": "[Study] Database - 쿼리 최적화를 위한 인덱스",
        "excerpt":"인덱스란 무엇인가? 인덱스를 사용하는 이유: 조건(WHERE)을 만족하는 튜플들을 빠르게 조회하기 위해 사용합니다. 빠르게 ORDER BY하거나 GROUP BY하기 위해 사용합니다. 인덱스 사용방법 인덱스 관련 명령어 예시 -- name column을 기준으로 인덱스를 생성합니다. CREATE INDEX player_name_idx ON player (name); -- team_id와 backnumber에 대해 복합 인덱스를 생성합니다. CREATE UNIQUE INDEX item_id_backnumber_idx ON player...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-db-index/",
        "teaser": null
      },{
        "title": "[Django] 파이썬에서 프레임워크에서 구현하는 동기화 / 비동기화",
        "excerpt":"기억해야할 용어와 각 기능의 차이 동시성과 병렬성 동시성: 하나의 시스템이 여러 작업을 동시에 처리하는 것처럼 보이게 하는 것입니다. 논리적인 개념으로, 싱글 코어에서 멀티 쓰레드를 동작시키는 방식입니다. 병렬성: 여러 작업을 실제로 동시에 처리하는 것입니다. 물리적인 개념으로, 멀티코어에서 멀티 스레드를 동작시키는 방식입니다. sync &amp; async 프로그램의 주 실행흐름을 멈추지 않고 진행할 수...","categories": ["Study"],
        "tags": [],
        "url": "/study/django-sync-async/",
        "teaser": null
      },{
        "title": "[Django] SOLID 원칙에 따른 Django ORM 사용",
        "excerpt":"글을 작성하게 된 이유 Spring과 같은 웹 프레임 워크에서는 자바의 클래스 기반의 특성을 활용하여 OOP 방식으로 코드를 작성하는 것이 수월하다는 것을 익히 들어왔고, 공부해왔습니다. Django에서는 DRF라는 프레임워크가 이에 대한 역할을 어느정도 수행해주지만, 커스텀한 코드들을 짤 때 어떻게 SOLID한 방식으로 작성할 수 있을 것인지, 역할과 책임을 어떻게 분리하여 좋은 코드를 만들...","categories": ["Study"],
        "tags": [],
        "url": "/study/django-solid/",
        "teaser": null
      },{
        "title": "[Study] 파이썬에서는 어떻게 가비지 컬렉팅을 수행할까?",
        "excerpt":"가비지 컬렉터 메모리를 관리하는 방법 더 이상 사용하지 않는 메모리를 해제하지 않으면 memory leak이 발생합니다. 사용 중이던 메모리를 해제하면 프로그램이 중단되고 데이터가 손실될 수 있습니다. GC의 동작 원리 OS가 프로그램을 프로세스로 실행하게 되면, 프로세스는 메모리에 Code, Data, Heap, Stack 영역을 할당받게 됩니다. 이 때, 힙과 스택 영역에 할당된 메모리들을 해제하는...","categories": ["Study"],
        "tags": [],
        "url": "/study/study-python-garbage-collector/",
        "teaser": null
      }]
