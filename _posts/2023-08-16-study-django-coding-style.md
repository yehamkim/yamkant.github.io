---
layout: archive
title:  "[Study] Django - 코딩 스타일"
date:   2023-08-15 00:05:07 +0900
categories: 
    - Django Study
---

### Pre-commit checks
- `flake8` 모듈을 사용하여 코딩 컨벤션을 확인하는 방법도 있습니다.
- `git hook`: git과 관련된 이벤트 발생시, 특정 스크립트를 실행할 수 있도록 하는 기능입니다.
- `pre-commit`은 pre-commit hook들을 관리하는 프레임워크로, 이를 통해 리뷰를 위한 코드 커밋 전, 간단한 이슈들을 확인할 수 있습니다.

### Python style
- 모든 파일은 `black auto-fomatter`를 사용하여 포맷되어야합니다.
- 프로젝트 레포지토리는 `.editorconfig` 파일을 포함해야합니다. 
- 장고 운영진은 whitespace 이슈들을 피하기 위해 `EditorConfig`와 함께 텍스트 에디터를 사용하는 것을 추천합니다. 
- 만약 구체적으로 정한 부분이 없으면 대체적으로, `PEP 8` 따릅니다.
- 스트링 값은 `%-formatting`, `f-string`, `str.format()` 형태로 사용하는 것을 권장합니다. (가독성) 또한, `f-string` 사용시 plain variable로 사용해야합니다.
    ```python
    # Disallowed
    f"hello {get_user()}"
    
    # Allowed
    user = get_user()
    f"hello {user}""
    ```

- camel 표기법 보다 snake 표기법을 권장합니다.
- docstring은 `PEP 257` 스타일을 따릅니다.
- 테스트 수행 시, `assertRaises()`를 사용하기 보다, `assertRaisesMessage()`와 `assertWarnsMessage()`를 사용하여, 예외에 대한 경고 메시지까지 함꼐 봅니다.
- `assertRaisesRegex()`와 `assertWarnsRegex()`는 정규식 매칭이 필요한 경우에만 사용합니다.
- `assertTrue()`와 `assertFalse()` 보다 `assertIs(..., True/False)`를 사용합니다.

### Imports
- `isort` 모듈을 사용하여 import를 자동으로 소팅합니다.
- 아래와 같이 그룹별로 모듈을 묶어서 import 합니다.
    ```python
    # future
    ...
    # standard library
    ...
    # third-party
    ...
    # Django
    ...
    # local Django
    ...
    # try/except
    ...
    ```
- `import ...`만 사용하는 경우를 `from ... import ...`로 모듈을 호출하는 경우들보다 상위에 위치시킵니다.
- 알파벳 순서로 모듈을 호출하는 것을 권장합니다.
- 너무 긴 모듈 호출은 끊어서 구분합니다. (4 space와 trailing comma 사용)

### Template style
- 중괄호 사이의 tag comment들 사이에는 공백을 삽입합니다.
  (`{{foo}} -> {{ foo }}`)

### View style
- view 함수의 첫 번째 파라미터는 `req`가 아닌 `request`로 확실히 표기합니다.

### Model style
- 필드명은 소문자 snake 표기법을 사용하여 정의합니다.
- `class Meta`는 필드 정의 뒤에 single line을 공백으로 둔 후, 정의합니다.
- 모델 메서드의 정의 순서는 아래와 같습니다.
  - All database fields
  - Custom manager attributes
  - `class Meta`
  - `def __str__()`
  - `def save()`
  - `def get_absolute_url()`
  - Any custom method

### `django.conf.settings` 사용하기
- 모듈들은 일반적으로 최상위 레벨의 `django.conf.settings`에 저장된 설정들을 사용하지 않도록 해야합니다.
- 환경변수인 `DJANGO_SETTINGS_MODULE`에 의존하지 않도록 설정해야합니다.
    ```python
    from django.conf import settings
    setting.configure({}, SOME_SETTING="foo")
    ```

