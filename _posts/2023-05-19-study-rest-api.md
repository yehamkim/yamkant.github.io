---
layout: archive
title:  "[Study] rest api란 무엇인가?"
date:   2024-05-13 20:05:07 +0900
categories: [Study]
---

참고
- 코맹탈출님: https://youtu.be/HmvNuI0Ku9I

**API란 무엇인가?**
- API는 Application Programming Interface의 줄임말로, 두 소프트웨어가 서로 communication 하는 방법을 설명한 규약입니다.
- API를 사용함으로써, 회사의 데이터와 기능을 내외부 개발자들이 사용 가능하도록 합니다.
- 일반적으로 Internal API는 `RPC API`로, External API는 `HTTP API`로 구축합니다.
  (참고: 구글에서 개발한 대표적인 RPC API framework는 gRPC라고 합니다.)
- HTTP 프로토콜을 통해 resouce의 create(POST), read(GET), update(PATCH/PUT), delete(DELETE) 기능을 지원합니다.

**RESTFUL API란 무엇인가?**  
- web API의 한 종류로, REST 디자인 원리를 따르는 API를 RESTFUL 하다고 합니다.  
    (REST: Representational State Transfer Architectural Style)
- 개발자에게 높은 자유도를 보장하며, 그 자유도 덕분에 여러 Component들을 연결하거나 Microservices architecture에서 많이 사용됩니다.
- Client(요청 주체), Server(제공 주체), Resource(요청 및 제공 자원), Represntation(제공 형태)가 포함된 구성으로 설명할 수 있습니다.  
    즉, Client가 Server를 통해 Resource를 요청하면 Server가 JSON/XML 등의 형태로 Representation 하여 제공합니다.

**Resource-oriented design** . 
- API를 디자인할 때 사용하는 패턴 중 하나로, 다음과 같은 특징을 가집니다.
  - API 빌딩블록이 resource와 resource 사이의 관계로 형성되어 있습니다.
  - 몇 개의 standard method들을 사용해서 대부분의 operation을 처리하며, custom method를 사용할 수 있습니다.
  - 각각의 request가 독립적인 Stateless protocol이어야 합니다.
- 따라서, RESTFUL API와 비슷한 부분이 많습니다.

**API 디자인 시 고려해야할 사항**
- API가 얼마나 많은 양의 resource를 처리하는지
- resource들 사이에 어떤 관계가 있는지(domain 특성 파악)
- resource들의 스키마와 필드가 어떻게 되어있는지
- 각각의 resource가 지원하는 method의 종류

**RESTFUL API Design Principles**
- Client-server decoupling
  - client와 Server가 완벽히 decouple 되어야 하며, client가 알아야할 유일한 정보는 resource의 URI입니다.
  - 마찬가지로, server 또한 받은 request에 대한 response만 보낼 수 있어야 합니다.
- Stateless
  - 각각의 request의 처리를 위한 모든 정보를 server가 가지고 있어서, 각 request에 의존적이지 않고 독립적이어야 합니다. 즉, 같은 resource에 대한 request는 항상 같은 ressponse를 주어야 합니다. 
  - 따라서, server side session이 필요 없을 뿐만 아니라, server는 client의 request에 관련된 정보를 저장할 수 없습니다.
  - stateless한 상황이라면 유지 및 보수가 편리합니다. 서버가 down 되더라도, 다른 server로 대체할 수 있습니다.
  - 또한, 디버깅에 용이합니다. stateful한 상황이라면, 실패한 request를 분석할 때 같은 환경을 구축하여 테스트해 보기가 어렵게 됩니다.
- Uniform interface
  - 한 resource에 대한 데이터는 모두 같은 URI(Uniform Resource Identifier)에 있어야 합니다. 
  - 같은 resource에 대한 request는 항상 같아야 하며, resource는 client가 필요한 최소한의 데이터만을 가져야 합니다.
  - 해당 규칙을 지키면, 각각의 API의 구동 방식이 거의 동일하며 resource의 종류와 data의 내용만 다르게 될 것입니다.
- Cacheablilty
  - client나 server 측에서 resource를 cache할 수 있도록 해야 합니다.
  - 이때, server response에 전송된 resource에 대해 caching이 허용되는지 여부에 대한 정보를 포함해야 합니다.
  - client의 성능을 개선하고 server의 확장성을 높이는 것이 목표입니다.
- Layered system architecture
  - Restful API의 호출 및 응답은 서로 다른 계층을 통해 이루어질 수도 있으며, client와 server는 어떤 계층에서 통신하는지 상관 없습니다.
- Code on demand (optional)
  - 일반적으로 정적인 resource를 제공해야 하지만, 특정 경우에는 동적인 resource를 제공할 수 있습니다.