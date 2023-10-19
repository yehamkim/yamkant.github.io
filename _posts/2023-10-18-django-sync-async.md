---
layout: archive
title:  "[Django] 파이썬에서 프레임워크에서 구현하는 동기화 / 비동기화"
date:   2023-10-18 00:05:07 +0900
categories: 
    - Study
---

## 기억해야할 용어와 각 기능의 차이
### sync & async
- 프로그램의 주 실행흐름을 멈추지 않고 진행할 수 있는가에 대한 여부로 판단할 수 있습니다.
- 코드의 실행 결과 처리 및 활용하는 것을 별도의 채널에 맡겨둔 뒤 결과를 기다리지 않고 바로 다음 코드를 실행하는 방식으로 프로그램을 진행합니다.

### Blocking & None-blocking
- 입출력 처리가 완료될 때까지 기다릴 것인지 혹은 시작만 해두고 다음 작업을 계속 진행할 것인지에 대한 여부로 판단할 수 있습니다.
- I/O 작업이 완료된 이후에 연결하여 진행할 후속 작업이 있는 경우, Polling이나 Callback 함수를 사용합니다.

### async vs non-blocking
- Blocking I/O를 사용하더라도 별도의 채널을 통한 작업으로 이루어짐으로써 어떤 프로그램의 주 실행흐름을 막지 않는다면 Asynchronous Programming으로 개발했다고 볼 수 있습니다.
- 만약, A라는 작업과 B라는 작업이 있다면 블로킹 상태에서 B 작업이 CPU에서 실행되기 시작할 때, 제어권을 A에게 넘겨주지 않습니다. 따라서 A 작업은 B 작업이 끝나기 전에 CPU에서 실행될 수 없습니다.
- 하지만, Non-blocking 상태라면 B 작업은 실행과 동시에 A에게도 제어권을 넘겨주어, A는 B가 작업하는 동안 자신도 CPU에서 작업을 수행할 수 있는 상태가 됩니다.
- I/O 처리를 하여 작업을 수행하다가 커널에서 해당 작업이 끝나면 Interrupt를 진행하는 방식으로 Non-blocking 처리를 합니다.

### Sync 상황에서 Blocking, Non-blocking
#### Blocking
- A가 작업을 요청하면 B 작업은 A를 블로킹합니다.
- 따라서, A는 B가 작업을 마칠 때까지 아무것도 하지 못하게 됩니다.
- B 작업이 마쳐지면 응답으로 작업의 결과와 함께 다시 제어권이 주어지게 됩니다.

#### Non-blocking
- B 작업은 시작과 동시에 A에게 반환을 하며 제어권을 넘깁니다.
- A 작업은 수행이 되지만, A는 B의 작업이 언제 끝마칠지 알 수 없기 때문에 지속적으로 결과를 확인합니다. (Polling)
- B 작업이 끝나기 전에 다른 작업을 요청할 수 없습니다.

### Async 상황에서 Blocking, Non-blocking
#### Blocking
- Sync의 블로킹 상황과 동일합니다.

#### Non-blocking
- 자원과 시간이 모두 효율적인 구조입니다.
- A는 자신의 작업을 수행하며 여러 작업을 요청 또한 할 수 있습니다. 각각의 요청은 완전히 독립적이며, 어떤 작업이 얼마나 걸리는지를 예측할 수가 없습니다.
- 따라서, 결과를 받아서 처리하는 부분을 Callback 함수를 통해 전달해야하고, 콜백 로직을 제대로 사용해야합니다.

### Python에서의 비동기 처리
- 새로운 실행 흐름을 만들기 위해서는 Thread와 Process를 이해해야합니다.
- CPython은 GIL에 의해 한 번에 하나의 스레드 밖에 처리하지 못합니다. 여러 스레드를 생성하더라도 하나의 CPU에서 Context-Switching을 반복하며 수행합니다.
- 따라서, 비동기 처리를 위해 multiprocessing 모듈을 활용한 병렬 프로그래밍을 해야합니다.
- 하지만 I/O-bound 작업의 경우에는 스레드 기반의 병렬 처리 모델이 효과적이기 때문에 파이썬은 멀티 스레드를 관리하기 위해 asyncio 라이브러리를 비동기 표준 라이브러리로 지원하게 됩니다.

### asyncio
- async/await 구문을 사용하여 동시성 코드를 작성하는 라이브러리입니다.
- Coroutine과 Task를 동작시키기 위한 고수준 API들을 의미합니다.
- 저수준 API 제공: 네트워킹, 자식 프로세스 실행, OS 시그널 처리 등의 비동기 API를 제공하는 이벤트 루프를 만들고 관리합니다.

