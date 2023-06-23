---
layout: archive
title:  "[Django] ORM 사용시 주의사항"
date:   2023-04-11 23:05:07 +0900
categories: [Django Deep]
---

## 글을 작성하게 된 계기
- ORM 사용에 익숙해지면 알더라도 정리하지 않고 넘어가는 부분이 많습니다.
- 실수하기 쉬운 부분들을 정리해두고 주기적으로 해당 게시글을 회독하면 좀 더 지혜롭게 코드를 작성할 수 있을 거라고 생각되어 작성했습니다.

### 레퍼런스
- ['2020 파이콘'에서 김성렬님의 강의](https://youtu.be/EZgLfDrUlrk)
- [김성렬님의 ORM 관련 블로그 글 1](https://medium.com/delivervtechkorea/django-quervset-1-14b0cc715eb7)
- [김성렬님의 ORM 관련 블로그 글 2](https://medium.com/delivervtechkorea/diango%EC%97%90%EC%84%9C%EB%8A%94-queryset%EC%9D%B
4-%EB%8B%B9%EC%8B%A0%EC%9D%84-%EB%A7%8C%EB%93%AD%EB%8B%88%EB%8B%A4-2-5f6f
8c6cd7e3)


### 쿼리셋 캐시를 재활용하지 못하는 경우
- 일반적으로 장고 ORM은 쿼리 명령어를 선언할 때 캐싱해두었다가, 파이썬 로직에서 실행할 때 DB에 호출하여 값을 받아오는 방식입니다.
- 파이썬의 명령어인 list() 혹은 tuple()과 같이 사용할 때 query가 실행되고, 그 전까지는 query를 실행하지 않습니다.
- 몇몇 경우에 캐싱을 제대로 활용하지 못하여 N+1 문제가 발생하게 되는데, 아래와 같은 에시입니다.
    ```python
    # Product 테이블에서 Company에 매칭되는 상품들을 모두 불러옵니다.
    # (쿼리 호출을 마쳐서 데이터를 가지고 있는 상태 - eger loading)

    company_list = list(Company.objects.prefetch_related("product_set").all())

    # 이와같이 사용하면 sql에 추가 쿼리를 한 번 더 호출하게 됩니다..
    company.product_set.filter(name="불닭볶음면")

    # 해결방법: 기존에 캐싱해서 가지고 있던 데이터를 활용해서 값을 가지고와야합니다.
    fire_noodle_product_list = [product for product in company.product_set.all() if product.name=="불닭볶음면"]
    ```

### Raw 쿼리셋과 장고 ORM 비교
- RawQuerySet을 사용하더라도, QuerySet의 제어권에 들어오게 됩니다. 이 때, SQL 쿼리에서 작성할 수 있는 구문들은 체이닝할 수 없습니다.
- RawQuerySet을 통해 쿼리를 호출할 때, 사용할 수 없는 메서드: `selected_related()`, `FilteredRelation()`, `annotate()`, `order_by()`, `extra()`, `[:10]`(limit 관련 옵션)
- prefetch_related는 추가 쿼리로 분류되기 때문에, chaining하여 사용할 수 있습니다.
    ```python
    from django.db.models.query import RawQuerySet
    from django.db.models import QuerySet

    order_queryset: RawQueryset = (
        Order.objecs
        .raw(raw_query="""
        SELECT
        * FROM "orm_practice_app_order"
        INNER JOIN "orm_practice_app_user" ON ("orm_practice_app_order"."order_owner_id"="orm_practice_app_user"."id")
        WHEN "orm_practice_app_user"."username" = %(username_param1)s
        """,
        params={"username_param1": "username4"})
        .prefetch_related('product_set_included_order')
    )

    order_queryset: QuerySet = (
        Order.objects
        .select_related('order_owner')
        .filter(order_owner__username="username4")
        .prefetch_related("product_set_included_order")
    )
    ```

### 서브쿼리가 발생하는 경우
- 위에서, 장고는 쿼리셋 관련 명령어를 사용하면, 사용 즉시 DB에 query를 호출하는 것이 아니라 기억해두었다가 파이썬 문법을 사용하면 쿼리를 호출한다고 했습니다.
- 따라서 파이썬 문법으로 아직 호출하지 않고 대기했다가 한 번에 호출하는 경우에 서브 쿼리가 발생할 수 있습니다.
    ```python
    # 첫 번째 줄에서 아직 쿼리를 DB로 호출하지 않은 상태입니다.
    company_queryset: QuerySet = Company.objects.filter(id__lte=20).values_list('id', flat=True)
    product_queryset: QuerySet = Product.objects.filter(
        product_owned_company_id__in=company_queryset
    )

    # 이 때, 먼저 쿼리셋을 수행시켜버린다면, Subquery로 동작하지 않고 두개의 쿼리가 나뉘어 동작합니다.
    company_queryset: List[Company] = Company.objects.filter(id__lte=20).values_list('id', flat=True)
    product_queryset: QuerySet = Product.objects.filter(
        product_owned_company_id__in=company_queryset
    )
    ```

### QuerySet 반환타입 종류 정리
```python
from typing import List, Dict, Any
from django.db.models.query import QuerySet

result: List[Model] = Model.objects.all().only().defer()
result: List[Dict[str, Any]] = Model.objects.values()
result: List[Tuple[str, Any]] = Model.objects.values_list()
result: List[Any] = Model.objects.values_list('pk', flat=True)
result: List[QuerySet] = Model.objects.values_list(named=True)
```

### values(), values_list() 사용시 주의점
- 두 메서드를 사용하게 되면 EagerLoading 옵션을 무시해버립니다.
- 따라서, 처음 쿼리에 대한 값을 불러올 당시 JOIN하지 않고, 챀조 테이블의 값을 사용하게 될 때 비로소 JOIN하게 됩니다.
- ORM은 파이썬의 객체와 데이터베이스의 Relation 간에 맵핑을 시키는 방식입니다.
- 하지만, 위 두 메서드는 Relation을 신경쓰지 않고, 목표 테이블의 데이터를 Raw 단위로 한 줄 한 줄 받아오게 됩니다.
- 따라서 Relation 관련 메서드인 `select_related()`와 `prefetch_related()`가 무시됩니다.