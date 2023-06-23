---
layout: archive
title:  "[Django] DRF에서 Generic view, Model viewset은 어떻게 사용할까?"
date:   2023-05-27 20:05:07 +0900
categories: [Django Strategy]
---

참고: [mynghn님 블로그](https://velog.io/@mynghn/%EC%A0%9C%EB%84%A4%EB%A6%AD-%EB%B7%B0%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%B4-API-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0)
### Generic view의 동작방식
- DRF 기본 클래스인 `APIView`에서는 사용자가 요청부터 응답까지의 구현을 처리할 수 있습니다.
- Generic view에서는 CRUD 패턴에 대한 구현을 미리 정해놓습니다.
- generic view는 네가지 속성을 통해 API 동작을 결정합니다.
    ```
    - authentication_classes: 요청자의 가입 및 로그인 여부를 식별합니다.
        - .get_authenticators(self)
    - permission_classes: API 요청에 대한 요청자의 권한을 검증합니다.
        - .get_permissions(self) 
    - queryset: 클래스 내부에서 사용하기 위한 기준이 되는 queryset을 설정합니다.
        - .get_queryset(self): 데이터를 정적으로(미리 데이터의 바운더리를 정해두고) 불러올 때 사용합니다.
        - .filter_queryset(self, queryset): 데이터를 동적으로(클라이언트의 요청에 따라 다른 값을 가져오도록) 불러올 때 사용합니다.
    - serializer_class: request와 response 스펙을 정의하는 serializer를 설정합니다.
        - .get_serializer_class(self)
        - .get_serializer_context(self)
        - .get_serializer(self, ...)
    ```
    - `queryset`에서, soft-deleted 요소를 조회하면, `queryset = Item.objects.filter(is_deleted='N')`과 같이 처리합니다. (정적 필터 적용)
    - `filter_queryset`에서는 url의 query를 parsing하여 object manager의 filter를 추가할 수 있습니다.

- Gneric API View에서, 기본적으로 설정한 예시는 다음과 같습니다.
    ```python
    # items/views/ItemView.py
    from rest_framework.settings import api_settings
    from rest_framework.generics import ListCreateAPIView
    from items.serializers import ItemSerializer, ItemCreateSerializer

    from rest_framework.settings import api_settings

    class ItemListCreateAPIView(ListCreateAPIView):
        authentication_classes = api_settings.DEFAULT_AUTHENTICATION_CLASSES
        permission_classes = api_settings.DEFAULT_PERMISSION_CLASSES
        queryset=Item.objects.filter(is_deleted="N")

        ...
    ```
    ```python
    # settings.py
    ...

    REST_FRAMEWORK = {
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTAuthentication",
        ),
        "DEFAULT_PERMISSION_CLASSES": [
            "rest_framework.permissions.IsAuthenticated",
        ],
        "DEFAULT_FILTER_BACKENDS": (
            'django_filters.rest_framework.DjangoFilterBackend',
        ),
    }
    ```
- 인증이나 권한의 경우, settings.py에 REST_FRAMEWORK에 값을 정의해두고, 전역적으로 이를 사용할 수 있습니다.

```python
# views.py

from django.shortcuts import get_object_or_404
from rest_framework.generics import ListCreateAPIView
from items.serializers import ItemSerializer, ItemCreateSerializer
from items.models import Item, Category
from rest_framework.settings import api_settings

'''
# 요구사항
아이템 생성
- 아이템 이름, 가격, 브랜드가 모두 같은 경우 생성을 막습니다.
- 상품의 금액이 10000원 이하인 경우 생성을 막습니다. 

아이템 조회
- soft deleted 되지 않은 상품들을 가져옵니다.
'''

class ItemListCreateAPIView(ListCreateAPIView):
    allowed_method = ["get", "post"]
    authentication_classes = api_settings.DEFAULT_AUTHENTICATION_CLASSES
    permission_classes = api_settings.DEFAULT_PERMISSION_CLASSES
    queryset=Item.objects.filter(is_deleted="N")

    def get_queryset(self):
        return super().get_queryset()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ItemSerializer
        if self.request.method == 'POST':
            return ItemCreateSerializer
    
    def filter_queryset(self, queryset):
        if 'name' in self.request.query_params:
            name = self.request.query_params['name']
            return queryset.filter(Q(name__icontains=name))
        return queryset
    
    def get_serializer_context(self):
        if self.request.method == 'POST':
            context = super().get_serializer_context()
            context["cate_id"] = self.category()
            return context

    def category(self):
        reqData = self.request.data
        if "cate_id" not in reqData:
            return 
        categoryObject = get_object_or_404(Category, id=reqData["cate_id"])
        self.check_object_permissions(self.request, categoryObject)
        return categoryObject
```
- `queryset`: `get_queryset()` 메서드에서 불러올 쿼리셋을 정적으로 지정합니다.(외부에 의해 수정되지 않습니다.)
- `filter_queryset`: url query parameter을 parsing하여 `queryset`에 필터링을 추가합니다.
- `get_serializer_context`: POST 요청시, `create` serializer 동작 수행시 category instance가 필요하기 때문에, 해당 작업을 미리 해줄 수 있습니다.


