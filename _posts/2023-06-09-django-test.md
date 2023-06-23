---
layout: archive
title:  "[Django] 테스트는 어떻게 수행할까?"
date:   2023-06-09 10:05:07 +0900
categories: 
    - Django Strategy
---

### 작성이유 및 목표
- 흔히 리팩토링을 위해서, 발생할 법할 문제들을 미리 파악하기 위해서, 어떤 방식으로 사용하는지 명시하기 위해서 테스트를 작성합니다.
- 알고리즘 문제를 풀면서 또한 테스트 케이스의 중요성과 백엔드 개발자들이 왜 테스트 커버리지를 채워나가는데 집착하는지를 느끼게 됩니다.
- 해당 게시글에서는 Django를 통해 e2e, integration 테스트를 하기 위한 간단한 예시를 작성합니다.
- 커스텀 유저를 위한 members 도메인을 예시로 설명합니다.

### 폴더 경로
```markdown
web/
- apps/
  - config/
  - core/
    - tests.py
  - members/
    - tests/
      - integration.py
      - e2e.py
```

## Integration test
외부 라이브러리와 같이 의존적인 부분을 함께 테스트합니다. Django에서는 test DB를 수월하게 만들고 수정하게 할 수 있습니다.

### 기본 테스트 클래스 설명
```python
# apps/core/tests.py

from django.test import TestCase
from typing import Optional, Dict
from django.core.serializers.base import Serializer

from django.db import connection, reset_queries
from django.test import TestCase, override_settings

class TestSerializerHelper():
    def __init__(self, serializer: Serializer, queryCnt: int = 0):
        self.serializer = serializer
        self.queryCnt = queryCnt

    def _create(self, data):
        serializer = self.serializer(data=data)
        if serializer.is_valid():
            instance = serializer.create(data)
            return instance
        else:
            serializer.is_valid(raise_exception=True)
    
    def create(self, data):
        createData = self._create
        if self.queryCnt:
            createData = wrapFunctionForQueryCount(self.queryCnt)(self._create)
        return createData(data)
    
    def run(self, data: Optional[Dict]):
        if self.serializer.serializer_type == "create":
            return self.create(data)

class IntegrationSerializerTestCase(TestCase):
    def serializer_test(
        self,
        expectedQueryCount: Optional[int] = None,
        expectedResult: Optional[bool] = None,
        **data,
    ):
        testSerializerHelper = TestSerializerHelper(self.serializer, expectedQueryCount)

        instance = None
        try:
            instance = testSerializerHelper.run(data)
            self.assertEqual(expectedResult, True)
        except Exception as e:
            self.assertEqual(expectedResult, False)
        return instance
```
- `IntegrationSerializerTestCase`는 serializer의 integration 테스트를 위해 구성한 `TestCase` 클래스입니다.
- 테스트를 수행하기 위해 이를 상속한 클래스에서 테스트를 위한 `serializer`를 클래스 변수로 지정하면 해당 `TestCase`에서 이를 활용하는 방식입니다.
  (상속하여 사용하는 방식 이 후 설명)
- 얼마나 많은 sql query를 호출했는지 평가하기 위해 DB 호출 부분을 `wrapFunctionForQueryCount`로 감싸서 사용합니다.
    ```python
    ...
    from django.db import connection, reset_queries
    ...

    def wrapFunctionForQueryCount(count):
    def decorator(func):
        @override_settings(DEBUG=True)
        def wrapper(*args, **kwargs):
            reset_queries()
            ret = func(*args, **kwargs)
            queries = connection.queries
            for query in queries:
                # TODO: Logger 사용하여 출력결과 저장
                print(f"QUERY: {query['sql']}, TIME: {query['time']}")
            assert len(queries) == count, "QUERY COUNT:%d != %d" % (len(queries), count)
            return ret
        return wrapper
    return decorator
    ```


**Serializer 구성**
- 저는 생성을 위해 사용하는 `ExampleCreateSerializer`는 `core.serializers.CreateSerializer`를 상속받도록 생성합니다. 
- 따라서, 내부에 어떤 타입의 serializer인지 명시하기 때문에, `TestSerialize.run()`과 같이 사용할 수 있습니다.
    ```python
    # core.sesrializers.CreateSerializer
    from rest_framework import serializers

    class CreateSerializer(serializers.ModelSerializer):
        representation_serializer_class = None
        serializer_type = "create"

        def to_representation(self, instance):
            return self.representation_serializer_class(instance=instance).data
    ```

### 기본 테스트 클래스를 상속받는 테스트 예시
```python
# apps/members/tests.integration.py
from django.urls import reverse
from core.tests import IntegrationSerializerTestCase
from members.serializers import MemberCreateSerializer

class MemberCreateSerializerTest(IntegrationSerializerTestCase):
    serializer = MemberCreateSerializer

    @classmethod
    def setUpTestData(cls) -> None:
        pass

    # 1st query: unique phone number check
    # 2nd query: insert new member
    
    def test_success(self):
        instance = self.serializer_test(
            expectedQueryCount=2,
            expectedResult=True,
            phone="01050175933",
            password="5933",
            password2="5933",
        )
        self.assertEqual(instance.phone, "01050175933")

    def test_mismatch_password(self):
        instance = self.serializer_test(
            expectedQueryCount=1,
            expectedResult=False,
            phone="01050175933",
            password="5933",
            password2="59332",
        )

    def test_empty_phone(self):
        instance = self.serializer_test(
            expectedQueryCount=0,
            expectedResult=False,
            phone="",
            password="5933",
            password2="59333",
        )

    def test_register_repeated_phone(self):
        instance = self.serializer_test(
            expectedResult=True,
            phone="01050175933",
            password="5933",
            password2="5933",
        )
        instance = self.serializer_test(
            expectedQueryCount=1,
            expectedResult=False,
            phone="01050175933",
            password="5933",
            password2="5933",
        )
```
- 위와 같이, member 생성 테스트를 위한 테스트 클래스는 앞서 설명한 기본 테스트 클래스를 상속받습니다.
- 기대하는 결과(생성이므로 생성되었는지)가 잘 반환되었는지, 테스트 중 오류는 없는지 확인할 수 있습니다.