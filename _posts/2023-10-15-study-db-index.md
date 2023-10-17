---
layout: archive
title:  "[Study] Database - 쿼리 최적화를 위한 인덱스"
date:   2023-10-17 00:05:07 +0900
categories: 
    - Study
---

### 인덱스란 무엇인가?
- 인덱스를 사용하는 이유: 조건(`WHERE`)을 만족하는 튜플들을 빠르게 조회하기 위해 사용합니다.
- 빠르게 `ORDER BY`하거나 `GROUP BY`하기 위해 사용합니다.

## 인덱스 사용방법

### 인덱스 관련 명령어 예시
```sql
-- name column을 기준으로 인덱스를 생성합니다.
CREATE INDEX player_name_idx ON player (name);

-- team_id와 backnumber에 대해 복합 인덱스를 생성합니다.
CREATE UNIQUE INDEX item_id_backnumber_idx ON player (team_id, backnumber);

-- 테이블 생성시 인덱스 설정을 포함합니다.
CREATE TABLE player (
  id  INT PRIMARY KEY,
  name  VARCHAR(20) NOT NULL,
  team_id INT,
  backnumber INT,
  INDEX player_name_idx (name),
  UNIQUE INDEX team_id_backnumber_idx (team_id, backnumber)
);

-- 해당 테이블에 대한 인덱스 정보를 알고 싶은 경우에 사용합니다.
SHOW INDEX FROM player;
```

### 인덱스의 동작 방식
- 기존 방식대로라면 원본테이블에서 원하는 조건들을 만족하는 경우에 대해 풀스캔 해야하지만, 인덱스를 사용하면 다음과 같이 동작합니다.
- 인덱스 테이블은 인덱스 생성시 설정한 `INDEX(a)` 값에 해당하는 포인터가 원본 테이블의 a 컬럼의 값의 튜플을 가리키는 방식입니다.
- a에 대한 조건이 입력될 때 인덱스 테이블에서 이에 해당하는 값을 Binary Search 형태로 검색하고, 해당 조건에 대한 인덱스 검색이 완료되면 포인터가 가리키는 원본 테이블의 튜플을 찾게 됩니다.
- `WHERE a=7`이라는 조건으로 검색된다면, 인덱스 테이블에서 `a=7`인 값을 Binary Search로 검색하고, 해당 포인터가 가리키는 원본 테이블의 값을 불러오는 방식입니다.

### 복합 인덱스를 사용하는 이유
- `WHERE a=7 AND b=95`와 같은 조건으로 검색되고 인덱스 테이블에 `a=7`을 만족하는 값이 많다면, 모든 `a=7`에 대한 포인터를 통해 원본 테이블에 찾아가서 `b=95`라는 값을 일일이 확인해야합니다.
- 인덱스 테이블에서 해당 조건을 재빠르게 먼저 찾아서 원본테이블을 참조하는 횟수를 줄이기 위해 복합인덱스를 구성할 수 있습니다. `CREATE INDEX(a,b)`: a 컬럼이 먼저 정렬되고, 이후 b 컬럼이 정렬됩니다.
- 따라서, `WHERE a=7 AND b=95` 조건에 대해 인덱스 테이블의 튜플을 검색하고 원본 테이블에 참조하게 됩니다.
- 하지만, 복합 인덱스만 위와 같이 설정하고 `WHERE b=95`에 대해서만 검색한다면, 결국 복합인덱스를 사용하지 않고, 원본 테이블을 풀스캔하기 때문에 조건절에 따라 인덱스를 생성하는 것이 매우 중요합니다.

### Covering index
- 인덱스 테이블에서 조회하는 조건에 대한 모든 값을 가지고 있는 경우로, 조회 속도가 빠르다는 장점이 있기 때문에 의도적으로 사용하곤 합니다.
- 예를 들어, `CREATE UNIQUE INDEX item_id_backnumber_idx ON player (team_id, backnumber)`로 설정을 하고, `SELECT * team_id, backnumber FROM players WHERE team_id = 5`와 같이 검색하는 경우입니다.

### Hash index
- hash table을 사용하여 인덱스를 구현하는 방식으로, 시간복잡도가 O(1)로 매우 빠릅니다.
- 해시 테이블이 매우 커지면서 발생하는 rehashing 문제에 대한 부담이 있고, 값의 equality 비교만 가능하여 range 비교는 불가능하다는 단점이 있습니다.
- 복합 인덱스 설정시 `INDEX (a,b)`로 설정할 경우 (a,b)를 동시 조건으로 처리하는 경우에만 이용할 수 있습니다. (기존 방식은 첫번쨰 인덱스인 `a`만 사용해도 인덱 동작 가능)


### 인덱스 지정하는 방법
- 기본적으로 DBMS의 optimizer가 인덱스를 스스로 반영하여 조회에 사용하지만, 사용자가 이를 커스터마이징 하여 원하는 인덱스를 사용하도록 설정할 수 있습니다.
- 확인 방법: `EXPLAIN SELECT 스* FROM player WHERE backnumber=7;` 어떤 key를 이용하여 인덱스 참조했는지 분석할 수 있습니다.
- 제안 설정: `SELECT * FROM player USE INDEX (player_name_idx) WHERE name="sonny";`
- 강제 설정: `SELECT * FROM player FORCE INDEX (player_name_idx) WHERE name="sonny";`
- 제외 설정: `SELECT * FROM player IGNORE INDEX (player_name_idx) WHERE name="sonny";`

## 고려사항
- 인덱스를 많이 만든다는 것은 인덱스 테이블을 많이 만든다는 의미와 같습니다. 따라서, 추가 저장 공간이 발생하게 됩니다.
- 또한, table을 수정하거나 변경할 때마다 영향을 받는 인덱스에 함께 적용되기 때문에 불필요한 인덱스를 많이 만들면 이에 대한 수정 시간도 변경되게 됩니다.

### 추가 공부
- `ORDER BY`나 `GROUP BY`에 index를 사용하는 경우
- 이미 데이터가 매우 큰 경우에 인덱스를 추가하는 작업을 한다면 오랜 시간이 소모되어 DB 성능을 악화시킬 수 있습니다.

### 참고 자료
- [쉬운코드님 유튜브 영상](https://youtu.be/IMDH4iAQ6zM?si=U2NoBBtyJD5BQSGG)
