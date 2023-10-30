---
layout: archive
title:  "[Study] Database - 동시성 관련 문제"
date:   2023-10-30 00:05:07 +0900
categories: 
    - Study
---

## 트랜잭션 Isolation Level
- `Dirty Read`, `Non-repeatable Read`, `Phantom Read`를 발생하지 않게 만든다면, 제약사항이 많아집니다.
- 제약사항이 많아지면 동시처리(concurrency) 가능한 트랜잭션의 수가 줄어들게 되어, 결국 DB의 전체 처리량(throughput)이 하락하게 되는 단점이 있습니다.
- 개발자는 격리수준을 설정하여 쓰루풋과 데이터 일관성 사이의 트레이드 오프를 관리할 수 있습니다.
- SQL 표준에서 정의하는 격리수준(Isolation Level)의 허용범위는 아래와 같습니다. 

    |Isolation Level|Dirty read|Non-repeatable read|Phantom read|
    |:---|:---:|:---:|:---:|
    |Read uncommitted|O|O|O|
    |Read committed|X|O|O|
    |Repeatable read|X|X|O|
    |Serializable|X|X|X|

#### Dirty Read
- 다른 트랜잭션에서 아직 커밋되지 않은 값을 읽는 경우입니다.
- 예시는 다음과 같습니다.  

    ```
    # given
    - 2번 트랜잭션은 y = y + 20을 수행하고 1번 트랜잭션은 x = x + y를 수행합니다.
    # when
    - 2번 트랜잭션에서 값을 수정하고, 1번 트랜잭션이 그 값을 이용해 값을 수정하고 커밋합니다.
    - 그후, 2번 트랜잭션에서 오류가 발생하여 롤백하게 됩니다.
    # then
    - 1번 트랜잭션은 결과적으로 비정상적인 수정이 되어버린 경우입니다.
    ```

#### Non-repeatable Read (Fuzzy Read)
- 하나의 트랜잭션이 같은 데이터의 값이 조회할 때마다 값이 달라지는 경우입니다.
- 예시는 다음과 같습니다.  

    ```
    # given
    - 1번 트랜잭션은 x를 두번 읽습니다. 2번 트랜잭션은 x에 40을 더합니다.
    # when
    - 1번 트랜잭션에서 x를 한 번 읽습니다.
    - 2번 트랜잭션이 x에 40을 더하고 커밋하여 값을 수정합니다.
    # then
    - 1번 트랜잭션에서 다시 x를 읽으면 첫번째 읽은 값과 다른 값이 조회됩니다.
    ```

#### Phantom Read
- 없던 데이터가 생기게 되는 현상입니다.
- 예시는 다음과 같습니다.  

    ```
    # given
    - 1번 트랜잭션은 WHERE v=10인 데이터를 두 번 읽습니다.
    - 2번 트랜잭션은 WHERE v=30인 데이터를 v=10으로 수정합니다.
    # when
    - 1번 트랜잭션에서 조건문을 사용하여 데이터를 읽으면 조회되는 튜플은 하나입니다.
    - 2번 트랜잭션에서 v=30을 v=10으로 수정하고 커밋하면 1번에서 불러올 수 있는 조건이 됩니다.
    # then
    - 1번에서 같은 조건으로 다시 조회하게 되면 v=10에 대한 튜플이 2개가 됩니다.
    ```

### 실무에서는 어떻게 사용하는가?
- MySQL: 표준에서 정의하는 위의 네개의 격리 수준을 모두 사용합니다.
- SQL server: 표준에서 정의하는 네개의 격리 수준을 모두 사용합니다.
- Oracle: `READ UNCOMMITTED`는 사용하지 않습니다. `REPEATABLE READ` 대신 `SERIALIZABLE`로 설정해야합니다.  
  결과적으로, `READ COMMITTED`와 `SERIALIZABLE` 두 개의 격리 수준만 사용합니다.
