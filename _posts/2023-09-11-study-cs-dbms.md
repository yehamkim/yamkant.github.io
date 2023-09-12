---
layout: archive
title:  "[Study] DBMS 동작 원리 관련 정리"
date:   2023-08-16 00:05:07 +0900
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




### 참고자료
- [쉬운코드님 trigger 강의](https://youtu.be/mEeGf4ZWQKI?si=cTzyiw9E9bCI4DFS)