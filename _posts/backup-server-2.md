---
layout: archive
title:  "[Server] Nginx를 이용한 무중단 배포"
date:   2023-04-25 20:05:07 +0900
categories: [Server]
---

## 글을 작성하게 된 계기
- 현재 운용중인 서비스는 유저가 많지 않아, 단순히 git pull을 사용하여 배포를 해왔습니다. 하지만, 유저가 늘어남에 따라 무중단 배포의 필요성을 느끼게 되었습니다.
- 저희 서비스는 Docker compose와 Nginx를 사용하여 구성이 되어있고, 마침 jojoldu 님의 무중단 **배포** 관련 블로그 글을 접하게 되어 django에서도 이와 동일하게 구현해보려고 합니다.
- 참고: https://jojoldu.tistory.com/267

## Nginx를 이용한 무중단 배포 방법
- Nginx 포트 설정을 80,443:8000로 하여, host의 80 및 443 포트를 docker-compose 서버 내부에 8000번 포트로 reverse proxy합니다.
- 새로운 버전이 완료된다면, docker-compose 서버 내부에서 8001번 포트로 실행시킨 후, Nginx 설정을 80,443:8001로 변경 후에, `nginx reload`합니다.(이 때, 잠깐의 중단이 일어나긴 합니다..)

## Django 배포환경 설정
- 환경구성을 위한 directory level은 아래와 같습니다.  
    ```shell
    django
      .venv/
      code/
        api/
          controllers/
            ProfileController.py
        mysite/
          settings/
            base.py
            dev.py
            production.py
      .env
    docker-compose.yaml
    ```
- 저는 docker-compose.yaml 설정에서, `env_file: ./django/.env` 설정을 통해, .env 파일을 shell 컨테이너의 환경변수로 등록하여 사용합니다.
- docker-compose를 사용하지 않고, local에서 .env를 환경변수로 바꾸려면 아래 명령어를 입력합니다.
    ```shell
    $ export $(grep -v '^#' .env | xargs)
    ```

### Docker Compose 설정
```python
version: '3'
services:
  nginx:
    ...
    depends_on:
      - db
      - server1
      - server2
  db:
    ...

  server1:
    container_name: my-server1
    ...
    environment:
      - 'PROFILE=set1'
    depends_on:
      - db

  server2:
    container_name: my-server2
    ...
    environment:
      - 'PROFILE=set2'
    depends_on:
      - db
```
- 현재 어떤 서버가 serve 하는지 판단하기 위해 PROFILE이라는 환경변수를 두어, 아래와 같이 API 반환값을 받습니다.
    ```python
    from rest_framework.views import APIView
    from rest_framework.response import Response
    from rest_framework import status
    import os

    # url: /profile/
    class ProfileController(APIView): 
        def get(self, req, format=None):
            settingProfile = os.environ.get('PROFILE')
            return Response(settingProfile, status=status.HTTP_200_OK)
    ```
- Nginx의 설정 파일은 다음과 같은 방식으로 작성하여, 리버스 프록시를 설정합니다.
    ```nginx
    ...

    upstream servers {
        server server1:8000;
        server server2:8000;
    }
    #HTTPS server
    server {
        listen       443 ssl http2;
        
        ...

        location / {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $http_host;
            proxy_pass http://servers;
        }
    }
    ```
    - 위와 같이 설정하면, `https://localhost/profile`로 요청을 보낼 때, docker-compose 파일에서 설정한 PROFILE 값인 'set1'과 'set2'가 번갈아가며 호출됩니다. (Load Balancing이 적용됨)

### 새로운 배포 적용
**문제 상황**
- 이 상태에서, server2의 코드를 변경하고 다시 업로드하기 위해, `docker-compose stop server2`를 통해 한 서버를 멈추고 요청을 반복하면 아래와 같이 200 status와 499 status가 번갈아가며 반환되는 문제가 발생하였습니다.
    ```log
    172.22.0.1 - - [02/May/2023:22:16:50 +0000] "GET /profile/ HTTP/2.0" 200 5223 ~
    172.22.0.1 - - [02/May/2023:22:19:39 +0000] "GET /profile/ HTTP/2.0" 499 0 ~
    ```