- Postgre SQL: 표준에서 정의하는 네개의 격리 수준 + `Serialization Anomaly` 관련 설정을 사용합니다.  
  Repeatable read는 snapshot isolation level에 해당합니다.


## 동시성(Concurrency)이란?
- 하나의 CPU 코어에서 시간분할을 통하여 여러 일을 처리하는 것처럼 보여지게 하는 기법을 의미합니다.
- DB에서는 자원에 접근하기 위해 동시성을 허용하여 트랜잭션이 순서에 상관없이 동시에 실행되는 것을 허용합니다.
- 이를 제대로 파악하지 못하고 설정하면, 데이터를 수정하여 저장했지만 조회했을 때 다른 값이 반환되는 등의 무결성이 깨지는 문제가 발생하게 됩니다.

### Read uncommitted
- 하나의 트랜잭션의 변경 이후 커밋, 롤백과 상관없이 다른 트랜잭션에 영향을 미칩니다.
- 1번 트랜잭션이 업데이트를 하고 commit을 하지 않은 상태에서 2번 트랜잭션이 업데이트하고 조회하는 경우입니다.
- 이 경우, `Dirty Read` 문제가 발생할 수 있습니다. 
- 만약 다른 트랜잭션이 롤백된다면 다시 읽었을 떄 값이 달라집니다.
- 대부분 RDBMS에서는 사용하지 않는 격리 수준입니다.

### Read committed
- 하나의 트랜잭션의 변경이 커밋된 후에만 다른 트랜잭션에 변경사항이 반영됩니다.
- 1번 트랜잭션이 값을 `Update` 후 1번 트랜잭션의 "커밋 이전"에 2번 트랜잭션이 조회한다면 변경 전 값을 읽습니다.
- 하지만, 1번 트랜잭션이 삽입, 수정 후 "커밋 이후"에 2번 트랜잭션이 값을 조회한다면 변경 후 값을 조회합니다.
- 이 경우, `Non-Repeatable Read` 문제가 발생할 수 있습니다.
- Oracle을 포함한 많은 DBMS가 선택하는 격리 수준입니다.

### Repeatable Read
- 트랜잭션이 시작되고 종료되기 전까지 한 번 조회한 값은 계속해서 같은 값으로 조회됩니다.
- 이 때, `Update`에 대해서는 데이터의 정합성이 보장되지만, `Insert`에 대해서는 보장되지 않습니다.
- 이 경우, `Phantom Read` 문제가 발생합니다.

### Serializable
- 가장 엄격한 격리 수준입니다.
- 한 트랜잭션이 테이블을 읽으면 다른 트랜잭션은 그 테이블에 대해 추가, 변경, 삭제가 제한됩니다.
- 정합성 문제는 발생하지 않겠지만, 동시 처리 성능이 떨어집니다.

## 비관적인 방법
- 현재 수정하려는 데이터가 언제든 다른 요청에 의해 수정될 가능성을 고려하여 데이터에 Lock을 거는 방식입니다.
- 장점: 데이터의 무결성을 완벽히 지킬 수 있습니다.  
  (수정할 데이터에 row level lock을 걸어, 다른 요청에서 수정할 수 없습니다.)
- 단점: lock으로 인하여 다른 요청들은 대기상태가 됩니다.  
  (기존 Lock의 트랜잭션이 커밋 또는 롤백으로 끝나면 대기하던 요청을 실행합니다.)

### 방법 1: 트랜잭션 격리수준 수정

```sql
SHOW TRANSACTION ISOLATION LEVEL;
# read committed
```

- 기본으로 설정되어있던 격리수준을 높여서 동시성을 해결할 수 있습니다.
- 하지만, 모든 트랜잭션의 격리수준이 올라가게 되며 성능은 하락합니다.
    

- postgres의 경우, 기본 격리수준은 `read committed`이지만, `repeatable read`나 seralizable`로 향상시킵니다. 

### 방법 2: select for update
```sql
# transaction 1
select * from aircraft where id= 20231030 for update

