---
layout: archive
title:  "[Study] Python Clean Code - Descriptor"
date:   2023-07-19 10:05:07 +0900
categories: 
    - Study
---
## 테스트 모킹

### Mocking 이란?
- 외부 API(타사 Open API 및 DB 등)에 의존하는 코드를 테스트하기 위해 사용합니다.
- 의존적인 부분을 임의의 가짜 결과물로 대체하여 독립적으로 실행하는 테스팅 기법입니다.
- 

### Mocking 사용하기
Django에서는 아래와 같이 `unittest.mock` 모듈을 이용하여 모킹을 사용할 수 있습니다.

**기본적인 Mock 인스턴스 사용 방법**
```python
from unittest.mock import Mock, MagicMock, call
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

#1
mock = Mock(return_value="Run mock!")
logger.info(mock())
mock.return_value = "Modified mock!"
logger.info(mock())

#2
mock = Mock(side_effect=[Exception('Error Case1'), Exception('Error Case2')])
logger.info(mock())

mock = Mock(side_effect=lambda x: logger.info(x))
mock('Print this.')
```
- #1의 경우, return value로 설정해둔 값을 결과값으로 사용할 수 있습니다. 속성 값은 생성 시 외에도, 언제든 변경할 수 있습니다.
- #2의 경우, 경우에 따라 원하는 반환 값을 얻을 수 있도록 설정할 수 있습니다. 속성 값을 list로 지정하는 경우, list 요소가 차례로 출력됩니다.

**Mock의 메서드 사용 방법**
`assert_called_` 관련 메서드를 사용하여 얼마나 호출이 되었는지, 호출될 때 사용한 인자는 무엇인지 검증할 수 있습니다.
```python
mock = Mock()
mock('A', B='C')

#1
logger.info(mock.call_count)
mock.assert_called_once()

#2
logger.info(mock.call_args)
mock.assert_called_with('A', B='C')
```
- #1의 경우, `call_count` 메서드를 통해, 객체의 호출 횟수를 구할 수 있습니다.
- `called_once` 메서드는 mock 객체가 한 번만 호출되었는지 확인합니다.
- #2의 경우, `call_args` 메서드는 mock 객체가 호출될 때 사용한 인자가 무엇인지 출력합니다.
- `called_with` 메서드를 호출시 사용한 인자들과 확인하고자 하는 인자들을 비교합니다.

**MagicMock**
파이썬 객체의 매직 메서드를 모킹하기 위한 클래스입니다.
```python
mock = MagicMock()
mock.__str__.return_value = "Return a magic mock."
logger.info(str(mock))
```
- `Mock` 클래스는 기본적으로 매직 메서드가 자동으로 모킹되지 않습니다.
