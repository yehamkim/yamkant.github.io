---
layout: archive
title:  "[Django] Transaction은 어떻게 사용할까?"
date:   2023-11-15 20:05:07 +0900
categories: [Strategy]
---

## Database transactions
- Django의 기본 동작은 autocommit 모드를 실행시키는 것으로, transaction이 활성화되지 않으면, 각 쿼리는 즉시 db에 커밋됩니다.
- Django는 transaction 들이나 savepoint를 자동으로 사용하여 ORM 연산들(쿼리들의 update/delete)의 묶음을 보장합니다. 
- transaction은 기본적으로 사용비용이 드는 편이기 때문에, overhead를 최소화하기 위해 가능한 한 transaction을 짧게 유지하는 것이 좋습니다.

### HTTP 요청들에 transaction들 연결하기
- 연결을 위해 [ATOMIC_REQUESTS](https://docs.djangoproject.com/en/4.2/ref/settings/#std-setting-DATABASE-ATOMIC_REQUESTS)를 True로 설정하면, view function을 호출하기 전에 Django는 먼저 transaction을 실행시킵니다.
- 응답이 문제없이 잘 생성된다면, Django는 transaction을 commit 하고, exception 발생 시 transaction을 roll back 합니다.
- [참고] 일반적으로 atomic() context manager를 사용하여 view code에서 savepoint들을 설정하면, subtransaction들을 수행할 수 있습니다.
  > 제대로 코드가 구성되어있지 않다면, 추천하지 않는 방법입니다. locking을 handle 하는 방법을 확실하게 익힌 후에 사용해야 합니다.

### transaction 제어하기

- `atomic(using=None, savepoint=True, durable=False)`: atomic은 db의 원자성을 보장하며, 한 block의 code를 구성하여 성공하면 commit을, 실패하면 rollback을 처리합니다.
만약에 모든 view가 아닌 일부 view에만 적용하고 싶다면
- Django에서는 DB 설정에서 요청 단위로 transaction을 설정할 수 있습니다. (`ATOMIC_REQUEST: True`)
- 특정 요청에 대해서만 트랜잭션을 적용하고 싶다면, `ATOMIC_REQUEST`를 False로 설정 후, view에 `@transaction.atomic()` 데코레이터를 추가합니다. 
- 반대로 일부 요청에 대해서만 적용하지 않으려면, `ATOMIC_REQUEST`를 True로 하고, view에 `@transaction.non_atomic_requests()` 데코레이터를 추가합니다.
- 요청을 처리하기까지의 사이클이 길면 그만큼 DB에 부하가 발생하게 되며, 중간에 Redis와 같은 다른 서비스에서 오류도 발생할 수 있기 때문에 이러한 오버헤드에 주의하여 사용해야합니다.
- au

#### transaction 처리 순서
1. outermost atomic block에 들어올 때 transaction을 열어둡니다.
2. inner atomic block에 들어올 때 savepoint를 생성합니다.
3. inner block을 탈출할 때 savepoint를 해제하거나 rollback 합니다.
4. outermost atomic block을 탈출할 때 transaction을 commit 하거나 rollback 합니다.

### Django에서 DB Connection을 맺는 순서
1. request handler가 시작될 때, DB와 새로운 connection을 맺으며 isolation level을 설정합니다.
2. `ATOMIC_REQUESTS=True` 인지 확인합니다. True라면 autocommit을 해제합니다.
3. `transaction.atomic()` 블록을 찾아서 내부 동작을 수행합니다.
4. View의 블록 내부에서 동작에 이상이 없으면(이상이 있더라도 Error Handling을 하여 Exception 처리를 했다면) DB에 반영됩니다.

#### 사용시 주의할 점
- atomic block들은 중첩될 수 있고, inner block의 트랜잭션이 성공적으로 처리되었더라도 outer block에서 트랜잭션이 rollback되면 함께 rollback 됩니다.
    ```python
    # setting.py
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('MYSQL_DJANGO_DB_NAME', 'djangosample'),
            'USER': os.environ.get('DJANGO_DB_USERNAME', 'root'),
            'PASSWORD': os.environ.get('DJANGO_DB_PASSWORD', 'example'),
            'HOST': os.environ.get('MYSQL_DJANGO_DB_HOST', 'localhost'),
            'PORT': os.environ.get('DJANGO_DB_PORT', '3306'),
            'ATOMIC_REQUESTS': True
        },
    }
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            serializer.save()
        raise Exception('데이터는 저장되었지만, Controller 에러')
        return Response('success', status=HTTP_201_CREATED)
    ```
  - `view` 또한 하나의 트랜잭션 단위로 보기 때문에 `serializer.save()`는 커밋되지 않게됩니다.

- Django와 DB Connection을 맺는 순서에서, 에러가 발생하는 경우입니다. Exception 처리를 어디서 하냐에 따라서 문제가 발생하여도 DB에 반영될 수 있기 때문에, 다음과 같이 작성해야합니다.
    ```python
    # 권장되지 않는 방식
    with transaction.atomic():
      try:
          SharesTransfer.objects.create(amount=1, account_from_id=1, account_to_id=2, company_id=1)
          raise Exception('savepoint를 이용해서 일부분은 반영')
      except Exception as e:
          print(e)

    # 권장되는 방식
    try:
        with transaction.atomic():
            # dummy query for example
            SharesTransfer.objects.create(amount=1, account_from_id=1, account_to_id=2, company_id=1)
            raise Exception('savepoint를 이용해서 일부분은 반영')
    except Exception as e:
        print(e)
    ```
    - 위와 같이 작성하면, TransactionManagementError가 발생하게 되어 outer block에 오류 발생 부분을 전달할 수 있습니다.

- atomic block이 가장 바깥쪽에 있는지 확인해야합니다. atomic block이 다른 atomic block에 중첩되어있다면 RuntimeError를 발생시킵니다.


- 아래 예시의 경우, @transaction.atomic Decorator를 사용하였기 때문에 `create_paraent()`, `generate_relationships()`, `add_children()` 모두 한 transaction에서 이루어지며 `generate_relationships()` error 발생 시 handle_exception을 실행시키고 rollback 됩니다.

### 발생할 수 있는 Exceptions
참고: https://docs.djangoproject.com/en/4.1/_modules/django/db/utils/
- `DatabaseError`: 
- `IntegrityError`:
- `TransactionManagerError`:

### 참고
- [doosikbae님 블로그](https://blog.doosikbae.com/entry/Django-Transaction%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98-1%ED%8E%B8-Request%EC%99%80-DB-Transaction-%EB%AC%B6%EA%B8%B0Feat-ATOMICREQUESTS)
- [hyun-am님 블로그](https://hyun-am-coding.tistory.com/entry/django-transaction%EC%9E%A5%EA%B3%A0-%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98)
