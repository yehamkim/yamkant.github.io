---
layout: archive
title:  "[Study] elastic search 사용하기"
date:   2023-10-12 00:05:07 +0900
categories: 
    - Study
---

## 설치 및 간단한 설정
```shell
$ docker pull docker.elastic.co/elasticsearch/elasticsearch:8.7.0
$ docker run -p 9200:9200 -p 9300:9300 \
  --name my-elasticsearch \
  -e "discovery.type=single-node" \
  docker.elastic.co/elasticsearch/elasticsearch:8.7.0
```
- 9200 포트를 통해 엘라스틱 서치에 접속할 수 있도록, 9300 포트를 통해 내부에서 통신하도록 설정합니다.
- 단일 노드로 실행하기 위해 `discovery.type=signle-node` 옵션을 추가합니다.
- https://localhost:9200/으로 접속하면 로그인을 통해 접속 가능합니다.

### elastic search 로그인을 위한 비밀번호 변경
```shell
$ docker exec -it my-elasticsearch /bin/bash
$ elasticsearch@...:~$ bin/elasticsearch-setup-passwords interactive
```
- docker 컨테이너 내부에 접속하여 계정 관련 정보를 수정할 수 있습니다.

## 엘라스틱서치 데이터 삽입/조회/수정/삭제
#### 삽입
- 방식: `PUT <인덱스>/_doc/<도큐먼트번호>`
- 예시
  ```shell
  $ curl  -k -u "elastic:elastic" \
    -H "Content-Type: application/json" \
    -d '{ "id" : "1", "message" : "1번 데이터 입니다." }' \
    -X PUT https://localhost:9200/ksb/_doc/1
  ```

#### 조회
- 방식: `GET <인덱스>/_doc/<도큐먼트번호>`
- 예시: 
  ```shell
  $ curl  -k -u "elastic:elastic" \
    -H "Content-Type: application/json" \
    -X GET https://localhost:9200/ksb/_doc/1
  ```

#### 수정
- 방식: `POST <인덱스>/_update/<도큐먼트번호>`
- 예시: 
  ```shell
  $ curl  -k -u "elastic:elastic" \
    -H "Content-Type: application/json" \
    -d '{ "doc": { "message": "0번 데이터 입니다." } }' \
    -X POST https://localhost:9200/ksb/_doc/1
  ```

#### 삭제
- 방식: `DELETE <인덱스>/_doc/<도큐먼트번호>`
- 예시: 
  ```shell
  $ curl  -k -u "elastic:elastic" \
    -H "Content-Type: application/json" \
    -X DELETE https://localhost:9200/ksb/_doc/1
  ```

#### _bulk API
- 방식: `POST _bulk`
- 얘시: 
  ```shell
  $ echo '
    { "index" : { "_index" : "ksb", "_id" : "1" } }
    { "field1" : "value1" }
    { "delete" : { "_index" : "ksb", "_id" : "2" } }
    { "create" : { "_index" : "ksb", "_id" : "3" } }
    { "field1" : "value3" }
    { "update" : {"_id" : "1", "_index" : "ksb"} }
    { "doc" : {"field2" : "value2"} }

    ' > query.json
  $ curl  -k -u "elastic:elastic" \
    -H "Content-Type: application/json" \
    -X POST https://localhost:9200/_bulk \
    --data-binary @query.json
  ```