# transaction 2
# 이건 가능
select * from aircraft where id = 20231030

# transaction 2
# 이건 불가능
update aircraft set remaining_seat = remaining_seat - 1 where id = 20231030
``` 

- row lock을 제어하는 방식입니다.
- DBMS 전체나 테이블에 lock을 거는 것보다, 좁은 범위에 lock을 사용하여 성능 하향을 최소화합니다.


- 특정 row에 lock을 걸어, 조회는 가능하게 하되, 업데이트는 불가능하도록 막습니다.

### 방법 3: redis

```python
# django-redis 사용

from django.core.cache import cache
aircraft_reserve_key = f'aircraft_reserve_key:{user_id}:{aircraft_id}'
if cache.set('aircraft_reserve_key', '1', nx=True):
    aircraft = Aircraft.objects.get(id=aircraft_id)
    aircraft.remaining_seat -= 1
    aircraft.save()
```
- redis를 사용하여 application 레벨에서 락을 잡는 방법입니다.
- redis는 setnx(set not exist)를 사용하며, "락이 존재하지 않는다면" "락을 획득한다"는 두 연산을 atomic하게 락을 획득하도록 해줍니다.

### 참고: Django에서 지원하는 select for update
```python
with transaction.atomic():
    aircraft = Aircraft.objects.get(id=id).select_for_update()
    aircraft.remaining_seat -= 1
    aircraft.save()
```
- 항공기를 예약하는 예시로, 예약 시트의 변경이 있는 동안 특정 id의 레코드에 대해 락을 걸어둡니다.

#### of
- 기본적으로 장고 ORM은 모든 쿼리에 락을 걸어버립니다. 따라서, 특정 모델 클래스를 대상으로 락을 설정할지 지정할 수 있습니다.
- `select_related`와 함께 사용하는 경우 join 테이블의 행도 함께 락을 걸기 때문에 명확히 명시할 수 있습니다.

#### skip_locked
- True로 설정하면 락이 걸린 레코드를 무시하고 락이 걸리지 않은 레코드를 찾습니다.

#### nowait
- 기본 값은 False이며, row 락이 걸려있다면 트랜잭션이 끝날때까지 대기했다가 끝나면 작업을 진행합니다. 
- True일 때 락이 걸린 트랜잭션이 끝날 때까지 기다리지 않고 바로 `DatabaseError`를 발생시킵니다.

#### 주의사항
1. `transaction.atomic()` 블럭 내에서 `select_for_update()`를 사용해아합니다. 
   (블럭 내에 있는 동안 블럭 내에서 조회한 쿼리에 락이 걸립니다. 다른 트랜잭션은 이를 획득/수정할 수 없습니다.)
2. `skip_locked` 옵션과 `nowait` 옵션은 상호배타적인 관계로, 두 옵션을 모두 사용하게 되면 `ValueError`가 발생합니다.
3. `select_for_update()`는 null을 참조하는 경우에는 사용할 수 없습니다.  
   `Person.objects.select_related('hometown').select_for_update().exclude(hometown=None)`
4. eager loading을 사용하여 참조해야합니다.

## 낙관적인 방법
```python
def reserve(self):
    updated = Aircraft.objects.filter(
        id=self.id,
        version=self.version,
    ).update(
        remaining_seat=remaining_seat-1,
        version=self.version+1,
    )
    return updated > 0
```
- version 컬럼이나 updated_at 컬럼을 함께 조회 조건으로 사용하는 방식입니다.
- 데이터를 수정할 때마다 version을 1 증가시키거나, updated_at을 현재시간으로 갱신합니다.
- 동시에 `reverse` 메서드가 호출되어 동일한 버전으로 수정하려고 시도한다면 하나의 transaction은 버전 충돌이나서 실패하게 됩니다.