#### Coroutine
- 시작과 종료만 존재하는 서브루틴과 달리 코루틴은 중간에 다양한 시점에서 정지하고 재개하는 것이 가능합니다.
- 제너레이터의 특별한 형태로, `yield`를 통해 값을 받아올 수 있습니다. 코루틴의 값을 보낼 때는 `send`를 통해 값을 보낼 수 있으며, 예시는 다음과 같습니다.
  ```python
  def number_coroutine():
      try:
          total = 0
          while True:
              x = (yield)
              total += x
              print(x, end=' ')
      except GeneratorExit:
          print()
          print('코루틴 종료')
      except RuntimeError as e:
          print(e)
          yield total # 코루틴 바깥으로 값전달
  
  co = number_coroutine()
  next(co)
  
  for i in range(20):
      co.send(i)
    
  print(co.throw(RuntimeError, '예외로 코루틴 끝내기'))
  # co.close()
  ```
  - `next()`메서드로 `yield`까지 코드를 실행해둔 후, `send()` 메서드를 통해 값을 전송합니다.
- `프로세스 > 스레드 > 코루틴` 순서로 가볍습니다. 그 이유는 프로세스와 스레드는 운영체제의 관리 안에서 돌아가는 실행 흐름이지만 코루틴은 프로그래밍 언어 내에서 관리되는 실행흐름이기 때문입니다.
- 코루틴은 Promise처럼 하나의 객체로 구현되며 `async def` 키워드를 통해 정의할 수 있습니다.
- `asyncio.run()`은 코루틴을 실행하도록 하는 함수이며, `await` 는 코루틴의 실행과 완료를 기다리도록 하는 키워드입니다.
- asyncio에서 이러한 코루틴들을 수행하고 멀티태스킹을 관리하는 주체를 이벤트 루프라고 합니다. `run()` 의 매개변수로 코루틴을 넣고, 직접 실행시킴으로써 이벤트 루프를 생성하고 해당 코루틴을 메인 엔트리로 등록하여 코루틴이 종료되면 이벤트 루프를 종료합니다.
- 메인 스레드에 하나의 이벤트 루프가 생기면 각종 스레드 풀과 프로세스 풀까지 관리하며 동시성을 수행하는 구조이기 때문에, `run()` 메서드도 현재 스레드에 다른 이벤트 루프가 동작 중이면 호출할 수 없습니다.

#### 사용 예시
```python
import asyncio
import time

async def myTask(delay, content):
    await asyncio.sleep(delay)
    print(content)

async def main():
    print(f"started at {time.strftime('%X')}")

    task1 = asyncio.create_task(myTask(1, 'Task 1 done.'))
    task2 = asyncio.create_task(myTask(2, 'Task 2 done.'))

    await task1
    await task2

    print(f"finished at {time.strftime('%X')}")

asyncio.run(main())
```
- `create_task()` 메서드를 통해 코루틴을 Task 객체로 감싸준 이후 동작시켜야만 비동기적으로 처리됩니다.

```python
import asyncio
import time

async def myTask(delay, content):
    await asyncio.sleep(delay)
    print(content)

async def main():
    async with asyncio.TaskGroup() as tg:
        tg.create_task(myTask(1, 'Task 1 done.'))
        tg.create_task(myTask(2, 'Task 2 done.'))
        print(f"started at {time.strftime('%X')}")

    print(f"finished at {time.strftime('%X')}")

asyncio.run(main())
```
- 파이썬 3.11 이상의 버전부터는 `asyncio.TaskGroup`을 통해 여러개의 task를 생성하여 동시에 수행할 수 있게 됩니다.

### uvloop
- uvloop은 Python의 asyncio에서 구현되어있는 이벤트 루프를 대체합니다.
- uvloop은 CPython이 아닌 Cython으로 구현되어있으며, libuv(C로 작성된 모듈)를 기반으로 합니다.

#### 설정방법
```python
import asyncio
import uvloop

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
```

#### libuv란?
- 크로스 플랫폼을 지원하는 라이브러리이며, Node.js를 위해서 만들어졌습니다.
- 이벤트 드리븐 비동가 I/O 모델을 기반으로 구성되어있으며, kqueue, epoll, IOCP 등을 추상화합니다.

### I/O loop
- 각각 다른 스레드에서 실행되는 여러 이벤트를 이벤트 루프에서 실행되도록 합니다.
- libuv의 이벤트 루프는 직접 언급되어 있지 않다면 안전하지 않은 스레드입니다.
  (thread safe하지 않습니다.)
