---
layout: archive
title:  "[Django] 배포/개발 환경은 어떻게 설정할까?"
date:   2023-05-13 20:05:07 +0900
categories: [Strategy]
---

### 최종 목표
- `.env` 파일에 설정된 `DJANGO_SETTINGS_MODULE`에 따라서 배포환경에 맞는 settings.py 사용

### Django Container Setting

**Django 폴더 구조**
```
web
- Dockerfile
- apps/
  - config/
    - settings/
      - base.py
      - development.py
      - production.py
    - wsgi/
      - development.py
      - production.py
    ...
  - entrypoint.sh
  - manage.py
  - requirements.txt
- .env
```

**Django 배포 환경 설정**
- 공통 설정은 다음과 같은 방식으로 공통적으로 사용하는 부분을 명시합니다.
    ```python
    # config.settings.base

    from pathlib import Path
    import os


    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

    TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')

    ROOT_URLCONF = 'config.urls'

    STATIC_URL = 'static/'
    STATIC_ROOT = 'staticfiles'

    INSTALLED_APPS = [
        ...
    ]

    MIDDLEWARE = [
        ...
    ]

    TEMPLATES = [
        ...
    ]
    ...

  ```

- 개발환경에서는 아래와 같은 방식으로 작성합니다.
    ```python
    # config.settings.dev
    import os
    from .base import *

    DEBUG = True
    WSGI_APPLICATION = "config.wsgi.application"

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

- live 서버의 배포환경에서는 아래와 같은 방식으로 작성합니다.
    ```python
    # config.settings.production
    import os
    from .base import *

    DEBUG = False
    WSGI_APPLICATION = "config.wsgi.application"

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

### Django 서버 배포
**Django 서버 Dockerize**  
- 설정이 완료된 후, gunicorn 통해 실행하기 위해 아래 명령어를 사용합니다.
    ```shell
    $ gunicorn --bind 0.0.0.0:8000 config.wsgi.development:application
    ```
- 이때, 정적 파일은 서빙되지 않기 때문에, Nginx 설정과 함께 배포해주어야 합니다.
- 먼저 Django를 컨테이너로 세팅하기 위해 Dockerfile을 다음과 같이 작성합니다.
  ```Docker
  # Dockerfile
  # syntax=docker/dockerfile:1

  FROM python:3
  ENV PYTHONDONTWRITEBYTECODE=1
  ENV PYTHONUNBUFFERED=1
  WORKDIR /apps
  COPY apps /apps/

  EXPOSE 8000/tcp

  RUN chmod +x /apps/entrypoint.sh
  CMD /apps/entrypoint.sh
  ```
  ```
  # entrypoint.sh

  #!/bin/sh

  python3 -m pip install --upgrade pip
  pip install -r requirements.txt

  python manage.py migrate
  python manage.py collectstatic

  gunicorn --bind 0.0.0.0:8000 config.wsgi:application
  ```
  - `python manage.py collectstatic` 명령어를 사용하면 Django app들에서 사용하는 static file을 추출합니다.
    (정확한 경로를 안다면, 직접 모아도 무방합니다.)
  - `settings.base.py`에서 `STATIC_ROOT`에 지정한 폴더명에 정적 파일들이 모입니다.
    

### Nginx Container Setting

**Nginx 폴더 경로**
```
nginx
- Dockerfile
- code/
  - templates/
    - default.conf.template
- staticfiles/
- entrypoint.sh
```  

**Nginx 서버 Dockerize**  
- `default.conf.template`는 환경변수를 사용하기 위한 configuration template 입니다.
  ```nginx
  server {
      listen       80;
      listen  [::]:80;
      server_name  ${NGINX_SERVER_NAME};

      access_log  /var/log/nginx/logs/host.access.log  main;

      location / {
          proxy_redirect     off;
          proxy_set_header   Host $host;
          proxy_set_header   X-Real-IP $remote_addr;
          proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_read_timeout 1200;

          proxy_pass         http://web:8000/;
      }

      location /static {
          alias /staticfiles;
      }
      ...
  }
  ```
  - `NGINX_SERVER_NAME`을 환경변수로 불러와서 치환되도록 설정할 수 있습니다.
  - `/static` 경로로 오는 요청들을 HOST로부터 옮겨온 /staticfiles에서 처리합니다.
- `Dockefile` 및 `entrypoint.sh`는 다음과 같이 작성합니다.
  ```docker
  # Dockefile
  FROM nginx:1.21.6

  RUN apt-get update
  RUN apt-get install -y openssl
  
  COPY ./entrypoint.sh /entrypoint.sh
  COPY ./code/templates /etc/nginx/templates
  
  COPY ./staticfiles /static
  
  ENV NGINX_HOST localhost
  ENV INITIAL_START 1
  
  CMD ["/bin/bash", "/entrypoint.sh"]
  ```
  ```bash
  # entrypoint.sh
  mkdir -p /var/log/nginx/logs/

  # nginx 실행 전 템플릿 파일의 변수를 환경 변수 값으로 변경해주는 구문입니다.
  if [ "$INITIAL_START" -eq '1' ]; then
      bash /docker-entrypoint.d/20-envsubst-on-templates.sh
      INITIAL_START="0"
  fi
  nginx -g "daemon off;"
  ```
  - nginx 컨테이너 내부 /etc/nginx/conf.d/default.conf는 `/docker-entrypoint.d/20-envsubst-on-templates.sh`에 의해 `code/templates/default.conf.template`가 생성됩니다.
  - `IINITIAL_START`를 설정하지 않으면, default.conf를 변경하여 설정값을 유지하고 싶어도 계속해서 템플릿이 변형되기 때문에 해당 구문을 넣었습니다.

**Service Dockerize**
```docker
version: "3"
services:
  nginx:
    build: ./nginx
    container_name: nginx
    ports:
      - "80:80"
    depends_on:
      - web

  web:
    build: ./web
    container_name: web
    env_file:
      - ./web/.env
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production
```
- 대부분에 설정은 Dockerfile에서 마치고, container 실행부분만 docker-compose에 위임합니다.