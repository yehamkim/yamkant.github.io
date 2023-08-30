---
layout: archive
title:  "[Django] DRF에서 Viewset은 어떻게 사용할까?"
date:   2023-08-29 00:05:07 +0900
categories: [Strategy]
---

## 글을 작성하는 이유
- Django의 ViewSet은 유저의 요청에 알맞은 반환값을 반환하도록 동작합니다.
- 프레임워크 내부적으로 중복되는 부분을 최소화시키기 위해 웬만한 기능들이 구현되어 있기 때문에, 상황에 맞는 기능을 찾아서 적절히 사용하는 것이 중요합니다.
- 따라서, ViewSet을 작성하는데 있어, 필수적인 기능과 유용한 기능들을 정리해 보고 상황에 맞게 참고하여 사용하기 위해 글을 작성합니다.

## ModelViewSet 사용 전략
- `ModelViewSet`을 상속받아 ViewSet을 구현하게 되면, 클래스 변수로 아래와 같은 값들을 지정하며 좀 더 장고스럽게 구현할 수 있습니다.

```python
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_deleted="N")
    serializer_class = ProductSerializer
    permission_classes = [IsOwner, ]
    lookup_field = "id"
    filter_backends = [filters.SearchFilter, ]
    search_fields = ['name', ]
    pagination_class = ProductPagination

    serializer_action_classes = {
        'list': ProductSerializer,
        'create': ProductCreateSerializer,
        'update': ProductUpdateSerializer,
        'destroy': ProductDeleteSerializer,
    }

    def get_queryset(self):
        return self.queryset.filter(user_id=self.request.user.id)

    def get_serializer_class(self):
        try:
            return self.serializer_action_classes[self.action]
        except (KeyError, AttributeError):
            return super().get_serializer_class

    @extend_schema(
        request=ProductSerializer,
        summary="상품 목록을 조회합니다.",
        description="""상품 목록을 페이지번호/페이지크기/검색결과에 따라 조회합니다.""",
        tags=['상품'],
        parameters=PRODUCT_LIST_EXAMPLES,
        responses={
            status.HTTP_200_OK: ProductSerializer,
            status.HTTP_403_FORBIDDEN: None
        }
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(queryset=self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return Response(serializer.data)
```

### Permissions
- 위 예시에서, `permission_dlasses`에 해당 ViewSet의 메서드를 사용하기 위한 권한을 나열합니다.
- `IsOwner`의 경우, custom permission으로 `rest_framwework.permissions`의 `BasicPermission`을 상속받아 구성합니다.
- `IsOwner`는 상품을 상세 수정(update 메서드)하거나 상세 조회(retrieve 메서드)하는 경우, 유저가 가지고 있는 상품이 맞는지 확인하는 권한입니다.
- `get_permissions(self)` 메서드를 오버라이드 하면, 메서드에 따라 권한을 수정하여 사용할 수 있습니다.

### Queryset
- 일반적으로 api 메서드(`list`, `create`, `retrieve`, `update`, `delete`)들을 사용할 때는 해당 모델의 전체 값을 필요로 하는 경우가 거의 없습니다.
- Soft delete가 있어서 논리적 삭제되지 않는 경우를 불러온다든지, 활성화된 데이터만 가져온다던지 공통적으로 처리해야 하는 조건에 대한 처리를 `get_query_set(self)`에서 미리 해둘 수 있습니다.
- `get_query_set`은 각각의 api 메서드 내부에서 사용되는 방식으로 `ModelViewSet`이 구현되어있기도 하고, 필요하면 `self`로 호출하여 사용할 수 있습니다.

### Parameters
- Path parameter, Query parameter 등을 사용하게 되는 경우에 대한 처리도 미리 수행할 수 있습니다.

**path parameter**
- `lookup_field`는 `urlpatterns`에 입력된 `path("<int:id>/",...`의 값을 찾아 db의 field 값과 매칭시킵니다.

**search: query parameter**
- `filter_backends`의 `SearchFilter`와 `search_fields`를 위와 같이 설정하면, url query parameter로 입력되는 `?search=값` search에 해당하는 값을 해당 모델의 `name` 필드에서 `SearchFilter`의 방식으로 검색합니다.
- 검색된 쿼리를 사용하려면 `list` 메서드 내부 구현된 바와 같이 `self.filter_queryset` 메서드를 호출하여 사용합니다.     

**page, page_size: query parameter**
- `pagenation_class`를 통해 `page`, `page_size` 각 값에 따라 어떤 방식으로 조회할지 결정할 수 있습니다.

```python

DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 4

class ProductPagination(PageNumberPagination):
    page = DEFAULT_PAGE
    page_size = DEFAULT_PAGE_SIZE
    page_size_query_param = 'page_size'

    def paginate_queryset(self, queryset, request, view=None):
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        return {
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'num_pages': [i for i in range(1, self.page.paginator.num_pages + 1)],
            'num': self.page.number,
            'results': data
        }
```

- 위의 예시는, `ModelViewSet`의 `pagenation_class`에서 지정해준 커스텀 페이지네이션 클래스입니다. 
- 위와 같은 방식으로 페이지네이션된 queryset을 사용할 수도 있고, `self.page.paginator` 클래스가 가지고 있는 값을 제어할 수도 있습니다.

### Serializer
- action마다 다른 serializer를 사용하기 때문에, `get_serializer_class` 메서드를 통해 그에 해당하는 serializer를 불러옵니다.
- 내부적으로 보면, `ModelViewSet`은 `GenericViewSet`을 상속받고, `GenericViewSet` 내부에 `get_serializer`는 위에서 클래스 메서드로 지정해준 `get_serializer_class`의 클래스를 읽어옵니다.
- `get_serializer`는 `DestroyModelMixin`을 제외한 모든 믹스인에서 사용되기 때문에 필수적으로 `serializer`를 지정해야합니다.


---

## Generic view의 동작방식
- DRF 기본 클래스인 `APIView`에서는 사용자가 요청부터 응답까지의 구현을 처리할 수 있습니다.
- Generic view에서는 CRUD 패턴에 대한 구현을 미리 정해놓습니다.
- generic view는 네 가지 속성을 통해 API 동작을 결정합니다.  

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
    - `filter_queryset`에서는 url의 query를 parsing 하여 object manager의 filter를 추가할 수 있습니다.

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
- 인증이나 권한의 경우, settings.py에 REST_FRAMEWORK에 값을 정의해 두고, 전역적으로 이를 사용할 수 있습니다.

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
- `filter_queryset`: url query parameter을 parsing 하여 `queryset`에 필터링을 추가합니다.
- `get_serializer_context`: POST 요청시, `create` serializer 동작 수행시 category instance가 필요하기 때문에, 해당 작업을 미리 해줄 수 있습니다.


### 참고
- [mynghn님 블로그](https://velog.io/@mynghn/%EC%A0%9C%EB%84%A4%EB%A6%AD-%EB%B7%B0%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%B4-API-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0)
