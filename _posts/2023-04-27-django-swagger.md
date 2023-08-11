---
layout: archive
title:  "[Django] Swagger는 어떻게 설정할까?"
date:   2023-04-25 20:05:07 +0900
categories: [Django Strategy]
---

# swagger 설정

### 현재 디렉터리 레벨
```
.venv
code
- api(app)
  - urls.py
- mysite(base)
  - settings.py
  - urls.py
- static
```

### 설치항목
- 관련 모듈 설치 및 settings.py에 설정 항목을 추가합니다.
    ```shell
    $ pip install drf-yasg
    ```
    ```python
    # settings.py
    INSTALLED_APPS = [
        ...
        'django.contrib.staticfiles',
        'drf_yasg',
        ...
    ]
    ...
    STATIC_URL = '/static/'
    STATICFILES_DIRS = [BASE_DIR, 'static',]

    ...
    SWAGGER_SETTINGS = {
        'SECURITY_DEFINITIONS': {
            'basic': {
                'type': 'basic'
            }
        },
    }
    REDOC_SETTINGS = {
    'LAZY_RENDERING': False,
    }
    ```  

- static 폴더 경로를 설정 후에, drf-yasg 라이브러리의 static들을 가지고 와서 설정합니다.
    ```shell
    # 서두의 디렉터리 레벨 참고
    $ cp -r .venv/lib/drf-yasg/static/* ./code/static
    ```
- mysite.urls에 다음과 같이 설정합니다.
    ```python
    from django.contrib import admin
    from django.urls import path, include, re_path
    from django.conf.urls import url

    # SWAGGER SETTING
    from rest_framework import permissions
    from drf_yasg.views import get_schema_view
    from drf_yasg       import openapi

    schema_view = get_schema_view(
        openapi.Info(
            title="ShoppingCart",
            default_version='Project Version: 0.0.1',
            description="",
            terms_of_service="",
            contact=openapi.Contact(email="dev.yamkim@gmail.com"),
            license=openapi.License(name="MIT"),
        ),
        public=True,
        permission_classes=[permissions.AllowAny],
    )

    urlpatterns = [
        re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
        re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

        ...
        path('api/', include('api.urls')),
        ...
    ]
    ```


### 전송방식에 따른 스웨거 설정
**application/json 양식을 전송하는 방식을 표기합니다.**
```python
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

class ExampleViewSet(APIView)

    # 기본 parser class는 application/json

    @swagger_auto_schema(
        operation_summary="",
        operation_description="",
        operation_id='',
        tags=[],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT, 
            properties={
                'field_1': openapi.Schema(type=openapi.TYPE_INTEGER, description='1번 필드'),
                'field_2': openapi.Schema(type=openapi.TYPE_STRING, description='2번 필드'),
                ...
            }
        )
    )
    def post(self, req, format=None):
        ...

```

**form data를 전송하는 방식을 표기합니다.**
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from api.serializers.DeliveryImageSerializer import *
from rest_framework.parsers import MultiPartParser

# swagger 설정
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

class ExampleViewSet(APIView):

    parser_classes = [MultiPartParser]

    @swagger_auto_schema(
        operation_summary="",
        operation_description="",
        operation_id="",
        tags=[],
        manual_parameters=[
            # 파일 업로드 하는 경우
            openapi.Parameter('field_1', openapi.IN_FORM, type=openapi.TYPE_FILE, description='""'),
            # 일반 변수 업로드 하는 경우
            openapi.Parameter('field_2', openapi.IN_FORM, type=openapi.TYPE_INTEGER,  description='""'),
        ],
    )
    def post(self, req, format=None):
        ...
```
