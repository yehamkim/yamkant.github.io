Django custom user 생성을 위한 설정 추가


**작업을 위한 Directory Level**
```
web
- apps/
  - config/
    - settings/
      - base.py
      - development.py
      - production.py
    ...
  - core/
    - serializers.py
    - models.py
    ...
  - members/
    - urls/
      - members.py
    - models.py
    - serializers.py
    - views.py
    ...
```

```python
# config.settings.base.py
INSTALLED_APPS = [
    ...
    'members',
]

AUTH_USER_MODEL = 'members.Member'

```
- config 앱의 base setting 파일에서 members 앱을 추가하고, AUTH_USER를 Member 모델로 대체하기 위한 작업을 수행합니다.

```python
# members.models.py

from core.models import BaseModel
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models

class MemberManager(BaseUserManager):
    def createMember(self, phone, password):
        member = self.model(phone=phone)
        member.set_password(password)
        member.save()
        return member

class Member(BaseModel, AbstractUser):
    username = None
    phone = models.CharField(
        unique=True,
        max_length=11,
        validators=[
            RegexValidator(
                r"^01[016789][0-9]{7,8}$",
                message="This phone number format is invalid.",
            )
        ]
    )
    objects = MemberManager()

    USERNAME_FIELD = "phone"

    class Meta:
        managed = True
        db_table = 'members'
```
- `Member` 모델은 `USERNAME_FIELD`를 핸드폰 번호로 대체합니다.
- `Member.objects`의 메서드를 추가하기 위해 MemberManager(Django 기본 유저를 제어하기 위해 사용하는 BaseUserManager 상속)를 생성합니다.
- 따라서, `Member.objects.createMember` phone와 password 필드를 각각 설정합니다.

```python
# core.serailizers.py
from rest_framework import serializers

class CreateSerializer(serializers.ModelSerializer):
    representation_serializer_class = None

    def to_representation(self, instance):
        return self.representation_serializer_class(instance=instance).data
```
```python
# members.serializers.py
from rest_framework import serializers
from core.serializers import CreateSerializer

from members.models import Member

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id",
            "phone",
        ]
        read_only_fields = fields

class MemberCreateSerializer(CreateSerializer):
    representation_serializer_class = MemberSerializer
    password2 = serializers.CharField(required=True)

    class Meta:
        model = Member
        fields = (
            "phone",
            "password",
            "password2",
        )
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "This is different with password."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        return Member.objects.createMember(**validated_data)
```
- `core.serializers.CreateSerializer`를 상속하여 `to_representation`을 통해 내부에서 `ModelSerializer`를 직렬화하여 사용합니다.
- `view`에서 `member`를 생성하기 위해 호출할 `serializer`를 추가합니다.
- 일반적으로 `MemberSerializer`를 통해서 `Member` 모델의 `id` 값과 `phone(로그인 아이디)` 값을 사용합니다.
- `MemberCreateSerializer`는 `password2`를 추가적으로 정의하고, 그 외의 필드는 `MemberSerializer`에서 serialize하여 사용합니다.

```python
# members.views.py

from django.shortcuts import render

# Create your views here.
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from members.serializers import MemberCreateSerializer

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema_view
from drf_spectacular.utils import extend_schema
from members.serializers import MemberCreateSerializer

@extend_schema(
    tags=["사용자"],
    summary="새로운 사용자를 추가합니다.",
)
class MemberCreateAPIView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = MemberCreateSerializer
```
- 간단히 generic view를 사용하여 새로운 유저를 생성하는 방식을 추가합니다.

---

## JWT 인증 방식 추가 설정하는 방법

jwt access token 및 refresh token을 관리하는 모듈을 설치합니다.
```shell
$ pip install djangorestframework-simplejwt
```

settings.py에서 `DEFALT_AUTHENTICATION_CLASSES`와 `DEFAULT_PERMISSIONS_CLASSES`를 정의합니다.
```python
# config.settings.base.py

...

# 기본 스키마는 drf-spectacular를 사용하고 있습니다.
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    ...
}
```

기존 simlejwt 모듈의 제너릭뷰를 그대로 사용합니다. (필요에 따라서 auth 앱을 추가적으로 만들어 사용합니다.)
```python
# members.views.py

...
from rest_framework_simplejwt import views as jwt_views

...
class TokenCreateAPIView(jwt_views.TokenObtainPairView):
    pass

class TokenRefreshAPIView(jwt_views.TokenRefreshView):
    pass
    
class TokenBlackListAPIView(jwt_views.TokenBlacklistView):
    pass
```

jwt 관련 라우팅을 위해 url을 설정합니다.

```python
# members.urls.auth.py
from django.urls import path
from members.views import TokenBlackListAPIView, TokenCreateAPIView, TokenRefreshAPIView

app_name = "auth"

urlpatterns = [
    path("tokens/", TokenCreateAPIView.as_view()),
    path("tokens/refresh/", TokenRefreshAPIView.as_view()),
    path("tokens/blacklist/", TokenBlackListAPIView.as_view()),
]
```
```python
# config.urls.py

from django.urls import path, include

from drf_spectacular.views import SpectacularJSONAPIView
from drf_spectacular.views import SpectacularRedocView
from drf_spectacular.views import SpectacularSwaggerView
from drf_spectacular.views import SpectacularYAMLAPIView

urlpatterns = [
    ...
    path('auth/', include('members.urls.auth')),
]

urlpatterns += [
    path("docs/json/", SpectacularJSONAPIView.as_view(), name="schema-json"),
    path("docs/yaml/", SpectacularYAMLAPIView.as_view(), name="swagger-yaml"),
    path("docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema-json"), name="swagger-ui",),
    path("docs/redoc/", SpectacularRedocView.as_view(url_name="schema-json"), name="redoc",),
]
```