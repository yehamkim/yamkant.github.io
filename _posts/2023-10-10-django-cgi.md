---
layout: archive
title:  "[Django] web server, was, cgi, wsgi, asgi"
date:   2023-09-24 00:05:07 +0900
categories: 
    - Django Strategy
---

## 각 용어의 정의
### 웹서버
- 인터넷을 통해서 요청된 웹 컨텐츠의 전달을 도와주는 하드웨어와 소프트웨어입니다.
- 웹서버는 기본적으로 '정적'인 파일을 전달합니다.
- 클라이언트가 HTTP 요청을 통해 리소스를 요청하면, 리소스를 그대로 보내줍니다.

### CGI (Common Gateway Interface)
- 웹서버에서 애플리케이션(프로그램, 스크립트)을 동작시키기 위한 인터페이스입니다.
- 정적인 웹서버를 동적으로 기능하기 위해서 등장하였으며, 서버 프로그램과 외부 프로그램 간의 인터페이스가 CGI입니다.
- 기존에는 클리아이언트에서 외부 프로그램이 필요한 요청이 오면 CGI를 통해 외부 프로그램을 실행시켜 요청에 응답하도록 했지만, 현재는 웹서버에 인터프리터를 내장하여 프로세스를 fork해서 외부 프로그램을 실행시키지 않고 내부에서 처리합니다.

### WAS (Web Application Server)
- 동적으로 기능을 하는 웹서버로, Web Server + CGI입니다. 
- 접속자가 많은 경우 CGI 방식보다 애플리케이션 서버 방식의 처리량(Throughput)이 더 좋습니다.
- 만약, 5개의 웹 브라우저가 동일한 프로그램을 요청했을 때 CGI는 5개의 요청에 대한 프로그램을 모두 메모리에 적재합니다.
- 애플리케이션 서버 방식은 메모리에 한번만 적재하여 CGI 방식에 비해 전체적인 메모리 사용량이 적으며, 이는 더 많은 요청을 처리할 수 있음을 의미합니다.

### WSGI(Web Server Gateway Interface)
- 파이썬 애플리케이션, 파이썬 스크립트가 웹서버와 통신하기 위한 인터페이스입니다.
- wsgi는 서버와 게이트웨이, 애플리케이션과 프레임워크 양단으로 니눠져있습니다. wsgi 요청을 처리하려면 서버단에서 `환경정보`와 `콜백함수`를 애플리케이션단에 제공해야합니다.
- 역할
  - 환경변수가 변하면 타겟 URL에 따라서 요청 경로를 지정해줍니다.
  - 같은 프로세스에서 여러 애플리케이션과 프레임워크가 실행됩니다.
  - XSLT 스타일시트를 적용하는 것과 가이 전처리합니다.
- wsgi는 보통 application(=app)이라는 이름의 파이썬 함수를 웹서버에 제공합니다. 해당 함수는 다음 두가지의 매개변수를 전달받습니다.
  - environ: 웹서버가 제공한 환경변수와 현재 요청에 대한 정보가 포함된 Dictionary
  - start_response: 클라이언트로 HTTP 응답을 보내는 작업을 시작하는데 사용하는 함수
  ```python
  def application(environ, start_response):
      start_response('200 OK', [('Content-Type', 'text/plain')])
  return [b'Greetings universe']
  ```
- 방식: 요청 -> 웹서버 -> wsgi server (=middleware) -> Djnago, Flask..
- 단점
  - 한 번에 하나의 요청과 응답만 처리하며, 응답이 즉시 반환된다고 전제합니다. 따라서, 롱폴링 HTTP 연결과 같은 장시간 연결을 처리할 수 없습니다.
  - 동기 전용으로, 멀티스레드 연결풀을 사용하더라도 응답이 반환될 때까지 각 연결이 차단됩니다.

### ASGI
- WSGI와 마찬가지로 파이썬 웹애플리케이션과 웹서버 사이에서 통신하기 위한 인터페이스입니다.
- WSGI와의 차이점은 애플리케이션당 여러 개의 비동기 이벤트를 허용한다는 것이며, 동기앱과 비동기앱 모두를 지원합니다.
- asgi를 사용해 새로운 비동기 웹앱을 구축하는 것뿐만 아니라 오래된 동기 wsgi 웹 앱을 asgi로 마이그레이션할 수도 있습니다.
- wsgi와 다르게 3개의 매개변수를 application에 전달합니다.
  - scope: 현재 요청에 대한 정보가 포함된 Dictionary (wsgi의 environ과 세부 명명규칙이 다름)
  - send: 애플리케이션이 클라이언트로 메시지를 돌려보낼 수 이쏘록 해주는 async callable
  - recieve: 애플리케이션이 클라이언트로부터 메시지를 수신할 수 있도록 해주는 async collable
  ```python
  async def application(scope, receive, send):
  await send({
      'type': 'http.response.start',
      'status': 200,
      'headers': [
          [b'content-type', b'text/plain'],
      ],
  })

  await send({
      'type': 'http.response.body',
      'body': b'Hello, world!',
  })
  ```
  - asgi의 가장 큰 특징은 함수 전반에서 비동기 메타포를 사용한다는 것입니다. 
  - 함수 자체는 async이며 HTTP 헤더와 응답 본문을 별도의 두가지 await send() 명령으로 보냅니다. 따라서, 많은 연결의 application 및 send 호출과 동시에 교차가 가능합니다.
  - receive 역시 async 함수로, 다른 작업을 차단하지 않고도 요청 본문을 받을 수 있습니다.

### ASGI에서 동기 및 비동기 함수 사용하기
- 동기 전용 함수에 대한 장기 실행 호출은 전체 호출 체인을 차단하기 때문에, 비동기 사용의 장점이 사라집니다.
- 따라서, 장기 실행 동기 호출을 쓸 수 밖에 없는 상황이라면, asyncio.run_in_executor를 사용해 스레드 또는 프로세스 풀에 대한 호출을 맡깁니다.
- 예를 들어, Pillow 이미지 라이브러리를 사용하는 경우, run_in_executor를 프로세스 풀과 함께 사용해야합니다.
- 프로세스 간에 데이터를 주고받는 오버헤드가 있지만, run_in_executor는 다른 이벤트를 차단하지 않습니다.

### WSGI, CGI 방식의 차이점
- CGI 서브프로세스는 소켓과 stdout을 포함하여 OS 환경을 상속합니다.
- CGI 서브프로세스가 response를 작성하고, 이를 웹서브로 응답하면 웹서브는 해당 응답을 브라우저로 전송합니다. 
- 대부분의 CGI는 모든 요청마다 서브프로세스를 fork하게 됩니다.

WSGI는 CGI 디자인 패턴에 기반한 인터페이스입니다.
- WSGI는 모든 요청에 대해 서브프로세스를 fork하지 않습니다. 
- HTTP 요청 헤더를 파싱하여 이를 환경에 추가합니다. 
- file-like object로써 POST oriented input을 제공합니다.
- 사용자로 하여금 수많은 format 디테일로부터 해방시키고 response를 만들 수 있는 기능을 제공합니다.