- 모든 I/O는 각 OS에 맞는 non-blocking 소켓에서 수행됩니다.


## 파이썬 프레임워크에서의 동기화와 비동기화
## 동기화와 비동기화
- 웹 애플리케이션은 짧은 시간 내에 서로 다른 클라이언트에서 받은 요청을 처리해야 하는 경우가 많습니다.
- 짧은 기간 안에 처리하고 지연을 방지하려면, 동시에 요청들을 처리할 수 있을지에 대해 고려해야하며, 이를 동시성이라고 합니다.
- "sync", "async"는 동시성을 사용하는 애플리케이션을 작성하는 두가지 방법을 나타냅니다.

### 요청에 대해 동기적으로 처리하는 방식 (Server workers)
- "sync" 서버는 동시성(Concurrency)을 구현하기 위해 스레드와 프로세스의 기본적으로 OS가 지원하는 기능을 사용합니다. 웹서버 및 로드밸런서는 클라이언트들의 요청에 대해 server workers pool로 요청을 분배합니다.
- 이 때, server workers pool은 프로세스들, 스레드들 혹은 둘의 조합으로 생성되며 웹 애플리케이션 프레임워크인 Flask나 Django에 전달됩니다.
- multiple CPU인 경우, CPU의 코어 수에 따라서 worker들의 수를 정할 수 있습니다. 이를 통해, GIL에 의해 멀티 스레딩이 제한되어있는 경우라도 균일하게 작업을 분배할 수 있습니다.
- 이러한 방식의 단점은, 다섯명의 클라이언트가 요청하지만 네 개의 워커가 동작하는 상황에서, race condition에 의해 남은 하나의 요청은 큐에 남아 워커에 전달될 때까지 대기 상태에 있게 된다는 것입니다.
- 따라서, 차단된 요청을 막거나 최소화 하기 위해 막기 위해 적절한 수의 워커를 선택하는 것이 중요합니다.

### 요청에 대해 비동기적으로 처리하는 방식 (Task)
- 비동기 타입의 서버는 loop에 의해 제어되는 하나의 프로세스에서 동작합니다.
- 이러한 루프는 클라이언트에 의해 보내어진 요청들을 실행하거나 태스크를 생성하는 매우 효율적인 태스크 매니저이며, 스케쥴러입니다.
- 풀 형태로 게속해서 상주하는 서버 워커들과 다르게 async 태스크는 특정 요청이 처리되어야 할 때마다 루프에 추가되며, 요청이 완료되면 태스크는 소멸됩니다.
- async 서버는 수백 혹은 수천개의 활성화된 태스크들을 가지고, 모든 태스크는 loop에서 관리되며 작업을 수행하게 됩니다.
- 비동기 애플리케이션은 비동기 태스크들을 위해 [cooperative multitasking](https://en.wikipedia.org/wiki/Cooperative_multitasking)에 의존합니다. 즉, 하나의 태스크가 데이터베이스 서버로부터의 응답과 같은 외부의 이벤트를 대기하는 경우, sync worker처럼 대기하는 대신 이벤트 루프에 기다려야할 사항을 알려주고 제어권을 반환합니다.
- async 스타일을 이용한 장점을 얻기 위해서는 애플리케이션은 "I/O에 의해 블록"되거나 "너무 많은 CPU 작업을 갖지 않는" 태스크를 가져야할 필요가 있습니다.
- 제어권을 가진 루프는 이 작업이 데이터베이스에 의해 차단되는 동안 실행할 준비가 된 다른 작업을 찾을 수 있습니다. 따라서, 데이터베이스는 응답을 보내고 루프는 첫 번째 작업을 다시 실행할 준비가 된 것으로 간주하여 가능한 빨리 작업을 이어서 수행합니다.
- 비동기 애플리케이션은 전체적으로 단일 프로세스와 단일 스레드에서 실행됩니다. 물론, 너무 오랫동안 CPU를 유지하는 작업을 수행하는 경우나 다른 작업을 수행할 수 없는 경우에 대한 처리는 항상 고려해야합니다.
- 비동기적으로 동작하려면 모든 작업이 자발적으로 일시 중지되어, 제 때 제어권을 루프에 반환해야합니다. 따라서, 비동기 스타일의 이점을 활용하려면 애플리케이션에 I/O에 의해 자주 차단되고 CPU 작업이 너무 많지 않은 작업이어야 합니다. 