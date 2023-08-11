---
layout: archive
title:  "[Django] Logger는 어떻게 설정할까?"
date:   2023-04-18 23:05:07 +0900
categories: [Django Strategy]
---

## 글을 작성하게 된 계기
- 퇴근 이후의 로그를 보는 것이 하루의 일과의 시작인 만큼, 로그가 구체적일수록 어떻게 보다 나은 서비스를 만들 수 있을까 뚜렷하게 고민하게 되는 것 같습니다.
- 로거를 공부하며 장고 미들웨어에 대해 학습할 수 있었습니다. 이를 계기로, 커스텀 데코레이터 사용 방법 또한 정리해 두면 좋을 것 같다고 생각했습니다.
- 로그 작성에 대한 부분이 어느 정도 정립되면, elastic search 관련 기술을 적용하여 로그를 보다 현직에서 사용하는 방식으로 관리해 보려고 생각 중입니다.

참고
- 요청/응답 로그: https://zeroes.dev/p/django-middleware-to-log-requests/
- 미들웨어 설명: https://docs.djangoproject.com/ko/4.2/topics/http/middleware/#

Middleware
- django request/response 프로세스에서 훅들의 프레임워크입니다.
- 각각의 미들웨어 컴포넌트는 구체적인 함수를 수행하기 위해 필수적입니다. 

Class Middleware
```python
class SimpleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # One-time configuration and initialization.

    def __call__(self, request):
        # Code to be executed for each request before
        # the view (and later middleware) are called.

        response = self.get_response(request)

        # Code to be executed for each request/response after
        # the view is called.

        return response
```
- chain에서의 마지막 middleware를 위한 `get_response` callable은 actual view 보다는, wrapper method일 것입니다.
- 이때, 적절한 URL 변수를 호출하거나 template-response와 exception 미들웨어를 적용하는 wrapper 메서드가 될 것입니다.
- 미들웨어는 synchronous Python과 asyncronous Python 각각이나 모두에 적용될 수 있으며, 어느 경로에서든 live 됩니다.
- - Django는 미들웨어들을 정의된 순서로 top-down하여 적용합니다.

### Class Based Middleware Method
- `__init__(get_response)`: middleware factories는 `get_response` 인자를 받아야만 합니다. 우리는 이에 대한 global state를 초기화할 수 있습니다.
- `process_view(request, view_func, view_args, view_kwargs)`: HttpResponse 혹은 None을 반환합니다.
  - None을 반환: Django가 요청을 처리 중인 상태이며, 다른 process_view() 미들웨어를 실행시키고, 그 후 적절한 view를 실행합니다.
  - HttpResponse object 반환: 적절한 view를 반환하는 것이 아닌, response middleware를 적용시킬 것입니다.
- `process_esception(request, exception)`: 에러가 발생할 때 호출하는 메서드로, None이나 HttpResponse 객체를 반환합니다.
  - HttpResponse object 반환: template response와 response middleware가 적용되며 결과로 response가 반환되지만, 그렇지 않으면 default exception handling이 반환됩니다.
  - respons phase에 있는 동안 미들웨어는 역순으로 실행되는데 이때 process_exception이 포함됩니다.
  - 만약 exception middleware가 response를 반환하면, process_exception 메서드들은 호출되지 않습니다.
- `process_template_response(request, response)`: response는 `TemplateResponse` object로, 미들웨어 혹은 장고의 view에 의해 반환됩니다.
  - 실행을 마친 후에 호출되며, response instance의 `render` 메서드를 사용하면 `TemplateResponse`를 반환하게 됩니다.
  - 이 메서드는 반드시 `render` 메서드를 수행하여 반환해야 하며 `response.template_name`과 `response.context_data`를 수정함으로써 주어진 response로 대체할 수 있습니다.


## Request Logger
```python
# settings.py
MIDDLEWARE = [
    ...
    '<app name>.middleware.request_log.RequestLogMiddleware'
]
```

