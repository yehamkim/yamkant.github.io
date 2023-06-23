---
layout: archive
title:  "[Django] API를 어떻게 명세하여 사용할까?"
date:   2023-05-27 20:05:07 +0900
categories: [Django Strategy]
---

### Open API와 OAS, Swagger
**Open API란?**
- Open API는 누구나 사용할 수 있도록 endpoint가 개방된 API를 의미합니다.
- OpenAPI Specification(OAS)는 OpenAPI(띄어쓰기 없음)이 표기하기도 하며, RESTful 형식의 API 정의된 규약에 따라 json이나 yaml로 표현하는 방식을 의미합니다.
- 직접 소스코드나 문서를 보지 않더라도 서비스를 이해할 수 있다는 장점이 있습니다. 

**Swagger란?**
- 2010년대 초 Tam Wordnik이 개발하기 시작하여, 그의 회사 자체 API용 UI로 개발되었다가 SmartBear에서 인수했습니다.
- 2015년대 말 Linux Foundation의 후원으로 OpenAPI Initiative에 Swagger를 기부하며 OpenAPI Specification으로 이름을 변경합니다.
- 현재, OpenAPI를 실행하기위한 도구로써의 의미로 사용됩니다.
- Swagger Editor: 브라우저 기반의 편집기로, OpenAPI 스펙을 쉽게 작성할 수 있도록 돕습니다.
- Swagger UI: API test가 가능한 OpenAPI 스펙 문서
- Swagger Codegen: 서버나 클라이언트가 stub code를 OpenAPI 스펙에 맞게 생성

**OpenAPI 2.0과 OpenAPI 3.0의 차이**
- 2.0에서는 endpoint url을 host, basePath, schemes로 정의했지만, 3.0에서는 멀티 URL을 지원하고, 각 url마다 username, port, basepath 필드를 가집니다.
- 2.0에서는 특정 Path에서 중복되는 값이 있더라도 일일이 서술해줘야하는 반면, 3.0에서는 Component로 처리하여 중복부분을 변수화 할 수 있습니다.

**OAS의 궁극적인 목표**
- API 문서와 API UI는 서로 다른 프로젝트입니다. 예를 들어, Swagger-UI는 Swagger 프로젝트 중 일부일 뿐이고, API 문서는 json/yaml로 나타낼 수 있는 데이터 덩어리에 불과합니다.
- Swagger-UI와 Redoc은 보기 편하게 만들어진 API 문서 User Interface입니다.
- OAS는 UI를 만드는 것만을 목표로 하지는 않습니다. Client Side와 Server Side 간 API Client SDK와 관련된 모든 것들을 자동화하는 것입니다.
- API 문서를 명확하게 명세해야하는 이유는, 명세를 하는 것만으로도 Client Side에 필요한 소스코드를 역생성하기 위한 것입니다. 이를 위한 프로젝트가 `Swagger Codegen`입니다.

**drf-spectacular를 사용하는 이유**
- 많이 사용되는 drf-yasg의 경우, OpenAPI3.0을 지원하지 않습니다.
- swagger UI의 버전과 설정값들이 drf-spectacular의 버전에 의존하지 않습니다.
- swagger UI 자체에서 제공하는 UI 커스터마이징 옵션들을 자유롭게 조절할 수 있습니다.
- example object를 다양하게 선언할 수 있습니다.

---

### drf-spectacular 사용방법

공식문서: https://drf-spectacular.readthedocs.io/en/latest/

`@extend_schema_view`  
- 클래스 단위의 데코레이터로, 하나의 ViewSet에 속한 method들의 문서화를 커스터마이징 할 때 사용합니다.
- `@extend_schema`보다 우선순위를 가집니다.
- 지정할 수 있는 `view_name`은 기본적으로 `list, retrieve, create, update, delete`가 있습니다.
- `@action`을 통해 생성한 커스텀 메서드의 메서드 또한 `view_name`에 등록 가능합니다.

`@extend_schema`  
- 메서드 단위의 데코레이터로 가장 핵심이 되는 데코레이터입니다.

`@extend_schema_serializer`  
- serializer 자체의 커스텀 스키마를 원하는 경우에 사용할 수 있습니다.
- 적용 우선순위는 method -> viewset -> serializer 순서입니다.

**사용 예시**  
- `views.py`에서 `@extend_schema_view`를 설정하여 공통적으로 적용할 수 있는 설정 항목들을 적용합니다.
- `@extend_schema`를 통해 특정 메서드(예시에서는 create)에 대한 설정항목만 따로 적용합니다.
- `@extend_schema_serializer` 항목을 통해 노출하지 않고자 하는 필드를 기입합니다.

