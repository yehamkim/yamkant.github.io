---
layout: archive
title:  "[Error Async] Promise.allSettled"
date:   2023-04-11 23:00:07 +0900
categories: 
  - Error Async
---

### 문제 발생 상황
- 외부 발주사에서 상품을 등록하는 API를 호출하던 중에, Sequelize가 Too many connections를 반환하며 서버가 비정상적으로 동작하였습니다.
- 코드를 살펴보니, 다른 개발자가 Promise all 코드를 통해 API 호출 및 Database에 값을 반영하는 작업을 모두 비동기적으로 진행하고 있었습니다.
- 비동기 작업과 Sequelizer Database 점유에 대한 학습의 필요성을 느끼게 되었습니다.
- 참고링크  
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled#try_it
  - https://ko.javascript.info/promise-api#ref-569

## Promise.all
- 매개변수로 Promise의 Array와 같은 iterable 객체를 입력받습니다.
- 각 promise 객체들의 실행 결과가 담긴 배열을 반환합니다. (실행환경에 따라 fullfiled/rejected와 같은 상태를 반환)

### 코드 예시
```javascript
const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));
const asyncFunction = async () => {
    console.log('sleep start');
    await sleep(3000);
    console.log('sleep end');
    return 2;
}

Promise.all([
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(1), 1000)
  }).then((result) => {
    setTimeout(() => console.log(result), 1000)
    return result;
  }),
  asyncFunction(),
  new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("[ERROR]")), 2000);
  }),
]).catch((err) => {
    console.log(err.message);
}).then((result) => {
    console.log(result);
});

/*
출력 결과 (node.js로 실행)
------------------------
(1)--sleep start
(2)--1
(3)--[ERROR]
(4)--undefined
(5)--sleep end
*/
```
- (3), (4) 출력을 통해, Promise.all 메서드는 Promise 작업들을 수행하다가 Error를 발생시키는 작업이 있다면, 바로 Promise all 동작을 마친다는 것을 알 수 있습니다.
- 하지만, (5) 출력을 통해 Promise.all의 동작이 중지 되었더라도 다른 작업들은 이에 영향을 받지 않고 계속 작업됨을 알 수 있습니다.

### Promise.allSettled
- 위와 같은 문제를 해결하기 위해 allSettled 메서드를 사용해봅니다.
- 매개변수로 받은 Promise Array 객체 각각의 결과를 한 번에 받기 때문에, 어떤 Promise에서 에러가 발생했는지 알 수 있습니다.

```javascript
...
Promise.allSettled([
  ...
]).catch((err) => {
    console.log(err.message);
}).then((result) => {
    console.log(result);
});

/*
출력 결과 (node.js로 실행)
------------------------
(1)--sleep start
(2)--1
(3)--sleep end
(4)--[
       { status: 'fulfilled', value: 1 },
       { status: 'fulfilled', value: 2 },
       {
         status: 'rejected',
         reason: Error: [ERROR]
             ...
       }
     ]
*/
```
- all 메서드와 달리 allSettled 메서드는 모든 작업을 기다린 후, 결과값들을 반환하여, 어떤 Promise에서 Error가 발생했는지 분석할 수 있습니다.
- 중간에 비동기 작업이 Error를 발생시키더라도, 모든 작업이 끝마칠 때까지 기다리며, 결과 배열에 발생한 에러에 대한 reason을 반환합니다.
