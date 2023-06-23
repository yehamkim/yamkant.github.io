---
layout: archive
title:  "[Django] Transaction은 어떻게 사용할까?"
date:   2023-04-25 20:05:07 +0900
categories: [Django Strategy]
---

## Database transactions
- Django의 기본 동작은 autocommit 모드를 실행시키는 것으로, transaction이 활성화되지 않으면, 각 쿼리는 즉시 db에 커밋됩니다.
- Django는 transaction 들이나 savepoint를 자동으로 사용하여 ORM 연산들(쿼리들의 update/delete)의 묶음을 보장합니다. 
- transaction은 기본적으로 사용비용이 드는 편이기 때문에, overhead를 최소화 하기 위해 가능한한 transaction을 짧게 유지하는 것이 좋습니다.

### HTTP 요청들에 transaction들 연결하기
- 연결을 위해 [ATOMIC_REQUESTS](https://docs.djangoproject.com/en/4.2/ref/settings/#std-setting-DATABASE-ATOMIC_REQUESTS)를 True로 설정하면, view function을 호출하기 전에 Django는 먼저 transaction을 실행시킵니다.
- 응답이 문제없이 잘 생성된다면, Django는 transaction을 commit 하고, exception 발생시 transaction을 roll back 합니다.
- [참고] 일반적으로 atomic() context manager를 사용하여 view code에서 savepoint들을 설정하면, subtransaction들을 수행할 수 있습니다.
  > 제대로 코드가 구성되어있지 않다면, 추천하지 않는 방법입니다. locking을 handle하는 방법을 확실하게 익힌 후에 사용해야합니다.

### transaction 제어하기
- transaction 처리 순서는 다음과 같습니다.  
  1. outermost atomic block에 들어올 때 transaction을 열어둡니다.
  2. inner atomic block에 들어올 때 savepoint를 생성합니다.
  3. inner block을 탈출할 때 savepoint를 해제하거나 rollback 합니다.
  4. outermost atomic block을 탈출할 때 transaction을 commit하거나 rollback 합니다.
- `atomic(using=None, savepoint=True, durable=False)`: atomic은 db의 원자성을 보장하며, 한 block의 code를 구성하여 성공하면 commit을, 실패하면 rollback을 처리합니다.
- atomic block들은 중첩될 수 있고, inner block이 성공적으로 처리되었더라도 outer block이 rollback되면 함께 rollback 됩니다.
- atomic block이 가장 바깥쪽에 있는지 확인하는 것은 매우 유용합니다. atomic block이 다른 atomic block에 중첩되어있다면 RuntimeError를 발생시킵니다.
- 아래 예시의 경우, @transaction.atomic Decorator를 사용하였기 때문에 `create_paraent()`, `generate_relationships()`, `add_children()` 모두 한 transaction에서 이루어지며 `generate_relationships()` error 발생시 handle_exception을 실행시키고 rollback 됩니다.

### 발생할 수 있는 Exceptions
참고: https://docs.djangoproject.com/en/4.1/_modules/django/db/utils/
- `DatabaseError`: 
- `IntegrityError`:
- `TransactionManagerError`: