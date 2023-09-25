---
layout: archive
title:  "[Study] Database - TRIGGER, Transaction"
date:   2023-09-11 00:05:07 +0900
categories: 
    - Study
---

## SQL Trigger
- 데이터에 변경(INSERT, UPDATE, DELETE)이 생겼을 때 자동적으로 실행되는 프로시저를 의미합니다.
- INSERT, UPDATE, DELETE를 한 번에 감지하도록 설정 또한 가능합니다. (MySQL은 불가능)
- 애플리케이션이 알 수 없는 데이터베이스 서버의 로직이기 때문에, 문제사항 발생 시 대응하기 어렵다는 단점이 있습니다.
- 트리거를 지나치게 많이 발생시키면, 연쇄적인 트리거 발생이 생길 수 있고 이는 DB에 부담을 주어 응답을 느리게 할 수 있습니다.

#### 사용자 닉네임 변경 이력 기록
- 사용자의 닉네임 변경 이력을 저장하는 트리거를 작성한다면, 
```sql
delimiter $$
CREATE TRIGGER log_user_nickname_trigger
BEFORE UPDATE
ON users FOR EACH ROW
BEGIN
  INSERT INTO user_log values(OLD.id, OLD.nickname, NOW());
END
$$
delimiter ;
```
- 닉네임이 UPDATE 될 때마다 그 전에 트리거를 동작시킵니다.
- users 테이블에 대해 업데이트가 발생하면, 트리거가 동작하여 각 ROW에 대해 액션을 실행합니다.
- 닉네임이 업데이트될 때마다 기존의 닉네임을 users_log 테이블에 저장하게 됩니다.  
  (`OLD` 업데이트되기 전의 users의 tuple을 가리킴.)

#### 사용자 누적 구매 비용 저장 통계 기록
```sql
delimiter $$
CREATE TRIGGER sum_buy_prices_trigger
AFTER INSERT
ON buy FOR EACH ROW
BEGIN
  DECLARE total INT;
  DECLARE user_id INT DEFAULT NEW.user_id;

  select sum(price) into total from buy where user_id = user_id;
  update user_buy_stats set price_sum = total where user_id = user_id;
END
$$
delimiter ;
```
- INSERT 이벤트가 발생한 후에 액션을 수행합니다.
- total이라는 INT 변수를 선언하고, user_id라는 INT 변수를 선언합니다. 이 때, 초기 값으로 user_id에 insert된 tuple의 user_id를 넣어줍니다.
  
#### 임직원 평균 연봉 구하기 (PostgreSQL)
```sql
CREATE TRIGGER avg_empl_salary_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON employee
  FOR EACH STATEMENT
  EXCUTE FUNCTION update_avg_empl_salary();
```
- [MySQL X] 하나 이상의 이벤트가 발생하는 조건에 대해서 트리거를 진행할 수 있습니다.
- [MySQL X] `FOR EACH ROW`와 `FOR EACH STATEMENT`의 차이점에 대해서 학습해 보기.

## Transaction
- 데이터베이스의 상태를 변화시키기 위해 `수행하는 작업의 단위`입니다.
- commit: 하나의 트랜잭션이 성공적으로 끝났고, DB가 일관성있는 상태라면 변경된 상태를 영구적으로 반영하는 것입니다.
- rollback: 테이블 내에 입력/수정/삭제한 데이터에 대해 commit 이전 변경 사항을 취소합니다. 이 때, 관련된 행에 대한 잠금(locking)이 해제되고, 다른 사용자들이 데이터 변경을 가능하도록 합니다.
- savepoint: rollback 시, 트랜잭션에 포함된 전체 작업을 rollback하지 않고, 현시점에서 savepoint까지의 트랜잭션의 일부만 rollback 가능합니다.

### 특징 (ACID)
- Atomic(원자성): 트랜잭션이 DB에 모두 반영되거나, 전혀 반영되지 않아야 합니다.
- Consistency(일관성): 트랜잭션의 작업 처리 결과는 항상 일관성이 있어야 합니다.
- Isolation(독립성): 둘 이상의 트랜잭션이 동시에 병행 실행되고 있을 때, 서로 다른 트랜잭션 연산은 독립적이어야 합니다.
- Durability(지속성): 트랜잭션이 성공적으로 완료된다면, 결과는 영구적으로 반영되어야 합니다. (power faile이나 DB crash가 발생하더라도. 이는 DBMS가 보장합니다.)
#### 추가
- 일관성은 기본 키, 외래 키 제약과 같은 명시적인 무결성 제약 조건들 뿐만 아니라, 이체 예시에서 두 계좌 잔고의 합은 이체 전후가 같아야 한다는 사항과 같은 비명시적인 일관성 조건들도 있습니다.
- Isolation을 엄격하게 구현한다면, DB 서버의 성능에 영향을 주는 요소이기 때문에 여러 종류의 isolationlevel을 제공합니다.

### Autocommit
- 각각의 SQL문을 자동으로 transaction 처리하는 개념으로, SQL문이 성공적으로 실행하면 자동으로 commit 합니다. 실패 시, 자동으로 rollback 합니다.
- MySQL의 경우, autocommit이 기본적으로 활성화되어 있으며, transaction 시작 시 autocommit 기능을 off합니다.
- autocommit을 off하게 되면, commit을 할 때까지 영구적인 반영이 되는 것은 아니기 때문에, rollback 시 원래 상태로 돌이킬 수 있습니다.

### 일반적인 사용 패턴
1. transaction을 시작(begin) 합니다. (autocommit을 off 상태로 변경)
2. 데이터를 읽거나 쓰는 등의 SQL 문들을 포함하여 로직을 수행합니다.
3. 일련의 과정들이 문제없이 동작했다면 transaction을 commit 합니다.
4. 문제가 발생했다면, transaction을 rollback 합니다. 
5. commit 및 rollback 후에 autocommit을 on 상태로 변경합니다.



## Concurrency Control
- Schedule: 여러 트랜잭션들이 동시에 실행될 때 각 트랜잭션에 속한 operation들의 실행 순서를 의미합니다. 이 때, 각각의 트랜잭션 내의 operation들의 순서는 바뀌지 않습니다.
- 고민거리: 성능 때문에 여러 transaction들을 겹쳐서 실행(nonserial schedule)하면 좋겠지만, 의도치 않은 결과가 발생하는 상황이 생깁니다.
- 해결방법: conflict serializable한 경우에 대해서는 nonserial schedule를 허용합니다.
- 즉, 어떤 스케쥴이라도 serializable하도록 동작하게 만드는 제어기법을 의미합니다.

## Serializability

#### Serial schedule
- 트랜잭션들이 겹치지 않고 한 번에 하나씩 실행되는 스케쥴을 의미합니다.
- 저장공간에 대해 I/O 작업을 수행하는 동안에 CPU는 쉬고 있지만 serial은 다른 동작을 수행시키지 않으므로 동시성이 없고 좋은 성능을 내지 못합니다.

#### Nonserial schedule
- 트랜잭션들이 겹쳐서 실행되는 스케쥴을 의미합니다.
- I/O 작업 중 다른 트랜잭션을 수행하기 때문에 동시성이 높아져 같은 시간동안 더 많은 트랜잭션을 처리할 수 있습니다.
- 단점: 트랜잭션들이 어떤 형태로 겹쳐서 실행되는지에 따라 결과값이 변경될 우려가 있습니다.

#### Conflict
- Conflict란, 아래의 세 조건을 만족하는 경우입니다.
  1. 두 오퍼레이션이 서로 다른 트랜잭션 소속인 경우
  2. 두 오퍼레이션이 같은 데이터에 접근하는 경우
  3. 두 오퍼레이션 중 최소한 하나는 쓰기 오퍼레이션인 경우
- 두 오퍼레이션 중 하나의 오퍼레이션은 읽는 경우, 다른 하나의 오퍼레이션은 쓰는 경우 발생하는 컨플릭트를 read-write conflict라고 합니다.
- 두 오퍼레이션 모두 쓰는 오퍼레이션이라면 write-write conflict라고 합니다.
- conflict operation은 순서가 바뀌게 될 때 결과도 바뀝니다.
- Conflict equivalent란, 아래의 두 조건을 모두 만족하는 경우입니다.
  1. 두 스케쥴이 같은 트랜잭션들을 가지는 경우
  2. 트랜잭션들의 모든 conflicting operation들의 순서가 양쪽 스케쥴 모두 동일한 경우  
     (conflicting operation: read-write/write-wr ite conflict)
- Serial schedule과 conflict equivalent일 때 Conflict serializable이라고 할 수 있습니다.

### Conflict serializable 확인방법 구현
- 여러개의 트랜잭션을 동시에 실행하더라도 스케쥴이 conflict serializable 하다는 것이 보장되는 스케줄만 실행되도록 하는 프로토콜을 적용합니다.

## Unrecoverability
- 스케쥴 내에서 커밋된 트랜잭션(1번)이 "rollback된 트랜잭션(2번)이 수정했던 데이터"를 읽은 경우를 의미합니다. 즉, 1번 트랜잭션은 유효하지 않은 2번 트랜잭션의 데이터에 작업을 하게된 경우입니다. -> unrecoverable schedule
- 위의 상황에서, rollback을 하더라도 이전 상태로 회복 불가능하기 때문에, 이런 스케줄은 DBMS에서 허용하면 안됩니다.

#### Recoverable한 스케쥴
- 스케쥴 내에서 그 어떤 트랜잭션도 자신이 읽은 데이터를 수정한 트랜잭션이 먼저 커밋/롤백 되기 전까지 커밋하지 않는 경우에 recoverable한 스케쥴이라 할 수 있습니다.
- 트랜잭션 간에 의존성이 있는 경우, 의존하는 트랜잭션은 






















## Isolation Level (격리수준)
**Read Uncommitted (Level 0)**
- SELECT 문이 수행되는 동안 해당 데이터에 Shared Lock이 걸리지 않는 계층입니다.
- 트랜잭션이 처리중이거나, 아직 commit되지 않은 데이터를 다른 트랜잭션이 읽는 것조차 허용합니다.
- 데이터베이스의 일관성을 유지하는 것이 불가능합니다.

**Read Committed (Level 1)**
- 대부분의 SQL 서버가 기본적으로 사용하는 격리수준입니다.
- 커밋된 데이터만 조회할 수 있습니다. Phantom Read, Non-Retable Read 문제가 발생할 수 있습니다.
- 트랜잭션이 수행되는 동안 다른 트랜잭션이 접근할 수 없어서 대기하게 됩니다.

**Repeatable Read (Level 2)**
- MySQL에서 기본으로 사용하는 격리수준입니다.
- 일반적인 RDBMS는 변경 전의 레코드를 언두 공간에 백업해둡니다. 
  (MVCC. 동일한 레코드에 대해 여러 버전의 데이터가 존재)
- 트랜잭션이 롤백된 경우에 데이터를 복원할 수 있을 뿐 아니라, 
- 트랜잭션이 완료될 때까지 SELECT 문장이 사용하는 모든 데이터에 Shared Loack이 걸리는 단계입니다.
- 트랜잭션이 범위 내에서 조회한 데이터 내용이 항상 동일함을 보장합니다.
- 다른 사용자는 트랜잭션 영역에 해당되는 데이터에 대한 수정이 불가능합니다.

**Serializable (Level 3)**
- 여러 트랜잭션이 동일한 레코드에 동시에 접근(읽기/쓰기/수정 모두)할 수 없습니다. 하지만, 트랜잭션이 순차적으로 처리되어야 하기 때문에 동시처리 성능이 매우 떨어집니다.
- 순수한 SELECT 작업에 대해서도 대상 레코드에 넥스트 키 락을 읽기잠금(공유락, Shared Lock)으로 겁니다.
- 완벽한 읽기 일관성 모드를 제공합니다.

### 격리수준이 낮을 때 발생할 수 있는 문제

**Dirty Read**
- 발생 격리 수준: Read Uncommitted
- 어떤 트랜잭션에서 아직 실행이 끝나지 않았을 때, `다른 트랜잭션에 의한 변경 사항`을 트랜잭션 수행 중 조회하게 되는 경우입니다.
- 커밋되지 않은 수정중인 데이터를 다른 트랜잭션에서 읽을 수 있도록 허용할 때 발생합니다.

**Non-Repeatable Read**
- 발생 격리 수준: Read Committed, Read Uncommitted
- 한 트랜잭션에서 같은 쿼리를 두 번 수행할 때, 그 사이에 다른 트랜잭션 값을 수정/삭제 하면서 두 쿼리의 결과가 다르게 나타나며 일관성이 깨지는 현상입니다.

**Phantom Read**
- 발생 격리 수준: Repeatable Read, Read Committed, Read Uncommitted
- 트랜잭션 도중에 새로운 레코드 삽입을 허용하기 때문에 나타나는 현상입니다.
- 한 트랜잭션 안에서 일정 범위의 레코드를 두 번 이상 읽을 때, 첫 번째 쿼리에서 없던 레코드가 두 번째 쿼리에서 나타나는 현상입니다.

### DBMS의 구조
- 크게 `Query Processor`와 `Storage System`이 있습니다.
- 입출력은 고정 길이의 page 단위로 disk에 읽거나 씁니다.
- 저장 공간은 비휘발성 저장 장치인 disk에 저장하며, 일부를 Main Memory에 저장합니다.

### Page Buffer Manager(or Buffer Manager)
- DBMS의 Storage System에 속하는 모듈 중 하나로, Main Memory에 유지하는 페이지를 관리합니다.
- Buffer 관리 정책에 따라서, UNDO 복구와 REDO 복구가 요구되거나 그렇지 않게 되므로, transaction 관리에 매우 중요한 결정을 합니다.

### UNDO
- 트랜잭션은 시작 됐지만 아직 완료되지 않은 commit되지 않은 부분에 대해 연산을 취소합니다.
- 수정된 Page들이 **Buffer 교체 알고리즘에 따라 디스크에 출력**될 수 있습니다.
- Buffer 관리 정책에 영향을 받습니다.

### REDO
- 이미 commit된 transaction의 수정을 재반영하는 복구 작업입니다.
- Buffer 관리 정책에 영향을 받습니다.






### 참고자료
- [쉬운코드님 trigger 강의](https://youtu.be/mEeGf4ZWQKI?si=cTzyiw9E9bCI4DFS)