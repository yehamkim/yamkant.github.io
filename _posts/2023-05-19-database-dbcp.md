---
layout: archive
title:  "[SQL] dbcp란 무엇이며, api 서버와 DB는 어떻게 통신할까?"
date:   2023-05-13 20:05:07 +0900
categories: 
    - Database
---

# DBCP (DB Connection Pool)
- 참고: https://youtu.be/zowzVqx3MQ4
- 해당 글은 위의 쉬운코드 님의 영상을 토대로 요약한 글 입니다.

**통신방법**
- 백엔드 서버와 DB 서버는 TCP 기반으로 통신합니다. 따라서, connection을 맺어 열거나 닫아서 연결하는 과정이 필요합니다.
- DB 서버를 열고 닫을 때마다 시간적인 비용이 발생하게 되고, 이는 서비스 성능에 좋지 않습니다.

**DBCP의 개념과 원리**
1. 백엔드 서버는 DB 서버와 통신하기 위해 미리 DB connection을 만들어두고, 풀처럼 관리할 수 있도록 합니다. 이를 DBCP라고 합니다.
2. [get connection] API 요청을 받아, DB를 조회하는 상황이 발생하면 connection pool에서 사용 가능한 connection을 가져와서 대여합니다.
3. connection을 통해 쿼리를 DB 서버로 요청하고, 데이터를 받습니다.
4. [close connection] 빌려왔던 connection을 connection pool에 다시 반환합니다.
5. API 응답을 반환합니다.

- 위와 같이, connection pool을 사용한다면 connection을 재사용하므로써 DB와의 TCP 연결 시간을 절약할 수 있습니다.

**DBCP 설정 방법**
- 해당 강의에서는 DB 서버는 MySQL을, 백엔드 서버는 HikariCP를 사용합니다.
- DB connection은 백엔드 서버와 DB 서버 각각에서의 설정 방법을 잘 알고 있어야합니다.

### MySQL DB Connection 설정 방법
**max_connections**  
- client(백엔드 서버)와 맺을 수 있는 최대 connection 수를 결정하는 파라미터입니다.
- `max_connections`를 여유있게 설정하지 않게 되면, DBCP의 connection 수가 증가해야하는 경우에 DB 서버와 connection할 수 없는 문제가 발생합니다.

**wait_timeout**
- DB 서버에서 connection이 inactive 할 때, 다시 요청이 오기까지 얼마의 시간을 기다린 뒤 close 할 것인지를 결정하는 파라미터입니다.
- `wait_timeout` 이내에 요청이 도착한다면 0으로 시간을 초기화 하고 새로운 요청을 기다립니다.
- connection pool에 connection들이 있음에도 불구하고, 백엔드 서버에서 어떤 오류가 발생하여 connection을 종료하고 반환하지 못한다면, DB 서버는 하염없이 connection을 맺어두고 resource를 낭비할 수 밖에 없게됩니다.
- 따라서, DB 서버는 `wait_timeout`의 시간만큼 기다린 후, 비정상적인 상황임을 감지하면 해당 connection을 끊고 자원을 회수합니다.

