---
layout: archive
title:  "[Django] 테스트는 어떻게 수행할까? (query count 포함)"
date:   2023-08-21 00:05:07 +0900
categories: [Django Strategy]
---

## 글을 작성하게 된 계기
- 테스트 환경을 구축하는 것이 초반에는 번거로울지 모르지만, 기능 구현에 대한 발전 과정 / 리팩토링 과정을 공유하고 특정 기능에 대해 구체적인 예시로 살펴볼 수 있다는 점에 있어서 편리하다고 생각되었습니다.
- 서비스를 실행시키고 postman 혹은 화면작업을 통한 이벤트로 구현한 작업을 실행하는 번거로운 작업보다 간단한 `python3 manage.py test ~` 명령어를 통해 구현 기능을 미리 검토해볼 수 있다는 장점이 있습니다.
- 구현 기능을 적용시키기 이전, 테스트를 습관화 하기 위해 사용하던 전략을 정리하기 위해 포스팅합니다.

### serializer test를 위한 TestCase 작성
```python
# core.test.py

import logging
logger = logging.getLogger("skeleton")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

from django.db import connection, reset_queries
def assert_query_count(count):
    def decorator(func):
        @override_settings(DEBUG=True)
        def wrapper(*args, **kwargs):
            reset_queries()
            ret = func(*args, **kwargs)
            queries = connection.queries
            for query in queries:
                logger.debug(f"QUERY: {query['sql']}, TIME: {query['time']}")
            assert len(queries) == count, "QUERY COUNT:%d != %d" % (len(queries), count)
            return ret
        return wrapper
    return decorator

class IntegrationSerializerTestCase(TestCase):
    def serializer_test(
        self,
        expected_query_count: int = None,
        instance: Optional[ModelSerializer] = None,
        **data,
    ):
        run_test = self.run_test
        if expected_query_count:
            run_test = assert_query_count(expected_query_count)(run_test)
        return run_test(instance, data)

    def run_test(self, instance, data):
        if isinstance(self.serializer(), CreateSerializer):
            return self.create(data)
        elif isinstance(self.serializer(), UpdateSerializer):
            return self.update(instance, data)

        if not instance:
            raise ValueError("instance must be a ModelSerializer")
        return self.serializer(instance)

    def create(self, data):
        serializer = self.serializer(data=data)
        if serializer.is_valid(raise_exception=True):
            instance = serializer.save()
            return serializer

    def update(self, instance, data):
        serializer = self.serializer(instance, data=data, partial=True)
        if serializer.is_valid(raise_exception=True):
            updated_instance = serializer.save()
            return serializer
```
- `core` 앱의 test 파일에 위와 같이 다른 테스트에서 상속받을 TestCase 클래스를 작성합니다. import 모듈은 생략합니다.  
- 저는 테스트 작성시 `TestCase`를 상속받은 `IntegrationSerializerTestCase`를 상속받는 방식으로 테스트를 수행합니다.
- 클래스 변수로 지정한 `serializer`에 따라서, 검증하는 방식이 다릅니다. 테스트를 위해 더욱 구체적인 정보를 추가해야할 필요가 있다면 `IntegrationSerializerTestCase`의 메서드에서 이를 관리하는 방식으로 사용합니다.
- `serializer.save()` 이 후 반환되는 값은 serializer.data입니다.
- 얼마나 많은 sql query를 호출했는지 평가하기 위해 DB 호출 부분을 `assert_query_count` 데코레이터를 사용합니다. `expected_query_count`를 인자로 추가한다면, 이에 대한 부분도 평가합니다.
- 테스트 함수에서 `isinstance`로 serializer를 구분하는데, 이들은 미리 `core.serializers.py`에 작성하여둔 시리얼라이저를 상속하는 방식입니다.
    ```python
    # core.serializers.py
    from rest_framework import serializers

    class CreateSerializer(serializers.ModelSerializer):
        representation_serializer_class = None

        def to_representation(self, instance):
            return self.representation_serializer_class(instance=instance).data

    class UpdateSerializer(serializers.ModelSerializer):
        representation_serializer_class = None

        def to_representation(self, instance):
            return self.representation_serializer_class(instance=instance).data
    ```
    - 해당 클래스들을 상속받아 생성/수정 시리얼라이저를 사용하게 될 것이므로, 공통되는 추가적인 정보 기입 혹은 로깅등이 있다면 이곳에 추가합니다.

### 구체적인 사용 예시

```python
# products.test_serializer.py

class ProductUpdateSerializerTestCase(IntegrationSerializerTestCase):
    serializer = ProductUpdateSerializer

    @classmethod
    def setUpTestData(cls) -> None:
        ...

    def test_success(self):
        prod = get_object_or_404(Product, id=self.prod_data['id'])

        serializer = self.serializer_test(
            expected_query_count=1,
            instance=prod,
            name=self.update_data['name'],
            category=self.update_data['category'],
            is_active=self.update_data['is_active'],
            is_deleted=self.update_data['is_deleted'],
        )

        test_field_list = ['name', 'category', 'is_active', 'is_deleted']

        for field in test_field_list:
            with self.subTest(field=field):
                self.assertEqual(serializer.data[field], self.update_data[field])
```
- `core` 앱으로부터 `IntegrationSerializerTestCase`를 상속받아, 원하는 시리얼라이저를 테스트합니다.
- `ProductUpdateSerializer`는 아래와 같이 구성되어, `core.serializer.UpdateSerializer`를 상속받습니다.
    ```python
    class ProductUpdateSerializer(UpdateSerializer):
        representation_serializer_class = ProductSerializer

        class Meta:
            model = Product
            fields = (
                "name",
                "category",
                "is_active",
                "is_deleted",
            )
    ```
- `self.serializer_test`의 결과로 반환되는 serializer의 내용들을 활용하여 테스트합니다.
