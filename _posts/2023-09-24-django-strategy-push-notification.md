---
layout: archive
title:  "[Django] Push Notification은 어떤식으로 구현할 수 있을까?"
date:   2023-09-24 00:05:07 +0900
categories: [Strategy]
---

## 글을 작성하게 된 계기
- 진행하던 사이드 프로젝트에서, 이미지를 업로드 시킬 때 이미지에 따라 이미지 프로세싱에 대한 시간이 오래 걸리는 현상이 있었습니다.
- 이미지 업로드 방식을 Celery를 활용한 비동기적으로 처리하는 것으로 수정하여, 기존 동작은 이상없이 수행하도록 작성하였습니다.
- 하지만, Celery 작업을 마친 후, wsgi 서비스에서 알람을 받도록 하는 것이 효율적일 것이라고 생각하게 되었습니다.

### 사용한 기술 스택
- Celery, Redis
- Django Eventstream, Django signal

### 동작 순서
1. [wsgi] wsgi에서 API request 전달 받습니다.
2. [asgi] celery에서 특정 작업에 대한 동작을 처리하도록 합니다.
3. [asgi] celery에서 특정 작업에 대한 동작을 처리 후, task result 테이블에 해당 내역을 기록합니다.  
   (이 때, event stream에서 클라이언트에게 전달하기 위한 `채널명(ex. user.username)`을 함께 기록합니다.)
4. [asgi] task result DB를 모니터링 하다가, signal이 발생하면 wsgi 서버로 처리가 완료되었음을 request 요청합니다.   
   (ex. `requests.get("http://127.0.0.1:8000/tasks/<task_id>/")` `task_id`는 wsgi에서 파싱)
5. [wsgi] asgi의 request 내에 기록된 task 정보(task_id)를 통해 DB에서 어떤 태스크가 완료되었는지 판단합니다.
6. [wsgi] task result DB에 기록할 때, 추가 입력한 `user.username(채널명)`를 통해 event stream으로 클라이언트에게 작업이 완료되었음을 알립니다.

