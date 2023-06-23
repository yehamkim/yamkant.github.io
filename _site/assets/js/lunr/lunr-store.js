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
        "excerpt":"글을 작성하게 된 계기 퇴근 이후의 로그를 보는 것이 하루의 일과의 시작인 만큼, 로그가 구체적일 수록 어떻게 보다 나은 서비스를 만들 수 있을까 뚜렷하게 고민하게 되는 것 같습니다. 로거를 공부하며 장고 미들웨어에 대해 학습할 수 있었습니다. 이를 계기로, 커스텀 데코레이터 사용 방법 또한 정리해두면 좋을 것 같다고 생각했습니다. 로그 작성에...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-logger/",
        "teaser": null
      },{
        "title": "[Django] 테스트는 어떻게 수행할까?",
        "excerpt":"글을 작성하게 된 계기 테스트 환경을 구축하는 것이 초반에는 번거로울지 모르지만, 기능 구현에 대한 발전 과정 / 리팩토링 과정을 공유하고 특정 기능에 대해 구체적인 예시로 살펴볼 수 있다는 점에 있어서 편리하다고 생각되었습니다. 목표 DRF에서 제공하는 APITest를 이용하여 integration 테스트, e2e 테스트를 진행하는 예시에 대해 작성합니다. Item 및 ItemImage 모델을 기준으로...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-test/",
        "teaser": null
      },{
        "title": "[Django] 배치서버는 어떻게 구성할까?",
        "excerpt":"글을 작성하게 된 계기 배치 서버는 자동화에 필수적인 기능이기 때문에, 사용의 편의성을 어마어마하게 가져다줍니다. 배치 서버를 사용하게 되면, 동기/비동기 처리 등 프레임워크에서 제공하는 다양한 기술들을 사용해보기 용이할 것 같다고 생각되었습니다. Django에서 배치서버를 설정하는 방법에 대해 소개합니다. 설정 참고: https://cholol.tistory.com/531 Django에서 Command는 python manage.py &lt;command&gt;로 동작되는 기능들입니다. 예제: python manage.py makemigrations...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-batch/",
        "teaser": null
      },{
        "title": "[Django] Swagger는 어떻게 설정할까?",
        "excerpt":"swagger 설정 현재 디렉터리 레벨 .venv code - api(app) - urls.py - mysite(base) - settings.py - urls.py - static 설치항목 관련 모듈 설치 및 settings.py에 설정 항목을 추가합니다. $ pip install drf-yasg # settings.py INSTALLED_APPS = [ ... 'django.contrib.staticfiles', 'drf_yasg', ... ] ... STATIC_URL = '/static/' STATICFILES_DIRS = [BASE_DIR, 'static',]...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-swagger/",
        "teaser": null
      },{
        "title": "[Django] Transaction은 어떻게 사용할까?",
        "excerpt":"Database transactions Django의 기본 동작은 autocommit 모드를 실행시키는 것으로, transaction이 활성화되지 않으면, 각 쿼리는 즉시 db에 커밋됩니다. Django는 transaction 들이나 savepoint를 자동으로 사용하여 ORM 연산들(쿼리들의 update/delete)의 묶음을 보장합니다. transaction은 기본적으로 사용비용이 드는 편이기 때문에, overhead를 최소화 하기 위해 가능한한 transaction을 짧게 유지하는 것이 좋습니다. HTTP 요청들에 transaction들 연결하기 연결을 위해...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-transaction/",
        "teaser": null
      },{
        "title": "[Book] 가상 면접 사례로 배우는 대규모 시스템 설계 기초",
        "excerpt":"가상 면접 사례로 배우는 대규모 시스템 설계 기초 4장 처리율 제한 장치 수용 가능한 트래픽 이상의 트래픽이 발생할 때 처리하는 방식을 생각합니다. 보통 API 서버 측에 트래픽 제한 장치 뿐 라니라, SSL 종단, 사용자 인증을 담당하는 클라우드 서비스를 사용합니다. 처리율 제한 알고리즘 검색해보기. http 규약에서 트래픽 관련 한도 제한이 걸리는...","categories": ["Book"],
        "tags": [],
        "url": "/book/book-1/",
        "teaser": null
      },{
        "title": "[Django] Sequelizer는 어떻게 사용할까?",
        "excerpt":"글을 작성하게 된 계기 Data를 함수간 전달하거나 다른 레이어로 전달하는 경우에 항상 빠진 요소가 없는지, Validation 확인이 필요한지 판단하는 코드를 작성해야합니다. 이를 수월하게 하기 위해 custom exception을 만든 적도 있고, @dataclass를 활용한 적도 있지만 drf가 제공하는 기능을 사용할 때 model과의 연동도 수월하며 사용성이 좋았어서 공유하고자 글을 작성합니다. 참고: https://www.django-rest-framework.org/api-guide/serializers/ Post의...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-serializer/",
        "teaser": null
      },{
        "title": "[Server] Docker network를 통한 Nginx와 django server 세팅",
        "excerpt":"글을 작성하게 된 계기 docker compose 내에 nginx / django server / db를 모두 넣는 방식은 network를 서로 공유할 수 있다는 편리함을 가졌지만 서로 독립적으로 컨트롤 할 수 없다는 단점을 가지고 있습니다. server 증설 및 감축을 위해 설정을 간소화하는 방법을 모색 중에, docker network를 활용하는 방법을 생각해보며 글을 작성하게 되었습니다....","categories": ["Server"],
        "tags": [],
        "url": "/server/server-1/",
        "teaser": null
      },{
        "title": "[Django] 배포/개발 환경은 어떻게 설정할까?",
        "excerpt":"최종 목표 .env 파일에 설정된 DJANGO_SETTINGS_MODULE에 따라서 배포환경에 맞는 settings.py 사용 Django Container Setting Django 폴더 구조 web - Dockerfile - apps/ - config/ - settings/ - base.py - development.py - production.py - wsgi/ - development.py - production.py ... - entrypoint.sh - manage.py - requirements.txt - .env Django 배포 환경...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-setting/",
        "teaser": null
      },{
        "title": "[Django] Form 클래스는 어떻게 사용할까?",
        "excerpt":"FORM HTML Form은 웹 페이지에서 필드나 위젯들의 묶음을 말합니다. 폼을 통해 사용자의 입력들을 받으므로, POST 요청으로 server에 데이터를 전달합니다. (CSRF 토큰을 통해 위조를 방지하기 위한 안정적인 대책을 세울 수 있습니다.) Djnago 폼 처리 과정 브라우저에서 form을 포함한 페이지를 요청합니다. Django는 “unbound” default form을 서빙합니다. (이 시점에서 폼은 초기값이 있지만, Client가...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-form/",
        "teaser": null
      },{
        "title": "[SQL] dbcp란 무엇이며, api 서버와 DB는 어떻게 통신할까?",
        "excerpt":"DBCP (DB Connection Pool) 참고: https://youtu.be/zowzVqx3MQ4 해당 글은 위의 쉬운코드 님의 영상을 토대로 요약한 글 입니다. 통신방법 백엔드 서버와 DB 서버는 TCP 기반으로 통신합니다. 따라서, connection을 맺어 열거나 닫아서 연결하는 과정이 필요합니다. DB 서버를 열고 닫을 때마다 시간적인 비용이 발생하게 되고, 이는 서비스 성능에 좋지 않습니다. DBCP의 개념과 원리 백엔드...","categories": ["Database"],
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
        "excerpt":"오류 내용 상품의 상태를 주기적으로 업데이트 하기 위해, 배치서버를 통해 국민클럽B2B(폐쇄몰)의 업데이트하는 함수를 실행시킵니다. 이 때, Promse.allSettled를 사용하여 비동기적으로 처리하도록 설계했습니다. 하지만, DBCP를 고려하지 않은 설계로 인해, too many connections 오류와 함께 서버가 중단되었습니다. 해결 내용 promise-pool 모듈을 사용하여, 배치서버를 위해 사용할 connection pool을 제한하여 chunk 단위로 // promise_pool.js const...","categories": ["Error Async"],
        "tags": [],
        "url": "/error%20async/errorasync-promise-pool/",
        "teaser": null
      },{
        "title": "[Django] 커스텀 유저 및 jwt는 어떤 방식으로 설정할까?",
        "excerpt":"Custom User Registration # requirements.txt asgiref==3.6.0 Django==4.2.1 djangorestframework==3.14.0 djangorestframework-simplejwt==5.2.2 PyJWT==2.7.0 pytz==2023.3 rest-framework-simplejwt==0.0.2 sqlparse==0.4.4 djangorestframework-simplejwt를 사용하여 개발합니다. # settings.py INSTALLED_APPS = [ 'django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles', # restframework \"rest_framework\", \"rest_framework_simplejwt\", \"rest_framework_simplejwt.token_blacklist\", # custom apps \"members\", \"core\", \"mytest\", ] ... # Settings for JWT Authentication SIMPLE_JWT = { \"ACCESS_TOKEN_LIFETIME\": timedelta(hours=1),...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-auth/",
        "teaser": null
      },{
        "title": "Cs Database",
        "excerpt":"NoSQL RDB의 단점은 무엇일까? 스키마가 경직되어있고 변경에 유연하지 않기 때문에, 새로운 기능이 생성될 때마다 컬럼을 추가해야하여 스키마를 변경해야합니다. 스키마 변경을 할 때마다, DB와 connection을 맺고 있는 server들에 영향을 미칠 수도 있습니다. 결론적으로, RDB는 스키마를 생성하고, 그 스키마에 맞추어 데이터를 저장해야한다는(유연하지 않다는) 단점이 있습니다. RDB의 기본 철학은 중복제거를 허용하지 않는 것이기...","categories": [],
        "tags": [],
        "url": "/cs-database/",
        "teaser": null
      },{
        "title": "[Django] DRF에서 Generic view, Model viewset은 어떻게 사용할까?",
        "excerpt":"참고: mynghn님 블로그 Generic view의 동작방식 DRF 기본 클래스인 APIView에서는 사용자가 요청부터 응답까지의 구현을 처리할 수 있습니다. Generic view에서는 CRUD 패턴에 대한 구현을 미리 정해놓습니다. generic view는 네가지 속성을 통해 API 동작을 결정합니다. ``` authentication_classes: 요청자의 가입 및 로그인 여부를 식별합니다. .get_authenticators(self) permission_classes: API 요청에 대한 요청자의 권한을 검증합니다. .get_permissions(self)...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-view/",
        "teaser": null
      },{
        "title": "[Django] API를 어떻게 명세하여 사용할까?",
        "excerpt":"Open API와 OAS, Swagger Open API란? Open API는 누구나 사용할 수 있도록 endpoint가 개방된 API를 의미합니다. OpenAPI Specification(OAS)는 OpenAPI(띄어쓰기 없음)이 표기하기도 하며, RESTful 형식의 API 정의된 규약에 따라 json이나 yaml로 표현하는 방식을 의미합니다. 직접 소스코드나 문서를 보지 않더라도 서비스를 이해할 수 있다는 장점이 있습니다. Swagger란? 2010년대 초 Tam Wordnik이 개발하기...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-spectacular/",
        "teaser": null
      },{
        "title": "Django Custom User",
        "excerpt":"Django custom user 생성을 위한 설정 추가 작업을 위한 Directory Level web - apps/ - config/ - settings/ - base.py - development.py - production.py ... - core/ - serializers.py - models.py ... - members/ - urls/ - members.py - models.py - serializers.py - views.py ... # config.settings.base.py INSTALLED_APPS = [...","categories": [],
        "tags": [],
        "url": "/django-custom-user/",
        "teaser": null
      },{
        "title": "[Django] 테스트는 어떻게 수행할까?",
        "excerpt":"작성이유 및 목표 흔히 리팩토링을 위해서, 발생할 법할 문제들을 미리 파악하기 위해서, 어떤 방식으로 사용하는지 명시하기 위해서 테스트를 작성합니다. 알고리즘 문제를 풀면서 또한 테스트 케이스의 중요성과 백엔드 개발자들이 왜 테스트 커버리지를 채워나가는데 집착하는지를 느끼게 됩니다. 해당 게시글에서는 Django를 통해 e2e, integration 테스트를 하기 위한 간단한 예시를 작성합니다. 커스텀 유저를 위한...","categories": ["Django Strategy"],
        "tags": [],
        "url": "/django%20strategy/django-test/",
        "teaser": null
      },{
        "title": "Aws",
        "excerpt":"6.1 Amazon VPC AWS에 생성하는 가상의 네트워크(Virtual Private Cloud)를 의미합니다. EC2나 RDS의 경우, VPC를 먼저 선택해야합니다. VPC내에 서버를 설치하면 해당 네트워크에 소속되지만, 별도로 설정하지 않으면 격리된 네트워크입니다. 외부와 통신하기 위해 인터넷 혹은 회사 LAN과 연결해야합니다. 기능 네트워킹 환경을 설정합니다. IPv4, IPv6 둘 다 사용가능합니다. CIDR 블록, 서브넷 마스크를 설정할 수...","categories": [],
        "tags": [],
        "url": "/aws/",
        "teaser": null
      }]
