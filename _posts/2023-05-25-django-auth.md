---
layout: archive
title:  "[Django] 커스텀 유저 및 jwt는 어떤 방식으로 설정할까?"
date:   2023-05-25 20:05:07 +0900
categories: [Django Strategy]
---

# Custom User Registration

```python
# requirements.txt
asgiref==3.6.0
Django==4.2.1
djangorestframework==3.14.0
djangorestframework-simplejwt==5.2.2
PyJWT==2.7.0
pytz==2023.3
rest-framework-simplejwt==0.0.2
sqlparse==0.4.4
```
- djangorestframework-simplejwt를 사용하여 개발합니다.

```python
# settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # restframework
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",

    # custom apps
    "members",
    "core",
    "mytest",
]

...

# Settings for JWT Authentication
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

AUTH_USER_MODEL = 'members.Member'
```
- `AUTH_USER_MODEL`을 `members.Member`로 설정하여, 해당 모델이 Django 기본 user 모델인 `auth_user` 테이블을 대체하도록 합니다.
- 아래와 같이 django app을 구성하여 진행합니다.
  ```
  code/
  - cores/
    - models.py
    - serializers.py
    ...
  - members/
    - models.py
    - urls/
      - auth.py
      - members.py
  - myproject/
    - urls/
  ```
- `cores` 앱은 다른 앱들이 상속 받아서 사용할 만한 핵심 기능을 담당합니다.
- `members` 앱은 클라이언트의 회원가입/인증 관련 작업을 위한 도메인입니다.


**Custom user model setting**
```python
# members/models.py
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
- Django의 기본 user 모델은 `username` 필드가 아이디를 의미합니다. 구현할 간단한 커스텀 유저 모델에서는 핸드폰 번호가 아이디를 대체합니다.
  
**Custom user serializer setting**
```python
# members/serializers.py
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
        password = data.get('password')
        password2 = data.get('password2')

        if password != password2:
            raise serializers.ValidationError({"password2": "This is different with password."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        return Member.objects.createMember(**validated_data)
```
- `MemberCreateSerializer`은 회원가입을 위해 사용하는 serializer로, 비밀번호 확인 기능을 포함합니다.
- `MemberSerializer`에서 재사용 가능한 field를 가져오기 위해
- `core.serializer.CreateSerializer`의 역할은 다음과 같습니다.
  -  `to_representation` 메서드를 이용해, 데이터를 직렬화 하거나, customize하여 필드 값을 원하는 형태로 변환할 수 있습니다.
  - `represntation_serializer_class`를 오버라이드 하여 `to_representation` 메서드에서 사용할 serializer를 선정할 수 있게 합니다. 
  - MemberCreateSerializer.create() 작업을 마치고, 생성된 instance의 data 부분만 추출하여 serialize 후 반환합니다. 생성 후 추가 작업이 필요하다면, 
  ```python
  # core/serializers.py
  from rest_framework import serializers

  class CreateSerializer(serializers.ModelSerializer):
      representation_serializer_class = None

      def to_representation(self, instance):
          return self.representation_serializer_class(instance=instance).data
  ```

**Custom user controller and router setting**
```python
# members/views.py
from django.shortcuts import render

# Create your views here.
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt import views as jwt_views

from members.serializers import MemberCreateSerializer

class MemberCreateAPIView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = MemberCreateSerializer

class TokenCreateAPIView(jwt_views.TokenObtainPairView):
    pass
class TokenRefreshAPIView(jwt_views.TokenRefreshView):
    pass
class TokenBlackListAPIView(jwt_views.TokenBlacklistView):
    pass
```
```python
# members/urls/members.py
from django.urls import path
from members.views import MemberCreateAPIView

app_name = "members"

urlpatterns = [
    path("", MemberCreateAPIView.as_view(), name="create"),
]
```
```python
# members/urls/auth.py
from django.urls import path
from members.views import TokenBlackListAPIView, TokenCreateAPIView, TokenRefreshAPIView

app_name = "auth"

urlpatterns = [
    path("tokens/", TokenCreateAPIView.as_view()),
    path("tokens/refresh/", TokenRefreshAPIView.as_view()),
    path("tokens/blacklist/", TokenBlackListAPIView.as_view()),
]
```
- 앞서 구축한 members.model과 members.serializer를 활용하여 새로운 멤버를 생성할 수 있도록 합니다.
- `rest_framework_simplejwt`에서 기본적으로 사용하는 controller를 통해 토큰 관련 API를 처리합니다.

