---
layout: archive
title:  "[Django] Channels란 무엇일까?"
date:   2023-09-24 00:05:07 +0900
categories: 
    - Strategy
---

## Channels 모듈이란?
- Django에서 기본적으로 제공하는 비동기 뷰를 감싸서 Django가 HTTP 뿐 아니라 웹소켓, 챗봇, 라디오 등의 프로토콜을 처리할 수 있도록 합니다.
- 이는 Django의 동기적인 방식과 양립할 수 있고, 원하는 방식으로 작성할 수 있습니다.
- 인증, 세션 시스템과 통합될 수 있고, HTTP 용으로 개발된 프로젝트를 다른 프로토콜로 쉽게 확장할 수 있습니다.
- 이벤트 주도의 구조를 Channel Layer를 이용해 다루며, Channel Layer는 여러 프로세스 간의 통신을 용이하게 만들면서 프로젝트를 여러 개의 프로세스로 나눌 수 있도록 합니다.

## Channels 동작 원리
### Tutles All The Way Down
- Consumers는 채팅 메시지나 알림을 처리하는 독립적인 요소로, Channels는 기본적인 컨슈머를 작성하고, URL 라우팅에 연결하고 프로토콜을 감지하는 등의 기능을 제공합니다.
- HTTP와 기존 Django의 애플리케이션을 구성요소로 활용하여, 기존의 코드를 유지한 상태로 HTTP Long-Polling이나 웹소켓을 함께 처리할 수 있습니다.
- URL 라우팅, 미들웨어 모두 ASGI의 애플리케이션입니다.

### Scopes와 Event
- Channels와 ASGI는 들어오는 연결을 두 개의 컴포넌트(스코프, 이벤트들의 리스트)로 분리합니다.

스코프
- 하나의 연결에 대한 상세 설명들의 집합입니다. 
- 요청이 발생한 URL, 웹소켓이 열린 IP 주소, 유저 정보등으로 구성됩니다.
- 연결이 종료될 때까지 유지됩니다.
- HTTP의 경우, 스코프는 하나의 요청동안만 유지되지만, 웹소켓의 경우에는 소켓의 수명 전체에 걸쳐 유지됩니다.
- 예를 들어, 챗봇 프로토콜은 챗 프로토콜이 상태를 갖지 않더라도 대화가 종료될 때까지 스코프가 유지됩니다.

이벤트
- 스코프의 수명 동안 여러 이벤트들이 발생하며, 이는 유저와의 상호작용을 나타냅니다.
- HTTP 요청을 보내거나 웹소켓 프레임을 전송하는 일들입니다.
- ASGI 애플리케이션은 매 스코프마다 개별 인스턴스화되고, 해당 스코프 안에서 발생하는 이벤트들을 차례로 처리합니다.

HTTP 예시
1. 유저가 HTTP 요청 전송
2. HTTP의 타입 스코프를 요청 URL, 메서드, 헤더 등을 담아서 생성
3. http.request 이벤트를 HTTP body 데이터와 함께 전송
4. Channels(or ASGI 애플리케이션)이 이를 처리해 http.response 이벤트를 생성, 브라우저에 응답 및 연결 종료
5. HTTP 요청/응답 완결, 스코프 삭제

챗봇 예시
1. 유저가 챗봇에게 첫번째 메시지 전송
2. 유저의 ID, 이름, 유저명이 담긴 스코프 생성
3. 애플리케이션이 chat.received_message 이벤트를 텍스트 데이터와 함께 수신
4. 유저가 챗봇에게 메시지를 수차례 전송하며 chat.received_message 이벤트들이 생성
5. 제한시간이 지나거나 애플리케이션 프로세스 재시작시 스코프 삭제

### 컨슈머
- Channels의 기본적인 단위요소로, 이벤트를 받습니다.
- 요청이나 새로운 소켓 요청이 들어오면, Channels는 라우팅 테이블을 찾아 해당 연결에 대한 적절한 컨슈머를 찾고, 인스턴스를 만들어 처리합니다.
- View와는 달리, 스코프가 종료되기까지 더 긴 수명을 갖도록 설계되었습니다.

#### 코드로 보는 예시
```python
class ChatConsumer(WebsocketConsumer):

    def connect(self):
        self.username = "Anonymous"
        self.accept()
        self.send(text_data="[Welcome %s!]" % self.username)

    def receive(self, *, text_data):
        if text_data.startswith("/name"):
            self.username = text_data[5:].strip()
            self.send(text_data="[set your username to %s]" % self.username)
        else:
            self.send(text_data=self.username + ": " + text_data)

    def disconnect(self, message):
        pass
```
- 각 종류의 프로토콜에서는 서로 다른 타입의 이벤트들이 발생하며, 각 타입은 서로 다른 메서드로 구분됩니다.
- 이벤트에 따라 처리하는 코드를 작성하면, Channels가 이들을 스케쥴링하고 병렬적으로 작동시키는 역할을 담당합니다.
- 내부적으로 Channels는 완전히 비동기적인 이벤트 루프를 실행합니다.

#### 동기적인 처리 예시
```python
class LogConsumer(WebsocketConsumer):

    def connect(self, message):
        Log.objects.create(
            type="connected",
            client=self.scope["client"],
        )
```
#### 비동기적인 처리 예시
```python
class PingConsumer(AsyncConsumer):
    async def websocket_connect(self, message):
        await self.send({
            "type": "websocket.accept",
        })

    async def websocket_receive(self, message):
        await asyncio.sleep(1)
        await self.send({
            "type": "websocket.send",
            "text": "pong",
        })
```

### 라우팅, 프로토콜들
- 라우팅을 활용하여 경로마다 기능별로 컨슈머를 사용하도록 할 수 있습니다.
- 각각의 프로토콜을 목적에 따른 이벤트들로 분리하여 처리할 수 있도록 합니다.
#### 코드 예시
```python
class ChattyBotConsumer(SyncConsumer):

    def telegram_message(self, message):
        """
        Simple echo handler for telegram messages in any chat.
        """
        self.send({
            "type": "telegram.message",
            "text": "You said: %s" % message["text"],
        })
```

```python
class ChattyBotConsumer(SyncConsumer):

    def telegram_message(self, message):
        """
        Simple echo handler for telegram messages in any chat.
        """
        self.send({
            "type": "telegram.message",
            "text": "You said: %s" % message["text"],
        })
```

```python
application = ProtocolTypeRouter({

    "websocket": URLRouter([
        url(r"^chat/admin/$", AdminChatConsumer.as_asgi()),
        url(r"^chat/$", PublicChatConsumer.as_asgi()),
    ]),

    "telegram": ChattyBotConsumer.as_asgi(),
})
```

## 프로세스간 통신
- 표준 WSGI 서버와 같이, 애플리케이션은프로토콜 이벤트들을 서버 프로세스 안에서 처리합니다.
- 애플리케이션으로 들어오는 소켓이나 연결은 애플리케이션 인스턴스에 의해 처리됩니다. 애플리케이션 인스턴스는 호출되고, 클라이언트에게 다시 데이터를 직접 보내줍니다.
- 복잡한 애플리케이션을 구성하다보면 서로 다른 애플리케이션 인스턴스들 간의 통신이 필요한 경우가 생깁니다.