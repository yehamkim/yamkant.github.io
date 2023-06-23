### NoSQL
**RDB의 단점은 무엇일까?**
- 스키마가 경직되어있고 변경에 유연하지 않기 때문에, 새로운 기능이 생성될 때마다 컬럼을 추가해야하여 스키마를 변경해야합니다.
- 스키마 변경을 할 때마다, DB와 connection을 맺고 있는 server들에 영향을 미칠 수도 있습니다.
- 결론적으로, RDB는 스키마를 생성하고, 그 스키마에 맞추어 데이터를 저장해야한다는(유연하지 않다는) 단점이 있습니다.
- RDB의 기본 철학은 중복제거를 허용하지 않는 것이기 때문에, 중복을 제거하기 위해 정규화를 진행하여 테이블을 분리합니다. 이 때, 데이터들을 함꼐 가져오기 위해서는 `JOIN`을 사용해야하고, DB의 CPU와 메모리를 많이 사용하게 됩니다.
- RDB는 사실 scale-out 하는데 있어, 유연한 DB는 아닙니다. 
- transaction을 통한 ACID는 가능하지만, 이를 보장하려면 DB 서버의 performance에 좋지 않은 영향을 미치게 됩니다.Isolation을 보장하기 위해 전체적인 처리량(throughput - 시간당 처리할 수 있는 트랜잭션의 양)이 줄어든다는 단점이 있습니다.

**NoSQL의 배경과 특징**
**배경**  
- 인터넷 사용량이 늘어나고 글로벌 사용자가 늘어남에 따라, high-throughput이 요구되었습니다.
- 기존과 다른 비정형 데이터가 증가하게 됨에 따라, 새로운 형태의 데이터가 발생합니다.
- Not only SQL: 기존의 SQL을 커버할 뿐만 아니라 그 외의 기능들도 커버합니다.
**특징**  
- flexible schema: 기존의 sql에서 지정된 스키마의 형식으로 데이터를 넣는 것이 아닌, JSON 객체 형식으로 데이터를 삽입합니다.
- 이 때, schema에 대한 관리는 SQL처럼 RDBMS에서 해주는 것이 아닌 application 레벨에서 해주어야합니다.
- 중복을 허용하므로써 `JOIN`을 회피합니다. 하지만, 중복된 데이터들이 모두 최신 데이터를 유지할 수 있도록 application 레벨에서 관리해야합니다.
- scale-out이 쉽기 때문에, 여러대의 서버(각각의 서버에 데이터를 나누어 저장합니다.)를 사용하여 하나의 클러스터를 구성합니다.
- RDB의 경우에는 서버가 나뉘게 되면 데이터도 분리되고, 각 데이터를 `JOIN`하기 위해 또한 추가적인 트래픽이 발생하게 될 것입니다.
- ACID의 일부를 포기하고 high-throughput, low-latency를 추구합니다. 따라서 안정성을 확보하기에는 불리하므로 금융 시스템 처리와 같이 Consistency가 중요한 환경에서 사용하기 조심스럽습니다.

**Redis의 특징**
- in-memory key-value database: 메모리를 사용하여 key-value 형태로 값을 저장하는 DB입니다. 보통 DB보다 메모리나 캐시로 많이 사용합니다.
- value의 data type: strings, lists, sets hashes, sorted sets 등 다양한 형태를 지원합니다.
- hash-based sharded cluster
- High Availability (replication, automatic failover)
- 보통 Frontend에서 데이터를 요청하고, Backend Server에서 DB의 데이터를 받아옵니다. 트래픽이 많아짐에 따라 DB에 connection 하는 비용이 많이 들게 되므로 redis를 Backend Server와 DB Server 사이에 두어 캐싱하는데 많이 사용합니다.
- memory cache: 저장할 데이터를 key-value 형태로 저장하며 보관하는 시간을 같이 기록합니다. memory를 사용하기 때문에 DB에 속도가 비해 매우 빠릅니다.
