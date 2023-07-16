---
layout: archive
title:  "[Study] Python Clean Code - Decorator"
date:   2023-07-16 10:05:07 +0900
categories: 
    - Study
---

## Decorator
- 원본 함수(외에도 메서드, 제너레이터, 클래스)를 직접 수정하지 않더라도, 간접적으로 기능을 수정할 수 있는 방법입니다.

### 함수 데코레이터
- 아래와 같은 방식으로 데코레이터의 형태를 구현할 수 있습니다.
```python
def retry(operation):
    @wraps(operation)
    def wrapped(*args, **kwargs):
        last_raised = None
        RETRIES_LIMIT = 3
        for _ in range(RETRIES_LIMIT):
            try:
                return operation(*args, **kwargs)
            except ControlledException as e:
                logger.info("retrying %s", operation.__qualname__)
                last_raised = e
        raise last_raised
    return wrapped
```
- 특정 함수가 오류를 발생시킬 경우를 대비하여 정상적인 동작까지 3번은 무조건 실행시키는 방법입니다.
- 위의 `retry` 데코레이터는 파라미터가 필요없기 때문에 어떤 함수에도 쉽게 적용할 수 있습니다.

### 클래스 데코레이터
- 데코레이터 함수의 파라미터로 함수가 아닌 클래스를 받는 형태입니다.
- 클래스 데코레이터를 사용하면 여러 클래스가 특정 기준을 따르도록 강제할 수 있으며, 단순한 클래스의 기능을 차차 보강해나갈 수 있습니다.
  
### 중첩 함수의 데코레이터
- 다음과 같은 형식으로 구현할 수 있습니다.
    ```python
    @retry(arg1, arg2, ..)

    # @ 구문은 데코레이팅 객체에 대한 연산결과를 반환합니다. 따라서 이는 위의 코드와 같습니다.
    <original_function> = retry(arg1, arg2, ...)(<original_function>)
    ```
- 앞선 예제에서, 원하는 횟수를 추가하여 변수로 사용하고 싶다면, 아래와 같이 변경할 수 있습니다.
    ```python
    def with_retry(retries_limit=RETRIES_LIMIT, allowed_exceptions=None):
        allowed_exceptions = allowed_exceptions or (ControlledException,)

        def retry(operation):
            @wraps(operation)
            def wrapped(*args, **kwargs):
                last_raised = None
                for _ in range(retries_limit):
                    try:
                        return operation(*args, **kwargs)
                    except ControlledException as e:
                        logger.info("retrying %s", operation.__qualname__)
                        last_raised = e
                raise last_raised
            return wrapped
        return retry

    # 실행방식
    @with_retry()
    def run_operation(task):
        return task.run()

    @with_retry(retries_limit=4, allowed_exceptions=(ZeroDivisionError, AttributeError))
    def run_with_custom_parameters(task):
        return task.run()
    ```
    - 반복 횟수 및 exception의 종류를 지정하여 원하는 함수를 여러 번 실행시킬 수 있습니다.

### 데코레이터 객체
- 앞 선 예제에서는 세 단계나 되는 중첩함수가 필요합니다. 클래스를 사용하여 정의한다면, 더 깔끔하게 구현이 가능합니다.
    ```python
    class WithRetry:
        def __init__(self, retries_limit=RETRIES_LIMIT, allowed_exceptions=None):
            self.retries_limit = retries_limit
            self.allowed_exceptions = allowed_exceptions or (ControlledException,)
        
        def __call__(self, operation):
            @wraps(operation)
            def wrapped(*args, **kwargs):
                last_raised = None

                for _ in range(self.retries_limit):
                    try:
                        return operation(*args, **kwargs)
                    except self.allowed_exception as e:
                        logger.info("retrying %s", operation.__qualname__)
                        last_raised = e
                    raise last_raised

            return wrapped
    
    # 사용 예시
    @WithRetry(retry_limit=5)
    def run_with_custom_retries_limit(task):
        return task.run()
    ```
    - `__init__` 메서드에 파라미터를 전달한 후, `__call__` 메서드에서 데코레이션 로직을 구현하는 방식입니다.
    - @ 연산 전에 전달된 파라미터를 사용해 데코레이터 객체를 생성합니다.
    - `run_with_custom_retries_limit` 함수를 래핑하여 `__call__` 매직 메서드를 호출합니다.

