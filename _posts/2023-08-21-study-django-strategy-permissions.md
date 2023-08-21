---
layout: archive
title:  "[Django Strategy] permissions"
date:   2023-08-21 00:05:07 +0900
categories: 
    - Django Strategy
---

### 글을 작성한 계기
- 최근 과제전형을 보며, 백오피스로 주로 사용하는 Django에서 권한 관리에 대한 중요성을 많이 느끼게 되었습니다.
- ViewSet의 메서드를 사용할 때 Global Permission을 적용시켜야 하는지, Object-level Permission을 적용시켜야하는지 등 기본에 충실해서 학습해야함을 느꼈습니다.
- 아래 내용들은 단순히 DRF 문서의 번역이 아닌, 실제 사용하며 분석한 내용과 사용 전략이 포함되어있습니다.

## Django Permissions
- ModelViewSet등 APIView 기반의 뷰를 사용하기 위해 권한이 있는 사용자만 사용할 수 있도록 제한해야하는 경우가 있습니다.

### 기본적인 형태
```python
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    # permission_classes = [IsAccountAdminOrReadOnly]

    def get_permissions(self):
        if self.action == 'list':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
```
- ViewSet 내의 모든 메서드에 공통적인 Permission Class를 적용하기 위해서는 ViewSet의 클래스 변수로 처리합니다.
- `permission_classes`에 custom permission 클래스들을 추가하여 원하는 권한에 해당하는 사용자만 메서드를 이용할 수 있도록 전처리할 수 있습니다. 
- 이 때, ViewSet의 클래스 메서드인 `get_queryset`는 필수적입니다.
- method에 따라 적용하는 권한이 변경된다면, `get_permissions` 메서드를 이용합니다.


### Custom Permission Class
- DRF에서 제공하는 `BasePermission`를 상속받는 커스텀 Permission은 아래와 같은 형태를 가지며, `has_permission` 또는 `has_object_permission`를 override하여 사용합니다.
    ```python
    class BasePermission(metaclass=BasePermissionMetaclass):
        def has_permission(self, request, view):
            return True

        def has_object_permission(self, request, view, obj):
            return True

    SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')
    class ReadOnly(BasePermission):
        def has_permission(self, request, view):
            return request.method in SAFE_METHODS

    class IsOwner(BasePermission):
        def has_permission(self, request, view):
            return request.method in SAFE_METHODS

        def has_object_permission(self, request, view, obj):
            return obj.owner == request.user
    ```
- 권한이 있으면 True를, 아니면 False를 반환하도록 설계합니다.
- `has_object_permission`는 `has_permission` 검사를 통과한 이 후에 실행됩니다. 
- `ModelViewSet`이 상속받는 `GenericAPIView`에 `get_object` 메서드 내부에 `self.check_object_permissions`는 해당 object가 지정해둔 permission에 따라 권한을 갖는지를 판단합니다.
- Django의 mixins 모듈을 살펴보면, `get_object` 메서드를 사용하는 믹스인은 detail 관련 `Retrieve`(조회), `Update`(수정), `Destroy`(삭제) 모듈에서 사용하게 되며, 이 때 object-level Permission을 확인합니다.

