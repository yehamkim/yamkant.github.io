---
layout: archive
title:  "[Study] 개발 용어 정리"
date:   2024-08-16 00:05:07 +0900
categories: 
    - Study
---

### APM
- Application Performance Management의 줄임말로, 응용 소프트웨어의 성능과 서비스 이용성을 감시하고 관리하는 시스템 관리 방법론입니다.
- 운영 중인 시스템의 성능을 모니터링하고 분석하여, 시스템의 가용성 및 안정성을 돕습니다.

### Feign 
- Spring Boot 진영에서 사용하는 Netflix의 오픈소스입니다.
- 선언적 방식(어노테이션 사용)으로 외부 API를 RESTful하게 호출할 수 있도록 추상화하여 제공합니다.
- interface와 annotation만으로 HTTP API 클라이언트를 구현합니다.
- 세부적인 내용 없이 사용할 수 있기 때문에, 코드 복잡도가 낮습니다.


### Redis 분산락
- 레디스 클라이언트는 레디스 서버에 연결하여 레디스 데이터 구조를 조작할 수 있도록 해줍니다.
- 서버 개발자는 cli가 아닌 코드 상에서 레디스에 접근해서 데이터를 다룰 수 있어야 하고, Java 용 Redis 클라이언트 라이브러리는 Lettuce, Redisson, jedis 등이 있습니다.
  - Lettuce: 비동기 및 논블로킹 IO를 지원합니다. 레디스 클러스터 지원.
  - Redisson: 비동기 및 논블로킹 IO를 지원합니다. 분산락, 분산집합, 분산맵 등 다양한 분산 기능 제공

**분산락**  
- 서로 다른 프로세스(또는 스레드)가 상호배타적(mutually exclusive)인 방식으로 공유 자원을 처리해야하는 환경에서 유용한 기술입니다.
- 구현 방법에는 DB, Redis, ZooKeeper를 이용하는 방법이 있으며, 휘발성이고 간단한 데이터이기 때문에 보통 Redis로 구현합니다.