### 백엔드 서버 DB Connection 설정 방법 (HikariCP)
**minimumIdle**
- pool에서 유지하는 최소한의 idle(요청이 올 때 까지 대기하고 있는 유휴자원) connection의 수를 결정하는 파라미터입니다.
- connection들이 계속 사용 되다가 모두 반환되어 여러개의 connection이 생기더라도, `minimumIdle`의 개수에 맞도록 나머지 connection은 끊어줍니다.
**maximumPoolSize**
- pool이 가질 수 있는 최대 connection의 수(idle과 active(in-use) connection을 합친)를 결정하는 파라미터입니다.
- 이는 minimumIdle 보다 우선순위를 가지게 되어 점유중인 connection이 minimumIdle보다 작다면 새로 값을 추가해야하지만, maximumPoolSize 이상으로 추가할 수는 없습니다. (아래 예시)
- minimumIdle이 2이고, maximumPoolSize가 4인 경우: connection pool에 4개의 connection이 있고, 그 중 세 개의 connection이 점유 중이고, 하나가 idle connection 상태일 때 -> maximumPoolSize가 4이기 때문에 connection을 추가할 수 없게 됩니다.
**maxLifetime**
- pool에서 connection의 최대 수명을 설정하는 파라미터입니다.
- pool 내의 connection 상태가 이를 넘기면 idle인 경우 바로 제거하고, active 인 경우는 pool로 반환 후에 제거합니다.
- 주의: `maxLifetime`이 제대로 동작하기 위해서는 connection이 제 때 반환되어야 합니다. 따라서, API 처리가 길어져 connection을 오래 점유하고 DB 서버에서 `wait_timeout`에 의해 연결도 끊긴 상태라면 `maxLifetime`이 캐치할 수 없는 메모리 connection 누수 현상이 발생하게 될 수 있습니다.
- 권유: DB 서버의 connection time limit(MySQL의 경우, `wait_timeout`)보다 2~3초 정도 더 짧게 설정해두는 것이 좋습니다. connection을 통한 처리 요청이 DB 서버까지 다다르기 전에 DB 서버의 connection time이 만료될 수 있기 때문입니다.
**connectionTimeout**
- pool에서 connection을 받기 위한 대기 시간으로, 백엔드 서버에 트래픽이 밀려올 때 해당 시간 내에 pool에서 connection을 받아오지 못하는 경우 exception이 발생합니다.
- 해당 시간을 설정할 때, 서비스 이용자가 요청 후 얼마나 대기할 수 있는지까지 판단하여 설정해야합니다. timeout 시간을 30초로 잡더라도 서비스 이용자가 백엔드 서버와의 연결을 끊는다면 의미가 없기 떄문입니다.

## 적절한 connection 수를 찾기 위한 과정
- 기본적으로 DB 서버를 구성할 때, 고가용성을 보장하기 위해 replication으로 구성합니다. Primary 서버는 read-write를 담당하고, Secondary 서버는 read-only를 담당합니다. 
- 적절한 connection 수를 찾기 위해 모니터링 환경(서버 리소스, 서버 스레드 수, DBCP 등등)을 구축합니다.
- 백엔드 시스템에 대한 부하 테스트(tool: nGrinder)를 수행하면서 traffic에 따른 서버의 동작을 모니터링합니다.
- 관찰해야할 사항: 백엔드 서버, DB 서버의 CPU, MEM 등의 리소스 사용률을 확인
  - request per second: **백엔드 시스템의 전체적인 처리량**을 보기 위한 지표입니다.
  - average response time: 요청을 처리할 때 평균적인 응답처리를 보며, **api 성능을 확인하는 지표**를 확인해야합니다.
- 만약 트래픽이 많아짐에 따라서 백엔드 서버는 문제가 없지만 DB 서버에 문제가 있는 경우
  - select 쿼리를 많이 처리하게 되면서 발생하는 문제라면, Secondary 서버를 추가합니다.
  - 백엔드 서버와 DB 서버 사이에 Cache layer를 두어 DB 서버가 직접적으로 받는 부하를 낮출 수 있습니다.
  - Sharding을 이용하는 방법이 있습니다.
- thread per request 모델인 경우, active thread 수를 확인합니다.

**추가 공부**
- Naver D2: https://d2.naver.com/helloworld/5102792
- hikariCP github: https://github.com/brettwooldridge/HikariCP
- MySQL 설정 페이지: https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html

---
**참고**
- https://jojoldu.tistory.com/634
- https://d2.naver.com/helloworld/5102792 