### 데코레이터 활용 우수 사례
- 원하는 API를 노출하기 위해 노출하고 싶지 않은 부분을 캡슐화하여 숨길 수 있습니다.
- 파라미터와 함께 함수의 실행을 로깅하려는 경우 코드 추적을 위해 사용할 수 있습니다. (실행 경로 추적 / CPU 사용률 및 메모리 사용량 모니터링 / 함수 실행 시간 / 전달되는 파라미터 종류)
- 파라미터의 유효성을 검사하는 경우
- 재시도 로직을 구현하는 경우 및 일부 반복작업을 단순화하고자하는 경우

### 데코레이터 자주 발생하는 실수
- 데코레이터는 원본 객체 데이터를 보존해야합니다. 즉, 원래 함수의 어떤 것도 변ㄴ경하지 않아야 합니다.
- 하지만, 코드에 결함이 있어서 이름이나 docstring을 변경하는 경우가 있습니다.
    ```python
    def trace_decorator(function):
        def wrapped(*args, **kwargs):
            logger.info("%s 실행", function.__qualname__)
            return function(*args, **kwargs)
        return wrapped

    @trace_decorator
    def process_account(account_id):
        """id별 계정 처리"""
        logger.info("%s 계정 처리", account_id)

    logger.info(process_account.__qualname__)
    ```
    - 위와 같이 출력하면, 출력값은 `trace_decorator.<locals>.wrapped`가 되어, 어떤 함수를 호출했는지 알 수 없습니다.
- 따라서, 이를 방지하기 위해, 데코레이터의 `wrapped` 함수 앞에 `@wraps` 데코레이터를 적용하여 실제로는 function 파라미터 함수를 래핑했음을 명시합니다.
    ```python
    from functools import wraps

    def trace_decorator(function):
        @wraps(function)
        def wrapped(*args, **kwargs):
            logger.info("%s 실행", function.__qualname__)
            return function(*args, **kwargs)
        return wrapped

    @trace_decorator
    def process_account(account_id):
        """id별 계정 처리"""
        logger.info("%s 계정 처리", account_id)

    logger.info(process_account.__qualname__)
    ```
    - 위와 같이 `@wraps` 데코레이터를 추가하면 function 파라미터 함수를 래핑한 것임을 알려줄 수 있습니다.
- 아래와 같은 템플릿으로 데코레이터를 작성해야합니다.
    ```python
    def decorator(origin_function):
        @wraps(origin_function)
        def decorated_function(*args, **kwargs):
            # 데코레이터에 의한 수정 작업
            return origin_function(*args, **kwargs)
        return decorated_function
    ```

### 데코레이터 부작용 처리
- 데코레이터 함수로 사용하기 위한 조건은 가장 안쪽에 정의된 함수여야 한다는 것입니다.
- 다음 데코레이터는 문제가 있습니다.
    ```python
    def traced_function_wrong(function):
        logger.info("%s 함수 실행", function)
        start_time = time.time()

        @wraps(function)
        def wrapped(*args, **kwargs):
            result = function(*args, **kwargs)
            logger.info(
                "함수 %s의 실행시간: %.2fs", function, time.time() - start_time
            )
            return result
        return wrapped

    @traced_function_wrong
    def process_with_delay(callback, delay=0):
        time.sleep(delay)
        return callback()
    ```
    - 해당 모듈의 함수를 임포트만 하더라도, 함수가 호출됩니다.
    - 함수를 여러번 호출하면, 처음 임포트하는 시점의 시간을 start_time으로 기억하게 되어, 누적된 시간이 결과가 되어 도출됩니다.
- 데코레이션은 `process_with_delay = traced_function_wrong(process_with_delay)`와 동작이 같습니다. 따라서, 모듈이 임포트될 떄, 이 구문이 실행됩니다.
- 위 문제를 해결하기 위해, 아래와 같이 `start_time` 위치를 함수의 가장 안쪽에 넣어야합니다.
    ```python
    def traced_function_wrong(function):

        @wraps(function)
        def wrapped(*args, **kwargs):
            logger.info("%s 함수 실행", function)
            start_time = time.time()

            result = function(*args, **kwargs)
            logger.info(
                "함수 %s의 실행시간: %.2fs", function, time.time() - start_time
            )
            return result
        return wrapped
    ```

