### Docker networking
Use the Default bridge network
- 아래의 예제에서는 같은 docker host에서 다른 두 개의 alpine 컨테이너를 통해 어떻게 서로 통신하는지 살펴봅니다.
- 만약 docker demon 위에는 기본적으로로,  `bridge`, `host`, `none` 세개의 docker network가 있습니다.
    ```docker
    $ docker network ls
    ```
  - `host`, `none`은 fully-fledged networks는 아니지만 사용을 위해서 host의 networking stack에 직접적으로 연결되거나 네트워크 장비가 없는 컨테이너에서 사용됩니다.
- 어떤 컨테이너들이 연결되었는지 확인하기 위해 bridge network를 다음과 같이 볼 수 있습니다.
    ```docker
    $ docker network inspect bridge
    ```
   -  사이에 gateway의 IP 주소를 포함한 Docker host와 bridge network IP를 볼 수 있습니다.
   -  이는, 직접 컨테이너에 접속해서 `ip addr show`, `hostname -I` 등의 네트워크 분석 명령어를 통해서도 알 수 있습니다.
   -  