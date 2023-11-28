---
layout: archive
title:  "[FastAPI] FastAPI란 무엇일까"
date:   2023-11-28 00:05:07 +0900
categories: [FastAPI]
---

## FastAPI Arcitecture
- Python 3.6이상을 지원합니다.
- 표준 Python type hint 기반으로 합니다.
- 파이썬에서는 async를 지원하는 저수준의 웹프레임워크, 어플리케이션 서버가 없었습니다.
- Uvicorn은 uvloop, httptools를 사용하는 asgi 기반의 웹서버이며, fastapi는 uvicorn 위에서 실행되는 stalette 서버 기반으로 동작합니다.
- 즉, fastapi는 asgi가 구현된 stalette을 추상화하여 구현한 프레임워크입니다.

### Uvicorn
- Uvicorn은 ASGI 서버로, 비동기 작업을 수행 가능하도록하는 파이썬 WAS입니다. 내장 모듈로 uvloop를 사용합니다.
  (ASGI: asyncronous server gateway interface)

#### wsgi
- wsgi의 기본 동작은 app이라고 불리는 파이썬 함수를 웹서버에 드러내는 것입니다. 
- environment와 클라이언트로 HTTP 응답을 보내는 작업을 시작하는데, `start_response`라는 함수를 매개변수로 받아서 응답을 반환하게 됩니다.  
  (`start_response`의 인수: 표준 HTTP의 상태값(string)인 `status`, 응답 헤더(list[key-value])가 들어있는 `response_headers` 콜백)
- 이 때, 기존 웹소켓이나 http 롱폴링 연결을 처리하기 위한 지속적 연결이 불가능하며, 동기 전용의 연결만 가능하다는 단점이 있습니다.

#### asgi
- 표면적으로는 wsgi와 비슷하지만, 아래의 매개변수들을 받게 됩니다.
    - scope: [여기](https://github.com/django/asgiref/blob/main/specs/www.rst)에 명시된 값들을 설정할 수 있습니다.
    - send: application이 클라이언트로 메시지를 돌려보낼 수 있도록 하는 async collable입니다.
    - receive: 메시지를 수신할 수 있도록 해주는 async collable입니다.
- 함수 전반에서 비동기 메타포를 사용합니다. 함수 자체가 async이고, http 헤더와 응답 본문을 두개의 별도의 await send 명령어로 보내게 됩니다.
- 동기식 메서드를 사용할 떄와 다르게 함수 자체와 함수의 send 명령이 아무것도 차단을 하지 않고 동시에 교차 가능한 호출을 수행하도록 합니다.

### uvloop
- uvloop는 async I/O를 대체하기 위해서 만들어졌습니다.
- async I/O: 파이썬 표준 라이브러리와 함께 제공되는 비동기 I/O 프레임워크로 async, await 구문을 사용하여 비동기 코드를 작성하는데 사용하는 라이브러리입니다.  
  (대규모 I/O 처리, 복잡하게 설계된 서버 구조에 적합합니다.)
- 따라서 `uvicorn > uvloop > libuv > cython | (h11, httptools)`와 같은 계층으로 구현되어있습니다.
- uvicorn은 Node.js처럼 다양한 콜백으로 관리되기 보다, 네트워크 I/O 위주로 콜백을 관리하는 구조입니다.

### Pydantic
- 파이썬에서 다루는 어노테이션을 사용하여 데이터를 검증하고 타입힌트를 주는 라이브러리입니다.
- API 서버에 전달받는 데이터를 검증하는 방식으로 주로 사용합니다.
- 주요기능은 데이터 유효성 검증 및 데이터 파싱으로, `BaseModel`을 통해 입력 데이터를 직접 보장하는 것이 아니라 입력을 받은 후 비교하므로써, 데이터의 형식과 제약 조건을 보장합니다.
- Python Dictionary 형태를 pydantic 모델로 변환 시키기도 하고, ORM 모델을 추가하여 SQLAlchemy와 같은 ORM 형태의 데이터를 pydantic 모델로 변환할 수도 있습니다.
- `dataclass`의 경우 데이터를 담기 위한 클래스의 역할에만 충실할 뿐, 데이터 유효성 검사나 파싱까지는 담당하지 않습니다. 반면, pydantic은 데이터 검증을 위한 도구이며, 추가적인 validation, nested validation이 가능하며 속도가 빠릅니다.

### Deployment Concept
- 배포의 궁극적인 목적은 안전한 방식으로 API 클라이언트에게 서비스를 제공하고, 중단을 방지하며 컴퓨팅 리소스를 최대한 효율적으로 사용하는 것입니다.
- 프로세스 매니저는 어플리케이션을 띄우면 해당 IP와 Port를 수신하며, 이 프로세스는 모든 통신을 받아 작업자 프로세스들로 전송하게 됩니다.
- 작업자 프로세스는 어플리케이션이 실제로 실행되는 프로세스로, 요청을 수신하여 처리하고 그에 대한 응답을 반환하며 램에 올라간 변수에 넣은 값들을 관리하는 역할을 합니다.
- 각 프로세스가 사용하는 CPU의 비율은 변동폭이 크지만, 메모리는 비교적 안정적으로 유지됩니다. 따라서, 안정적인 배포나 복구 전략을 세우기 위해 이러한 개념을 이해해야합니다.
- uvicorn 워커를 관리하는 gunicorn의 구성, 쿠버네티스와 같은 분산 컨테이너 시스템, 클라우드 서비스를 사용하는 방법등을 사용하여 배포 전략을 세워야합니다.

## 참고
- [nitro04 님의 블로그](https://nitro04.blogspot.com/2020/01/django-python-asgi-wsgi-analysis-of.html)
- [asgi specification](https://github.com/django/asgiref/blob/main/specs/asgi.rst)
- [정보람님 키노](https://youtu.be/9Qe84CQ1XVo?si=z9GoJ0geDQ5y3zE-)