```python
# views.py
from django.contrib.auth.models import User
from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema_view
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework import serializers, status
from test_app.serializers import CustomUserSerializer, UserSerializer
from test_app.schemas import USER_QUERY_PARAM_USERNAME_EXAMPLES, USER_QUERY_PARAM_DATE_JOINED_EXAMPLES, USER_CREATE_EXAMPLES

@extend_schema_view(
    list=extend_schema(
        summary="사용자들 리스트를 조회합니다.",
        tags=["사용자"],
        parameters=[
            OpenApiParameter(
                name="username",
                description="Filter by username",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                examples= USER_QUERY_PARAM_USERNAME_EXAMPLES
            ),
            OpenApiParameter(
                name="date_joined",
                description="Filter by release date",
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                examples= USER_QUERY_PARAM_DATE_JOINED_EXAMPLES
            ),
        ],
    ),
    custom_api=extend_schema(
        summary="@action 데코레이터로 생성한 커스텀 API",
        tags=["사용자"],
        request=UserSerializer,
        responses={status.HTTP_200_OK: UserSerializer},
    ),
)
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @extend_schema(
        tags=["사용자"],
        summary="새로운 사용자를 추가합니다.",
        examples = USER_CREATE_EXAMPLES,
    )
    def create(self, request: Request, *args, **kwargs) -> Response:
        response: HttpResponse = super().create(request, *args, **kwargs)
        return response

    @action(detail=False, url_path="action-api")
    def custom_api(self, request: Request, *args, **kwargs):
        return Response(data={"result": "ok"})
```

```python
# serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers, status
from drf_spectacular.utils import OpenApiExample, extend_schema_serializer
from rest_framework.serializers import ModelSerializer

@extend_schema_serializer(
    exclude_fields=("password",),  
    examples=[
        OpenApiExample(
            "Valid example 1",
            summary="short summary",
            description="longer description",
            value={
                "is_superuser": True,
                "username": "string",
                "first_name": "string",
                "last_name": "string",
                "email": "user@example.com",
                "is_staff": False,
                "is_active": True,
                "date_joined": "2021-04-18 04:14:30",
                "user_type": "customer",
            },
            request_only=True,
            response_only=False,  
        ),
    ],
)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        depth = 1
        fields = "__all__"
```

```python
# schemas.py
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema_view

USER_QUERY_PARAM_USERNAME_EXAMPLES = [
    OpenApiExample(
        "username 필드 필터링을 위한 query parameter 예시입니다.",
        summary="example username 1",
        description="첫 번째 유저명입니다.",
        value="김예함",
    ),
    OpenApiExample(
        "username 필드 필터링을 위한 query parameter 예시입니다.",
        summary="example username 2",
        description="두 번째 유저명입니다.",
        value="김예함",
    ),
]

USER_QUERY_PARAM_DATE_JOINED_EXAMPLES = [
    OpenApiExample(
        "date_joined 필드 필터링을 위한 query parameter 예시입니다.",
        summary="example date_joined 1",
        description="첫 번째 가입일입니다.",
        value="1995-07-08",
    ),
    OpenApiExample(
        "date_joined 필드 필터링을 위한 query parameter 예시입니다.",
        summary="example date_joined 2",
        description="두 번째 가입일입니다.",
        value="1995-07-09",
    ),
]

USER_CREATE_EXAMPLES = [
    OpenApiExample(
        request_only=True,
        summary="성공적으로 생성하는 경우",
        name="success_example",
        value={
            "username": "yamkim",
            "password": "test123!",
            "first_name": "YEHAM",
            "last_name": "KIM",
            "email": "user@example.com",
        },
    ),
    OpenApiExample(
        request_only=True, # 요청시에만 사용가능한 예제로 명시한다.
        summary="비밀번호 너무 쉬움",
        name="invalid_example_too_easy_password",
        value={
            "username": "yamkim",
            "password": "1234",
            "first_name": "YEHAM",
            "last_name": "KIM",
            "email": "user@example.com",
        },
    ),
    OpenApiExample(
        request_only=True,
        summary="이름 필수 입력",
        name="invalid_example_empty_name",
        value={
            "username": "root434",
            "password": "test123!",
            "first_name": "",
            "last_name": "KIM",
            "email": "user@example.com",
        },
    ),
]
```

### 참고
- [gruuuuu님 블로그](https://gruuuuu.github.io/programming/openapi/)
- [요기요 테크 블로그](https://techblog.yogiyo.co.kr/django-rest-framework-api-document-generator-feat-drf-spectacular-585fcabec404)