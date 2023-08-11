---
layout: archive
title:  "[Django] 배치서버는 어떻게 구성할까?"
date:   2023-04-25 20:05:07 +0900
categories: 
    - Django Strategy
last_modified_at: 2023-04-25
---

## 글을 작성하게 된 계기
- 배치 서버는 자동화에 필수적인 기능이기 때문에, 사용의 편의성을 어마어마하게 가져다줍니다.
- 배치 서버를 사용하게 되면, 동기/비동기 처리 등 프레임워크에서 제공하는 다양한 기술들을 사용해보기 용이할 것 같다고 생각되었습니다.
- Django에서 배치서버를 설정하는 방법에 대해 소개합니다.

### 설정
- 참고: https://cholol.tistory.com/531
- Django에서 Command는 `python manage.py <command>`로 동작되는 기능들입니다.  
  예제: `python manage.py makemigrations / python manage.py migrate` 등
- Command로 사용할 항목들을 특정 앱(예시: batch)에 `batch/management/commands/` 안에 넣으면, 위와 같이 명령어로 사용할 수 있게 됩니다.
- 이때, batch 앱은 settings.py > INSTALLED_APPS에 등록되어야 합니다.

### 파일 생성 방법
- 만들게 될 파일의 클래스는 Django에서 제공하는 BaseCommand 클래스를 상속받게 합니다.
- `handle(self, *args, **options)` method에 동작시키고 싶은 기능을 overwrite하면 배치로 사용할 수 있습니다.
- `add_arguments(self, parser)`를 사용하면 배치프로그램에 외부에서 인자를 주입할 수 있습니다. (외부변수 이용하지 않는 경우, add_arguments 생략)
- 사용 예시는 아래와 같습니다. 주의할 점: class 명은 반드시 `Command`로 만들어야합니다.
    ```python
    # chat gpt 예시 참고
    from django.core.management.base import BaseCommand
    import logging

    logger = logging.getLogger('django.batch')

    class Command(BaseCommand):
        help = 'My custom command'

        def add_arguments(self, parser):
            parser.add_argument('my_arg', type=str, help='A required argument')
            parser.add_argument('--optional-arg', type=int, help='An optional argument')

        def handle(self, *args, **options):
            my_arg = options['my_arg']
            optional_arg = options.get('optional_arg')
            logger.info("테스트 배치 프로그램 실행")
    ```
    ```bash
    # 실행방법
    $ python manage.py my_custom_command my_arg_value --optional-arg=123
    ```

## 배치 로그 기록하는 방식
```python
# settings.py
...
LOGGING_BATCH_FILE_DIRECTORY = 'logs/batch.log'
LOGGING = {
    ...
    'handlers': {
        ...
        'batch': {
            'level': 'INFO',
            'formatter': 'verbose',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / LOGGING_BATCH_FILE_DIRECTORY,
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5,  # 롤링되는 파일의 개수
        },
    },
    'loggers': {
        ...
        'django.batch': {
            'level': 'INFO',
            'handlers': ['console', 'batch'],
            'propagate': False,
        },
    }
    ...
}
...
```

### crontab을 사용한 배치 방법
- 할 일: 다른 배치 프로그램들과 무엇이 다른지 비교하기

## 파이썬에서 비동기 처리
참고 자료
- https://www.itworld.co.kr/news/245062  
- https://docs.djangoproject.com/ko/4.0/topics/async/#asgiref.sync.sync_to_async

### 파이썬 ASGI
- 기존 Django에서는 웹 서버 게이트웨이 인터페이스 WSGI 표준을 따랐습니다.
- WSGI는 웹소켓과 같은 고급 프로토콜을 효과적으로 처리하지 못한다는 단점을 가지고 있었기에, Django는 ASGI를 제공하고 있습니다.
- ASGI는 WSGI와 같이 파이썬 웹애플리케이션과 웹서버 간의 공통적인 인터페이스를 기술합니다. ASGI는 동기/비동기 앱을 모두 지원하기 때문에 기존의 WSGI 웹앱을 마이그레이션 하기도 편리합니다.

### WSGI 작동 방식
- [매개변수 1] environ: 웹 서버가 제공한 환경변수와 현재 요청에 대한 정보가 포함된 사전
- [매개변수 2] start_response: 클라이언트 HTTP로 응답을 보내는 작업을 시작하는데 사용하는 함수 
```python
def application(environ, start_response):
  start_response('200 OK', [('Content-Type', 'text/plain')])
  return [b'Greetings universe']
```
- WSGI는 한 번에 하나의 요청과 응답을 처리하며, 응답이 즉시 반환됨을 전제로 합니다.
- 따라서, 웹소켓/롱 폴링 HTTP 연결과 같이 장시간 지속되는 연결을 처리할 수 없습니다.
- WSGI는 동기 전용이기 때문에, 멀티스프레드 연결 풀을 사용하더라도 응답이 반환될 때 까지 각 연결이 차단됩니다.

### ASGI 작동 방식
- 표면적으로는 WSGI와 비슷하지만, 매개변수가 2개가 아닌 3개입니다.
- [매개변수 1] scope: 현재 요청에 대한 정보가 포함된 사전입니다.
- [매개변수 2] send: 애플리케이션이 클라이언트로 메시지를 돌려보낼 수 있게 해주는 async callable 입니다.
- [매개변수 3] receive: 애플리케이션이 클라이언트로부터 메시지를 수신할 수 있게 해주는 async callable 입니다.
```python
async def application(scope, receive, send):
   await send({
       'type': 'http.response.start',
       'status': 200,
       'headers': [
           [b'content-type', b'text/plain'],
       ],
   })

   await send({
       'type': 'http.response.body',
       'body': b'Hello, world!',
   })
```
- ASGI는 함수 전반에서 비동기 메타포를 사용합니다. 함수 자체는 async이며, HTTP 헤더와 응답 본문을 별도의 두 가지 `await send()` 명령으로 보냅니다.
- 함수 자체와 send 명령은 아무것도 차단하지 않기 때문에, 많은 연결의 application과 `send` 호출이 동시에 교차가 가능합니다.
- 추가적으로, `receive`는 다른 작업을 차단하지 않고도 요청 본문을 받을 수 있습니다. 


### 부분적으로 비동기 동작 사용하기
- django의 일부인 ORM을 통해 동기적으로 호출한다면, `sync_to_async` 호출로 래핑할 수 있습니다.
    ```python
    from asgiref.sync import sync_to_async

    results = await sync_to_async(Blog.objects.get, thread_sensitive=True)(pk=123)
    ```
- 또한, ORM 코드를 자체의 함수로 변경하여 호출하는 것도 가능합니다.
    ```python
    from asgiref.sync import sync_to_async

    def _get_blog(pk):
        return Blog.objects.select_related('author').get(pk=pk)

    get_blog = sync_to_async(_get_blog, thread_sensitive=True)
    ```

### 코드에서 반영하기
```python
from django.core.management.base import BaseCommand
import asyncio
from batch.services.AsyncService import AsyncService
import logging
import json


logger = logging.getLogger('django.batch')
class Command(BaseCommand):
    help = 'test'
    aService: object = asyncService()

    def handle(self, *args, **options):

        import time

        ...

        start = time.time()  # 시작 시간 저장

        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.asyncService.runAllPartialProcess(targetDataList))
        loop.close()

        print("time :", time.time() - start)
```

```python
class asyncService:
    async def partialProcess(self, data):
        ...

    async def runAllPartialProcess(self, targetUpdatedDataList):
        futures = [asyncio.ensure_future(self.partialProcess(targetData)) for targetData in targetDataList]
        result = await asyncio.gather(*futures)
```