```python
# middleware/request_log.py (settings.py와 같은 경로)
# Request Logger

"""
Middleware to log `*/api/*` requests and responses.
"""
import socket
import time
import json
import logging

request_logger = logging.getLogger('django')

class RequestLogMiddleware:
    """Request Logging Middleware."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        log_data = {
            "remote_address": request.META["REMOTE_ADDR"],
            "server_hostname": socket.gethostname(),
            "request_method": request.method,
            "request_path": request.get_full_path(),
            "request_user-agent": request.headers.get('user-agent'),
        }

        # Only logging "*/api/*" patterns
        if "/api/" in str(request.get_full_path()):
            req_body = json.loads(request.body.decode("utf-8")) if request.body else {}
            log_data["request_body"] = req_body

        # request passes on to controller
        response = self.get_response(request)

        # add runtime to our log_data
        if response and response["content-type"] == "application/json":
            response_body = json.loads(response.content.decode("utf-8"))
            log_data["response_body"] = response_body
        log_data["run_time"] = time.time() - start_time

        request_logger.info(msg=log_data)

        return response

    # Log unhandled exceptions as well
    def process_exception(self, request, exception):
        try:
            raise exception
        except Exception as e:
            request_logger.exception("Unhandled Exception: " + str(e))
        return exception

```

### 최종 로그 설정
```python
LOGGING_SERVER_INFO_FILE = './logs/server.log'
LOGGING_SERVER_DEBUG_FILE = './logs/server.debug.log'
LOGGING_BATCH_FILE = './logs/batch.log'
LOGGING_TEST_FILE = './logs/test.log'
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {module}: {message} {process:d} {thread:d}',
            'style': '{',
        },
        'django.server': {
            '()': 'django.utils.log.ServerFormatter',
            'format': '[{server_time}] {message}',
            'style': '{',
        },
        'standard': {
            'format': '[{levelname}] {asctime} {name}: {message}',
            'style': '{'
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        }
    },
    'handlers': {
        'console': {
            'level': 'INFO' if not DEBUG else 'DEBUG',
            'formatter': 'verbose',
            'class': 'logging.StreamHandler',
        },
        'file': {
            'level': 'INFO' if not DEBUG else 'DEBUG',
            'formatter': 'verbose',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename':  BASE_DIR / LOGGING_SERVER_INFO_FILE if not DEBUG else BASE_DIR / LOGGING_SERVER_DEBUG_FILE,
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5,
        },
        'batch': {
            'level': 'INFO',
            'formatter': 'verbose',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / LOGGING_BATCH_FILE,
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5,
        },
        'test': {
            'level': 'INFO',
            'formatter': 'verbose',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / LOGGING_TEST_FILE,
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5,
        },
    },
    'loggers': {
        'django': {
            'level': 'INFO',
            'handlers': ['file'],
        },
        'django.batch': {
            'level': 'INFO',
            'handlers': ['console', 'batch'],
            'propagate': False,
        },
        'django.test': {
            'level': 'INFO',
            'handlers': ['console', 'file'],
            'propagate': False,
        },
        'django.db.backends': {
            'level': 'DEBUG',
            'filters': ['require_debug_true'],
            'handlers': ['console'],
        },
    }
}
```
- `loggers`의 각 로거들은 `handlers`를 조합하여 사용합니다. 각 레벨에 따라 동작이 어떻게 될까요?
- `handlers`의 설정을 통해 `DEBUG=True`인 상황과 `DEBUG=False`인 상황 각각에 대해 동작하도록 적용하였습니다.
  - `DEBUG=True`: `django.db.backends logger`의 `console handler`와 `django logger`의 `file handler`가 활성화됩니다. 
  - 이때, `info` 정보(`django.server logger`)의 로그가 저장되는 파일명은 `server.debug.log`로 변경되고, `django.db.backends logger`의 MySQL 쿼리들은 콘솔로 출력됩니다.
  -  `DEBUG=False`: `info` 정보(`django.server logger`)의 로그가 저장되는 파일명은 `server.log`로 변경되고, `django.db.backends logger`의 MySQL 쿼리들은 더 이상 출력되지 않습니다.