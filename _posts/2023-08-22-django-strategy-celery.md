---
layout: archive
title:  "[Django] 테스트는 어떻게 수행할까? (query count 포함)"
date:   2024-08-22 00:05:07 +0900
categories: [Strategy]
---

### Celery란?
- Distributed Task Queue. 종합적인 비동기 처리기입니다.
- 동기적으로 수행하지 않아도 되는 일들을 처리해주는 역할을 합니다. 결과를 즉시 받을 필요가 없거나 지연하여 처리해야 되는 일들을 비동기로 처리합니다.


### `Celery()` 설정
`backend`
- 작업 상태와 결과를 추적하는데 사용됩니다.
- 기본적으로 결과가 비활성화 되어있습니다.
- `@task(ignore_result=True)` 옵션을 설정하여 개별 작업에 대해 결과를 비활성화할 수도 있습니다.


## 참고
### 참고링크
- [nuung님 블로그 - 작업량 많은 경우 다루기](https://velog.io/@qlgks1/Django-Celery-%EB%8B%A8%EC%A0%90-Task-subTask-Signature-%EB%B9%84%EB%8F%99%EA%B8%B0-%EC%9E%91%EC%97%85-%EB%8B%A4%EB%A3%A8%EA%B8%B0-with-network-IO)

### RPC란
- 프로세스간 통신을 위해 사용하는 IPC(Inter Process Communication) 방법의 한 종류입니다.
- 원격지의 프로세스에 접근하여 프로시저 또는 함수를 호출하여 사용합니다. 말 그대로 원격지의 프로시저를 호출하는 것입니다.
- 일반적으로 프로세스는 자신의 주소공간 안에 있는 함수만 호출하여 실행하지만, RPC를 이용하면 다른 주소공간에서 동작하는 프로세스의 함수를 실행하게 됩니다.
- RPC는 분산 컴퓨팅과 client-server 베이스로한 앱을 위한 강력한 기술로, 로컬 프로시저 호출을 확장하는 것을 기반으로 합니다.
- 호출된 프로시저의 필요가 호출하는 프로시저처럼 같은 주소 공간에 존재하지 않습니다.
- 두 프로세스들이 같은 시스템에 있거나 다른 시스템에 존재하며 네트워크가 그들을 연결하는 형태로 존재합니다.

### 프로시저와 함수의 차이
- 함수는 input에 따른 output을 반환하는 것을 목표로 합니다.
- 프로시저는 결과값 보다는 '명령 단위가 수행하는 절차'를 목적으로 합니다.

### RPC의 궁극적인 목표
- 클라이언트와 서버 간의 커뮤니케이션에 필요한 상세정보를 최대한 감추는 것입니다.
- 클라이언트가 일반 메서드를 호출하는 것처럼 원격지의 프로시저를 호출할 수 있도록 하는 것입니다.
- 서버도 마찬가지로 일반 메서드를 다루는 것처럼 원격 메서드를 다루도록 하는 것입니다.


### Task Queue란?
- Task 대기열은 threads나 machines에 따른 분산 작업을 처리할 때 사용됩니다.
- 한 태스크 큐의 input은 태스크라 불리는 작업의 unit이며, Dedicated worker 프로세스는 지속적으로 수행하기 위한 새로운 일을 위한 대기열을 모니터링 합니다.
- Celery는 message들을 통하여 커뮤니케이션하며, client들과 worker들 사이에 중재자의 역할을 하는 broker를 사용합니다.
- 클라이언트가 대기열에 메시지를 추가하는 작업을 시작하기 위해, 브로커는 그 메시지를 작업자에게 전달합니다.
- Celery 시스템은 다수의 워커들이나 브로커들로 구성될 수 있으며, 고가용적이며 수평적으로 확장 가능한 방법을 제공합니다.



## celery.py 설정
```python
app.config.broker_transport_options = {
    'priority_steps': list(range(10)),
    'sep': ':',
    'queue_order_strategy': 'priority',
}
```
- 위 코드는 celery 수행 명령어에서 `celery --app=config worker -l INFO -Q celery,celery:1,celery:2,celery:3`과 같이 사용가능합니다.
```python
# task.py

@shared_task
def tp1(queue='celery'):
    time.sleep(3)
    return

@shared_task
def tp2(queue='celery:1'):
    time.sleep(3)
    return

@shared_task
def tp3(queue='celery:2'):
    time.sleep(3)
    return
```

### celery를 사용한 배치작업
- `settings.py`의 `INSTALLED_APPS`에 `django_celery_beat`를 추가합니다.
```shell
$ pip install django-celery-beat
$ ./manage.py migrate # 주기적인 배치작업을 위한 DB 생성
```

```python
# settings.py

CELERY_BEAT_SCHEDULE = {
    "scheduled_task": {
        "task": "task1.tasks.add",
        "schedule": 5.0,
        "args": (10, 10),
    }
}
```
- 배치 명령어: `celery -A core beat -l INFO`
- 만약 데이터베이스의 설정에 따라 배치작업을 수행하고자 하면 아래 명령어로 django_celery_beat를 설정합니다.
```sh
$ celery -A core beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Celery 설정 예시
```python
app = Celery('config')
...
app.conf.task_serializer = 'json'
app.conf.update(
    task_serializer = 'json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
)
```
- [설정 참고](https://velog.io/@yvvyoon/celery-first-step-2)


### 명령어 팁
- `docker-compose up -d --build`: 빌드하면서 docker-compose를 실행하는 방법

django cache 설정
- [캐시설정 참고](https://blog.devgenius.io/using-database-caching-in-django-project-adc7e33c7064)

### 오류발생
- serializer 매개변수로 전달 안되는 이슈: [stackoverflow 이용](https://stackoverflow.com/questions/49373825/kombu-exceptions-encodeerror-user-is-not-json-serializable)
- task의 진행 상태를 알아보는 방법: [](https://dontrepeatyourself.org/post/django-celery-result-backend/)
- Celery 현업 적용 실질적인 예시: [](https://spoqa.github.io/2012/05/29/distribute-task-with-celery.html)
- Celery 디버깅을 위한 실용적인 예시들: [](https://velog.io/@qlgks1/Django-Celery-%ED%9A%A8%EA%B3%BC%EC%A0%81%EC%9D%B8-%EB%94%94%EB%B2%84%EA%B9%85-%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81-Logging-Flower-Prometheus-Grafanawith-Loki-Promtail)
- 파이콘 전반적인 설명: [](https://www.youtube.com/watch?v=3C8gBRhtkHk)
- 파이콘 실행 예시 (헤이딜러):[]()
- shared task 옵션들 설명: [](https://appliku.com/post/celery-shared_task#shared_task)
- 캐시 사용 구체적인 예시: [](https://jupiny.com/2018/02/27/caching-using-redis-on-django/)