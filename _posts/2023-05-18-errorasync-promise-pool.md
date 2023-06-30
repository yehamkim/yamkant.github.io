---
layout: archive
title:  "[Error Async] connection pool 제한에 따른 비동기 처리"
date:   2023-05-18 23:00:07 +0900
categories: 
    - Error Async
---

### 오류 내용
- 상품의 상태(재고량 및 단종여부)를 주기적으로 업데이트하기 위해, 배치서버를 통해 국민클럽B2B(폐쇄몰)의 업데이트하는 배치 함수를 비동기적으로 실행시킵니다.
- 하지만, DBCP를 고려하지 않은 설계로 인해, **too many connections** 오류와 함께 서버가 중단되었습니다. 

### 해결 내용
- 정해진 개수의 connection pool에만 접근 가능하도록 Sequelize option을 사용하여 connection pool을 제한하였습니다.
- 제한된 connection pool에서 task들이 비동기적으로 실행될 수 있도록 promise-pool 모듈을 사용하였습니다.

### 기본적인 사용법
```javascript
// promise_pool.js
const { PromisePool } = require('@supercharge/promise-pool')

const excuteBasicPromisePool = async () => {
    const {
        results, errors
    } = await PromisePool.for(
            [1, 2, 3]
        ).process(async num => {
            return num * 2
        })
    return results
}

module.exports = {
    excuteBasicPromisePool,
};
```
- `promise-pool`의 기본적인 사용법은 위와 같습니다. `[1, 2, 3]` 배열에 2를 곱하여 반환하는 `excuteBasicPromisePool` 비동기함수를 작성합니다.

```javascript
// promise_pool.test.js
const { excuteBasicPromisePool } = require('./promise_pool');

test("excuteBasicPromisePool", async () => {
    expect(await excuteBasicPromisePool()).toEqual([2, 4, 6]);
});
```
- jest를 통해 `excuteBasicPromisePool` 함수를 테스트합니다.

### 기본 Promise 클래스와의 비교
```javascript
// utils.js
const users = [{
    id: 1,
    name: 'userA',
}, {
    id: 2,
    name: 'userB',
}, {
    id: 3,
    name: 'userC',
}, {
    id: 4,
    name: 'userD',
}]

function getUserByIdWithDelayTime(param) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const user = users.filter(obj => obj.id === param.id);
            resolve(user);
        }, param.time)
    })
}

module.exports = {
    users,
    getUserByIdWithDelayTime,
}
```
- test에서 사용하기 위한 utility 파일에 `getUserByIdWithDelayTime()`를 생성합니다.  
    (id에 따른 user를 조회하는 함수)
- 이 때, DB로 부터 값을 가지고 오는 것과 같이 시간이 소요되는 항목을 모킹하기 위해 delay time(데이터 조회 시간)을 함께 param 변수에 넣도록 합니다.

```javascript
// promise_pool.js

const { PromisePool } = require('@supercharge/promise-pool')
const {
    getUserByIdWithDelayTime,
} = require('./utils');
const _ = require('lodash');

const measurePromiseAllWithChunk = async (paramList, chunkSize) => {
    // chunkAll를 각각의 chunk로 나누기
    const chunkSetAll = _.chunk(paramList, chunkSize)
    const startTime = performance.now();
    let idx = 0;

    for (const chunkSet of chunkSetAll) {
        const chunkStartTime = performance.now();
        await Promise.all(chunkSet.map(param => getUserByIdWithDelayTime(param)));
        const chunkEndTime = performance.now();
        console.log(`measurePromiseAllWihChunk: ${idx++} - elapsed time: ${chunkEndTime - chunkStartTime}`);
    }
    const endTime = performance.now();
    console.log(`measurePromiseAllWihChunk: total time: ${endTime - startTime} ms`);
}

const measurePromisePoolWithConcurrency = async (paramList, chunkSize) => {
    const startTime = performance.now();
    const {
        results, errors
    } = await PromisePool
        .for(paramList)
        .withConcurrency(chunkSize)
        .process(getUserByIdWithDelayTime);
    const endTime = performance.now();
    console.log(`measurePromisePoolWihConcurrency time: ${endTime - startTime} ms`);
    return results
}
```
- `measurePromiseAllWithChunk()`: `[{id: ?, time: ?}, ...]` 형태의 배열을 직접 chunk 단위로 나눈 chunk set을 각 set 마다 `Promise.all()`을 반복 수행합니다.
- 예를 들어, chunk가 [1번, 2번], [3번, 4번, 5번] 형식으로 묶이게 된다면 두 번을 반복하여 각 chunk를 `Promise.all()`로 처리합니다.
- `measurePromisePoolWithConcurrency()`: 위 함수와 같은 역할을 하지만, 직접 chunk를 나누지 않고 `PromisePool` 클래스의 `withConcurrency()` 메서드를 사용합니다.

### 테스트 결과 분석
```javascript
// promise_pool.test.js

const {
    measurePromiseAllWithChunk,
    measurePromisePoolWithConcurrency,
} = require('./promise_pool');

test("measurePromiseAllWithChunk", async () => {
    const paramList = [{
        id: 1,
        time: 100,
    }, {
        id: 2,
        time: 300,
    }, {
        id: 3,
        time: 200,
    }]

    await measurePromiseAllWithChunk(paramList, 2)
})

test("measurePromisePoolWithConcurrency", async () => {
    // 위와 동일
    const paramList = [{
        ...
    }]

    await measurePromisePoolWithConcurrency(paramList, 2)
})

/** 출력 결과
measurePromiseAllWihChunk: 0 - elapsed time: 300.7714159488678
measurePromiseAllWihChunk: 1 - elapsed time: 200.38870894908905
measurePromiseAllWihChunk: total time: 505.5954999923706 ms

measurePromisePoolWihConcurrency time: 301.0168330669403 ms
*/
```
- `Promise.all`을 사용하면, 100ms와 300ms가 같은 chunk로 묶여있기 때문에, 100ms task를 마치더라도 200ms task를 진행할 수 없었습니다. 따라서 300ms와 200ms의 합인 500ms 이상의 시간이 소요됩니다.
- 하지만, `PromisePool`을 사용한 결과 100ms task가 끝나고 다른 chunk에 있는 200ms 바로 사용하였기 때문에, 300ms 정도의 시간만 소요되었습니다.

### 결과
- task 처리시간을 미리 예측할 수 없는 상태에서 chunk를 나누어 각각의 set를 비동기처리하는 방식이 아닌, task가 끝날 때마다 다음 task를 수행하는 `PromisePool` 클래스를 사용하여 시간을 단축할 수 있었습니다.
- 위의 간단한 예시를 통해 제한된 thread pool에서 chunk 단위로 순차적으로 진행되는 것을 확인하였고, 실제 서비스에 직접 적용한 결과 안전성을 확보할 수 있었습니다.

### 참고 자료
- 이동욱님 블로그 자료: https://jojoldu.tistory.com/714
- promise-pool 모듈: https://github.com/supercharge/promise-pool
- dalseo님 async jest test: https://www.daleseo.com/jest-async/