## 구현 예시
### 들어가기 전
- 작업환경 설정 부분은 공식 홈페이지의 방식을 따랐습니다.
  - [django signal 관련 설정](https://docs.djangoproject.com/en/4.2/topics/signals/)
  - [django-celery 관련 설정](https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html)
  ```shell
  $ pip install celery[redis] django-celery-results
  ```
- 구체적인 설정 예시는 부록에 남기겠습니다.
- 구현 시나리오: `/` 페이지 접속 후, 버튼 클릭시 5초 타이머가 celery task에서 작동하고, 태스크 종료 후에 alert 이벤트가 발생합니다.

### task 작성
```python
@shared_task(
    bind=True,
    max_retries=5,
    ignore_result=True
)
def task_sleep(self, data, *args, **kwargs):
    from time import sleep
    sleep(data)

    task_result = TaskResult.objects.create(
        task_id=self.request.id,
        status=states.SUCCESS,
        meta=kwargs['channel_name'],
    )
    return True
```
- `task_sleep`을 wsgi 서버에서 호출할 때, 인자로 데이터와 `channel_name`을 함께 대입하고 이를 메타데이터에 저장합니다.
- 이후, 태스크에 따라 발생시키고자 하는 알람을 구분하여 `send_event` 해주기 위한 채널명으로 사용됩니다. 
- 해당 태스크를 실행시킬 때, TaskResult 모델(django-celery-results 모듈에서 생성한 테이블)을 통해 `django_celery_results_taskresult`테이블에 레코드를 기록합니다.

### task 실행 로직
```python
# config.urls.py

class TaskCreateAPIView(APIView):
    queryset = TaskResult.objects.all()
    lookup_field = ['id']

    def post(self, request, *args, **kwargs):
        channel_name = 'yamkant'
        task_sleep.delay(5, channel_name=channel_name)
        return Response({})

urlpatterns = [
    ...
    path("tasks/", TaskCreateAPIView.as_view(), name="task-create"),
    ...
]
```
- `/tasks/`로 POST 요청을 보내는 경우 task가 실행됩니다. 
- 이 때, 앞서 강조한 바와 같이 channel 이름을 함께 대입하여, 태스크 종료 후 알람을 줄 채널을 지정합니다.

### task 종료 후 시그널 캐치
```python
apps.mycelery.signals.py

@receiver(post_save, sender=TaskResult)
def process_celery_task_result(sender, instance, **kwargs):
    if instance.status == states.SUCCESS:
        requests.get(f'http://127.0.0.1:8000/tasks/{instance.id}/')
```
- `task_sleep`이 마무리 되면, post_save 이벤트를 통해 signal 발생을 감지합니다.
- 이 때, 인자로 `TaskResult` 모델의 인스턴스가 바로 들어오므로 이를 사용하여 wsgi 서버에 마무리된 태스크를 전달해줍니다.

### 태스크 호출 클라이언트에 태스크 종료 상황 전달
```python
# config.urls.py

class TaskRetrieveAPIView(RetrieveAPIView):
    queryset = TaskResult.objects.all()
    lookup_field = ['id']

    def retrieve(self, request, *args, **kwargs):
        instance = get_object_or_404(TaskResult, id=kwargs['id'])
        channel_name = instance.meta
        send_event(channel_name, 'message', {"msg": f"{instance.task_id} Task Finished"})
        return Response({})

urlpatterns = [
    ...
    path("tasks/<int:id>/", TaskRetrieveAPIView.as_view(), name="task-detail"),
    ...
]
```
- `task`의 id를 asgi 서버에서 wsgi 서버로 전달하였고, wsgi는 이를 캐치하여 태스크 결과를 DB에서 확인 후 `send_event`를 통해 저장된 채널로 알람을 줍니다.
- 현재는 string으로 반환하여 task 종료에 대한 내역만 표시했지만, case에 따라서 client가 다른 처리를 하도록 작성할 수 있습니다.


## 부록
### celery 관련 설정
  ```python
  # config.__init__.py
  from .celery import app as celery_app

  __all__ = ('celery_app',)
  ```
  ```python
  # config.settings.py
  # CELERY SETTINGS
  CELERY_BROKER_URL = 'redis://127.0.0.1:6379'
  CELERY_RESULT_BACKEND = 'django-db'
  CELERY_CACHE_BACKEND = 'defualt'

  CELERY_APP='config.celery'
  ```
  ```python
  # config.celery.py

  from __future__ import absolute_import
  import os
  from celery import Celery

  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

  app = Celery(
      'config',
      broker_connection_retry_on_startup=True
  )
  app.config_from_object('django.conf:settings', namespace='CELERY')

  app.autodiscover_tasks()

  app.conf.timezone = "Asia/Seoul"
  app.conf.task_track_started = True
  app.conf.task_time_limit = 30 * 60
  app.conf.task_serializer = 'json'



  @app.task(bind=True, ignore_result=True)
  def debug_task(self):
    print(f'Request: {self.request!r}')

  ```

### signal 관련 설정
```python
# apps.mycelery.apps.py

from django.apps import AppConfig

class MyceleryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.mycelery'

    def ready(self):
        from . import signals
```
```python
# apps.mycelery.signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django_celery_results.models import TaskResult
from celery import states

# NOTE: Signal after celery work -> to wsgi server 
@receiver(post_save, sender=TaskResult)
def process_celery_task_result(sender, instance, **kwargs):
    if instance.status == states.SUCCESS:
        print("SAVED CELERY RESULT")
```

### 간단한 client html,js 작성
```html
{% load static %}

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="{% static 'django_eventstream/eventsource.min.js' %}"></script>
    <script src="{% static 'django_eventstream/reconnecting-eventsource.js' %}"></script>
    <title>Push Alarm</title>
</head>
<body>
    <h1>Hello World!</h1>
    <button onclick="onClick(this)">Run Task!</button>
    <script>
        async function start(username) {
            const es = setEventSource(username)
            es.addEventListener('message', function (e) {
                alert("Task Finished!")
            }, false);
        }

        function setEventSource(channelName) {
            const es = new ReconnectingEventSource(`/events/${channelName}/`);
            return es
        }
        window.addEventListener('load', async (e) => {
            start("{{user.username}}")
        });

        const onClick = () => {
            fetch('http://127.0.0.1:8000/tasks/', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: {},
            })
            .then(res => res.json())
        }
    </script>
</body>
</html>
```
- load 직 후, event source를 설정하여, 서버와의 연결을 유지합니다.
- 버튼 클릭시, post 요청을 통해 task를 실행시킵니다.

## 발생한 오류

```
TypeError: __init__() missing 1 required positional argument: 'get_response'
HTTP GET /events/yamkant/ 500 [0.59, 127.0.0.1:55482]
```
- module간 dependency 때문에 일어나는 현상입니다. 아래와 같이 모듈 버전을 맞춰주세요
```shell
Django==4.2.5
django-celery-results==2.5.1
django-eventstream==4.5.1
django-grip==3.4.0
djangorestframework==3.14.0

celery==5.3.4
channels==3.0.4
channels-redis==4.1.0
```