### Sequelize에서 테스트 해보기
```javascript
// app.js
require('dotenv').config();

const express = require('express')
const app = express()
const port = process.env.PORT || 3000

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        operatorsAliases: false,

        pool: {
            max: 5,
            min: 0,
            // acquire: procee.env.pool.acquire,
            // idle: procee.env.pool.idle
        }
    }
);
sequelize
    .sync()
    .then(() => console.log('Connected database'))
    .catch((e) => console.log('Failed to connect db ' + e))

app.get('/test-timeout', async (req, res) => {
    const startTime = new Date();
    try {
        await sequelize.query("SELECT SLEEP(3);");
        const lag = new Date() - startTime;
        console.log(`Lag: ${lag}ms`);
    } catch (e) {
        const lag = new Date() - startTime;
        console.log(`Lag: ${lag}ms`);
        console.error('db error', e);
    }
    res.status(200).json({'msg': 'ok'});
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
```
- DB의 커넥션 풀을 5로 제한하였고, 각 쿼리당 DB 수행 시간을 3초라고 가정하였습니다. 
- 아래와 같이 [Apache Bench](https://httpd.apache.org/docs/2.4/ko/programs/ab.html)를 사용하여 부하테스트를 수행하면 다음과 같은 결과를 얻을 수 있습니다.
- 부하 테스트를 위해, 20명의 유저가 동시에 저희 서버에 100회 요청을 보내는 상황을 가정하였습니다.

```shell
> ab -n 100 -c 20 https://localhost:4000/test-timeout
This is ApacheBench, Version 2.3 <$Revision: 1879490 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient).....done


Server Software:        nginx/1.21.6
Server Hostname:        localhost
Server Port:            4000
SSL/TLS Protocol:       TLSv1.2,ECDHE-RSA-CHACHA20-POLY1305,4096,256
Server Temp Key:        ECDH X25519 253 bits
TLS Server Name:        localhost

Document Path:          /km/test-timeout
Document Length:        12 bytes

Concurrency Level:      20
Time taken for tests:   64.159 seconds
Complete requests:      100
Failed requests:        0
Total transferred:      27200 bytes
HTML transferred:       1200 bytes
Requests per second:    1.56 [#/sec] (mean)
Time per request:       12831.748 [ms] (mean)
Time per request:       641.587 [ms] (mean, across all concurrent requests)
Transfer rate:          0.41 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:       14   77  59.8     48     243
Processing:  3039 11087 2476.8  12026   12342
Waiting:     3039 11086 2476.8  12026   12342
Total:       3101 11164 2459.8  12095   12370

Percentage of the requests served within a certain time (ms)
  50%  12095
  66%  12171
  75%  12199
  80%  12222
  90%  12303
  95%  12315
  98%  12332
  99%  12370
 100%  12370 (longest request)

# console의 결과 ========================================
Lag: 3093.0100421905518ms
Lag: 3056.129874944687ms
Lag: 3071.250333070755ms
Lag: 3063.7896671295166ms
Lag: 3065.905833005905ms
Lag: 3056.715542078018ms

Lag: 6105.021874904633ms
Lag: 6107.211666107178ms
Lag: 6109.895124912262ms
Lag: 6116.28054189682ms
Lag: 6118.377749919891ms

Lag: 9111.812832832336ms
Lag: 9110.667292118073ms
Lag: 9115.994791030884ms
Lag: 9120.64020895958ms
Lag: 9124.2014169693ms

Lag: 12140.2624168396ms
Lag: 12141.329499959946ms
Lag: 12143.3755838871ms
Lag: 12145.10533285141ms
Lag: 12145.73112487793ms

Lag: 12126.067250013351ms
Lag: 12110.478208065033ms
Lag: 12111.195416927338ms
Lag: 12106.155959129333ms
Lag: 12108.08195900917ms
...
```

- 20명이 5개의 커넥션 풀로 모든 작업을 완료해야합니다. 1,2,3,4,5번이 처음 요청을 보낼 때, 가장 먼저 요청한 다섯명은 처리가 제 때 완료되어 3초의 지연이 있고(기다리는 요청 15개), 6,7,8,9,10번은 앞의 다섯명을 기다리느라 6초의 지연이 있습니다.(처리된 요청 5개, 대기중인 요청 10개)
- 이 때, 처리된 요청이 다시 요청을 보내므로 6,7,8,9,10이 DB 동작을 처리하기 시작할 때, 이미 1,2,3,4,5번의 두 번째 요청이 대기 중입니다.
- 따라서 1,2,3,4,5번의 두 번째 요청부터는 응답을 받으려면 12000ms 정도가 걸리게 되는 것입니다. 이와 같이 모든 유저의 두 번째 요청부터는 12000ms 정도가 걸리게 되어 Lag가 일정 시점부터는 12000ms로 고정됩니다.