### 어느 곳에서나 동작하는 데코레이터 만들기
- 데코레이터를 만들 때는 일반적으로 재사용을 고려하여 함수뿐만 아니라 메서드에서도 동작하도록 하길 바랍니다.
- 다음은, DB Driver에 따라 쿼리를 수행하는 데코레이터 예제입니다.
    ```python
    class DBDriver:
        def __init__(self, dbstring) -> None:
            self.dbstring = dbstring
        
        def excute(self, query):
            return f"{self.dbstring}에서 쿼리 {query} 실행"
        
    def inject_db_driver(function):
        """데이터베이스 dns 문자열을 받아서 DBDriver 인스턴스를 생성
        """
        @wraps(function)
        def wrapped(dbstring):
            return function(DBDriver(dbstring))
        return wrapped

    @inject_db_driver
    def run_query(driver):
        return driver.excute("test_function")
    ```
    - 메서드는 DB 정보 문자열을 받아서 DBDriver 인스턴스를 생성하고, 함수에 전달합니다.
    - 따라서, `run_query`를 호출할 때 DBDriver 인스턴스를 함께 대입해주지 않아도 됩니다.
- 하지만, 위의 예시의 경우 아래와 같은 클래스를 생성하고 내부 메서드를 사용한다면 오류가 발생합니다.
    ```python
    class DataHandler:
        @inject_db_driver
        def run_query(self, driver):
            return driver.excute(self.__class__.__name__)
    logger.info(DataHandler.run_query("test_fails")) # 오류 발생
    ```
    - 하나의 파라미터만 받도록 설계된 `@inject_db_driver`는 문자열 자리에 self를 전달하고, 두 번쨰 파라미터에는 아무것도 전달하지 않아서 발생하는 에러입니다.
- 따라서, 이와 같은 데코레이터를 사용할 때는 `__get__` 메서드를 구현한 디스크립터 객체를 만들어야 합니다.
    ```python
    class inject_db_driver:
        """문자열을 DBDriver 인스턴스로 변환하여 래핑된 함수에 전달
        """
        def __init__(self, function):
            self.function = function
            wraps(self.function)(self)
        
        def __call__(self, dbstring):
            return self.function(DBDriver(dbstring))

        def __get__(self, instance, owner):
            if instance is None:
                return self
            return self.__class__(MethodType(self.function, instance))
    ```
    - `inject_db_driver` 데코레이터를 함수가 아닌 클래스 형태로 변경하였습니다.
    - 인스턴스에 `function`을 동적으로 bind하여 리턴한 결과를 `__class__`로 다시 래핑합니다.
    - 이를 사용하려는 클래스에 클래스 변수로 넣어주면, 호출될 때 `__get__`을 호출합니다.

### 데코레이터와 관심사 분리
- 코드 재사용이란, 함수 및 클래스는 최소한의 책임을 가져서 오직 한 가지 일만 해야합니다. 컴포넌트가 작을수록 재사용성이 높아집니다.

```python
def traced_function(function):
    @functools.wraps(function)
    def wrapped(*args, **kwargs):
        logger.info("%s 함수 실행", function.__qualname__)
        start_time = time.time()
        result = function(*args, **kwargs)
        logger.info(
            "함수 %s 처리 소요시간 %.2fs",
            function.__qualname__,
            time.time() - start_time
        )
        return result
    return wrapped
```
- 위 함수는 어떤 함수가 호출되었는지 기록할 뿐 아니라, 함수의 소요시간을 함께 측정합니다.
- 따라서, 한 가지 경우만 원할 때에도 두 가지 기능 모두를 사용해야합니다.

```python
def log_excution(function):
    @functools.wraps(function)
    def wrapped(*args, **kwargs):
        logger.info("started execution of %s.", function.__qualname__)
        return function(*args, **kwargs)
    return wrapped

def measure_time(function):
    @functools.wraps(function)
    def wrapped(*args, **kwargs):
        start_time = time.time()
        result = function(*args, **kwargs)

        logger.info(
            "function %s took %.2fs",
            function.__qualname__,
            time.time() - start_time
        )
        return function(*args, **kwargs)
    return wrapped

@measure_time
@log_excution
def operation():
    ...
```
- 위와 같이 재사용성이 더 높은 두 가지 데코레이터로 나누어 구현할 수 있습니다.
- 이 때, 데코레이터가 적용되는 순서도 중요합니다.

### 좋은 데코레이터란?
- 캡슐화와 관심사의 분리: 실제로 하는 일과 데코레이팅하는 일의 책임이 명확히 구분됩니다. (데코레이터의 클라이언트는 데코레이터 함수를 블랙박스로 생각하게 됩니다.)
- 독립성: 데코레이터의 동작은 독립적이며, 데코레이팅되는 객체와 최대한 분리되어야 합니다.
- 재사용성: 데코레이터는 하나의 함수 인스턴스에만 적용되는 것이 아닌, 여러 유형에 적용 가능되도록 만들어야합니다.(데코레이터가 함수의 역할을 하는 경우도 있음)

