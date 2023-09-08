---
layout: archive
title:  "[Study] Operating System - Sync, Async"
date:   2023-09-07 00:05:07 +0900
categories: 
    - Study
---

### Race condition
- 여러 프로세스/스레드가 동시에 같은 데이터에 접근할 때 타이밍이나 접근 순서에 따라 결과가 달라지는 상황을 말합니다.
- 동기화: 여러 프로세스/스레드를 동시에 실행하더라도 공유 데이터의 일관성을 유지하도록 하는 것을 의미합니다.
- critical section: 공유 데이터의 일관성을 보장하기 위해 하나의 프로세스/스레드만 진입해서 실행 가능한 영역을 의미합니다.  
  ```shell
  do {
    entry section # critical section에 진입하기 위한 조건을 갖추었는지 확인하는 구간
      critical section
    exit section # 이 후에도 솔루션이 잘 동작할 수 있도록 조치를 취하는 구간
      remainder section
  } while (True)
  ```
- 하나의 메서드가 실행하고 마칠 때까지 한 스레드만 해당 메서드에 접근 가능하도록 한다면 (critical section), 싱글코어든 멀티코어든 해당 메서드의 처리 이후 접근하게 될 것이므로 동기화에 대해 문제가 없습니다.
- critical section problem의 해결책을 위한 조건은 다음과 같습니다.
  1. mutual exclusion (상호 배제): 한 번에 하나의 프로세스/스레드만 critical section에 진입하여 작업 수행이 가능합니다.
  2. progress (진행): critical section이 비어있고, 이를 위해 대기하고 있는 프로세스/스레드가 있다면 그 중 하나는 진행이 될 수 있도록 처리해야합니다.
  3. bounded waiting (한정된 대기): 어떤 프로세스/스레드가 무한정 critical section에 들어가지 못하고 있는 경우는 없어야 합니다.

### Lock
- mutual exclusion을 보장하도록 하는 방법입니다.  
  ```shell
  do {
    acquire lock
      critical section
    release lock
      remainder section
  } while (TRUE)
  ```
- atomic 명령어: 실행 중간에 간섭받거나 중단되지 않으며, 같은 메모리 영역에 대해 동시에 실행되지 않습니다. 이는, CPU 내부에서 함수를 동작시키는 원리입니다.
- mutual exclusion만 사용한다면 뮤텍스를, 작업 간의 실행 순서에 대한 동기화가 필요하다면 세마포어 사용을 권장합니다.

**Spin lock**
- 무한루프(while True)를 사용해서 lock을 획득할 떄까지 기다리는 방식입니다.
- 기다리는 동안 CPU를 낭비하게 되는 단점이 있습니다. 다른 작업을 위해 사용해야하는 CPU를 락을 확인하는데 사용하고 있기 때문입니다.
- 멀티코어 환경이고, critical section에서의 작업이 컨텍스트 스위칭보다 더 빨리 끝나면 스핀락이 뮤텍스보다 이점을 갖습니다.

**Mutex**
- 뮤텍스의 기본 원리는 아래와 같습니다. 락을 가질 수 있을 때까지 휴식을 취하다가 락을 쥐면 그때 깨어나서 critical section에 진입합니다.
  ```c++
  mutex -> lock();
  ... critical section
  mutex -> unlock();

  //---

  class Mutex {
    int value = 1;
    int guard = 0;
  }

  Mutex::lock() {
    while (test_and_set(&guard));
    if (value == 0) {
      ... 현재 스레드를 큐에 넣기;
      guard = 0;
    } else {
      value = 0;
      guard = 0;
    }
  }

  Mutex::unlock() {
    while (test_and_set(&guard));
    if (큐에 대기중인 프로세스 존재) {
      ... lock을 해제;
      guard = 0;
    } else {
      value = 1
    }
    guard = 0;
  }
  ```
  - Point1. 스레드들은 lock을 갖기 위해 경합을 하며, `value`가 0인 경우, 무한루프를 돌리지 않고, 스레드를 큐에 넣는 작업을 합니다.
  - Point2. CPU 레벨에서 지원하는 atomic 명령어인 `test_and_set`을 사용하여 작업합니다.
- priority inheritance 속성을 가집니다. 따라서, 스케쥴러가 스케쥴링을 할 때 우선순위를 조정하여 critical section을 빠져나오도록 할 수 있습니다. (세마포어는 이런 동작 불가능)

**Semaphore**
- signal mechanism을 가진 하나 이상의 프로세스/스레드가 critical section에 접근 가능한 장치입니다.  
  ```c++
  //---

  class Semaphore {
    int value = 1;
    int guard = 0;
  }

  Semaphore::wait() {
    while (test_and_set(&guard));
    if (value == 0) {
      ... 현재 스레드를 큐에 넣기;
      guard = 0;
    } else {
      value -= 1;
      guard = 0;
    }
  }

  Semaphore::signal() {
    while (test_and_set(&guard));
    if (큐에 대기중인 프로세스 존재) {
      ... 그 중 하나를 깨워서 작업을 위한 준비를 진행시키기;
      guard = 0;
    } else {
      value += 1
    }
    guard = 0;
  }
  ```
  - `value`를 0과 1만 가지는 경우에는 바이너리 세마포어, 1외에 값을 가질 수 있는 경우는 카운팅 세마포어라고 합니다.
  - `value`가 1 외에도 여러값을 가져서, critical section에 하나 이상의 프로세스/스레드가 접근하여 작업이 가능하도록 합니다.
- 세마포어는 순서를 정해줄 때 사용할 수 있습니다. 예를 들어 task의 진행 방식이 아래와 같다고 생각해봅시다. (signal mechanism을 가짐)
  ```shell
  task1 {
    semaphore->signal()
  }

  task2
  semaphore->wait()
  task3
  ```
  - task3를 실행하기 위해, task2가 끝나고 task3을 수행하려면, task1을 먼저 수행하여 `signal`을 얻어 와야합니다.
- 위 예시와 같이 `wait()`와 `signal()`이 반드시 같은 프로세스나 스레드 안에서 실행될 필요가 없다는 특징이 있습니다.
- 뮤텍스는 락을 가진 프로세스/스레드만 락을 해제할 수 있지만, 세마포어는 `wait`를 하는 프로세스와 `signal`을 날리는 프로세스가 달라도 됩니다.






## 참고
- [쉬운코드님 운영체제 - 동기화의 목적](https://youtu.be/vp0Gckz3z64?si=diBWEAzKVzTrjK9u)