- 이는 클라이언트가 요청을 보내던 중에 서버의 응답을 기다리지 못해 먼저 연결을 끊는 경우입니다.
- nginx가 server2의 종료를 알지 못한 상태에서 먼저 server2에게 요청을 전달한 후, 처리가 되도록 기다리는 시간이 생기게 된 것입니다!
- 따라서, nginx에 server2로 reverse proxy를 막은 후, server2를 정지 시켜야한다고 생각했습니다.










## 참고: Django 배포 환경 설정
- 공통 설정은 다음과 같이 공통적으로 사용하는 부분을 명시합니다.
    ```python
    # mysite.settings.base
    from pathlib import Path
    import os

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')

    INSTALLED_APPS = [
        ...
    ]

    MIDDLEWARE = [
        ...
    ]

    ROOT_URLCONF = 'mysite.urls'

    TEMPLATES = [
        ...
    ]
    ...

  ```
- 개발환경에서는 아래와 같이 설정합니다.
    ```python
    # mysite.settings.dev
    import os
    from .base import *

    SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

    DEBUG = True

    ALLOWED_HOSTS = [
        '127.0.0.1',
        'localhost',
    ]

    INSTALLED_APPS += [
    ]

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }

    MIDDLEWARE += [
    ]

    ```
- 배포환경에서는 아래와 같이 설정합니다.
    ```python
    import os
    from .base import *

    SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

    DEBUG = False

    ALLOWED_HOSTS = [
        '*',
    ]

    INSTALLED_APPS += [
    ]

    DATABASES = {
        'default': {
            'ENGINE': os.environ.get('DB_ENGINE'),
            'NAME': os.environ.get('DB_NAME'),
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST'),
            'PORT': os.environ.get('DB_PORT'),
        }
    }

    MIDDLEWARE += [
    ]
    ```

- API 설정: `base_url/profile`로 요청을 보낼 때, 어떤 설정값을 적용하였는지 불러오는 API 입니다.
    ```python
    from rest_framework.views import APIView
    from rest_framework.response import Response
    from rest_framework import status

    import os

    class ProfileController(APIView): 
        def get(self, req, format=None):
            settingProfile = os.environ.get('DJANGO_SETTINGS_MODULE').split('.')[-1]
            return Response(settingProfile, status=status.HTTP_200_OK)
    ```
- 위의 설정 항목을 모두 작성했으면, 아래와 같이 .env 파일을 생성합니다.
    ```shell
    #.env.sample
    DJANGO_SECRET_KEY=

    DB_ENGINE=
    DB_NAME=
    DB_USER=
    DB_PASSWORD=
    DB_HOST=
    DB_PORT=
    
    TEST_DB_NAME=


    # DJANGO START SETTING
    DJANGO_SETTINGS_MODULE=

    ```


### Docker networking
Use the Default bridge network
- 아래의 예제에서는 같은 docker host에서 다른 두 개의 alpine 컨테이너를 통해 어떻게 서로 통신하는지 살펴봅니다.
- 만약 docker demon 위에는 기본적으로로,  `bridge`, `host`, `none` 세개의 docker network가 있습니다.
    ```docker
    $ docker network ls
    ```
  - `host`, `none`은 fully-fledged networks는 아니지만 사용을 위해서 host의 networking stack에 직접적으로 연결되거나 네트워크 장비가 없는 컨테이너에서 사용됩니다.
- 어떤 컨테이너들이 연결되었는지 확인하기 위해 bridge network를 다음과 같이 볼 수 있습니다.
    ```docker
    $ docker network inspect bridge
    ```
   -  사이에 gateway의 IP 주소를 포함한 Docker host와 bridge network IP를 볼 수 있습니다.
   -  이는, 직접 컨테이너에 접속해서 `ip addr show`, `hostname -I` 등의 네트워크 분석 명령어를 통해서도 알 수 있습니다.
   -  