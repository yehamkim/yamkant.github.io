---
layout: archive
title:  "[Server] AWS ECS를 사용한 기본적인 배포환경 구성"
date:   2023-05-12 16:05:07 +0900
categories: 
    - Server
---

### 최종 목표
- ECS 내에서 nginx와 django를 사용한 서버 구성
- 참고: [git repository](https://github.com/yamkant/aws-ecs) - 구체적인 코드 및 이미지를 볼 수 있습니다.
- 이 후 포스팅: VPC 구성 / ALB 구성 / Network Bridge 모드에서 Namespace 사용

**순서**
1. AWS ECS CLI 설치 및 계정 생성
2. Docker 구성 및 테스트
3. ECR 생성 및 업로드 
4. ECS 클러스터 생성 및 서비스 생성

### AWS ECS CLI 설치 및 계정 생성
- aws ecs를 위한 CLI를 설치합니다.
    ```sh
    # aws ecs를 위한 CLI를 설치합니다.
    $ curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
    $ sudo installer -pkg AWSCLIV2.pkg -target /
    ```

- AWS CLI에 접근하기 위해 아래 값들을 설정합니다.
    ```sh
    $ aws configure
    AWS Access Key ID [None]: ACCESS_KEY_ID
    AWS Secret Access Key [None]: SECRET_ACCESS_KEY
    Default region name [None]: ap-northeast-2
    Default output format [None]: json
    ```
- configure 설정이 끝나면 `~/.aws/credentials` 폴더가 생성됩니다.

- ECS CLI를 사용하기 위해 IAM 권한을 가진 계정을 생성합니다.  
  (위에서 configure에 등록한 계정은 `iam:CreateUser` 권한 필요 - `IAMUserFullAccess` 정책을 부여했습니다.)
    ```sh
    $ aws iam create-user --user-name ecs-user
    > "Arn": "arn:aws:iam::301869408653:user/ecs-user"

    $ aws iam create-access-key --user-name ecs-user
    > "AccessKeyId": "AKIAUMSGRUGGXHHX6257",
    > "SecretAccessKey": "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"

    # ECS 접근을 위한 정책들을 설정합니다.
    $ aws iam attach-user-policy \
        --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess --user-name ecs-user
    $ aws iam attach-user-policy \
        --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess --user-name ecs-user
    $ aws iam attach-user-policy \
        --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess --user-name ecs-user

    # 아래 json 파일을 생성한 후, 해당 경로에서 명령어를 실행하여 정책을 추가합니다.
    $ aws iam create-policy --policy-name ecsUserPolicy --policy-document file://ecs-user-policy.json
    > "PolicyId": "ANPAUMSGRUGG5Z2CWN5G3",
    > "Arn": "arn:aws:iam::301869408653:policy/ecsUserPolicy",

    $ aws iam attach-user-policy \
        --policy-arn arn:aws:iam::301869408653:policy/ecsUserPolicy \
        --user-name ecs-user
    
    # 위에서 생성한 ecs-user로 access key와 secret key를 등록하여 다시 인증합니다.
    $ aws configure
    ```
    ecs-user 추가적인 권한 설정을 위한 정책
    ```
    # ecs-user-policy.json
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": "arn:aws:iam::301869408653:role/ApplicationAutoscalingECSRole"
        }, {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeAddresses",
                "ec2:AllocateAddress",
                "ec2:DescribeInstances",
                "ec2:AssociateAddress"
                "ecr:CreateRepository"
            ],
            "Resource": "*"
        }]
    }
    ```

### Docker 구성 및 ECR 업로드
**간단한 설명**
- ecs에서의 최소 단위는 "태스크"이며, 하나의 태스크 내에는 다수의 이미지 파일을 사용할 수 있습니다.
- 하나의 "태스크"를 구성할 때 빌드시킬 도커 이미지는 ECR이라고 하는 저장소에 push 해야합니다.

**ECR 등록 및 업로드**
- ECR 로그인
    ```sh
    $ aws ecr get-login-password  \
        --region ap-northeast-2 | docker login --username AWS \
        --password-stdin 301869408653.dkr.ecr.ap-northeast-2.amazonaws.com
    ```
- ECR Repository 생성
    ```sh
    $ aws ecr create-repository --repository-name my-web
    > "repositoryUri": "301869408653.dkr.ecr.ap-northeast-2.amazonaws.com/my-web"
    $ aws ecr create-repository --repository-name my-nginx
    > "repositoryArn": "arn:aws:ecr:ap-northeast-2:301869408653:repository/my-nginx"
    ```
- [Docker 구성 및 테스트](https://github.com/yamkant/aws-ecs/tree/main/srcs/ecr)를 참고하여 ecr 업로드 전 실행을 확인합니다.
- ECR 등록을 위한 이미지 태깅 및 docker push. 결과: [ECR 이미지 구성 예시](https://github.com/yamkant/aws-ecs/blob/main/srcs/images/ecs-ecr-setting.png)
    ```sh
    # nginx 이미지 태그 및 업로드
    $ docker tag my-nginx:latest 301869408653.dkr.ecr.ap-northeast-2.amazonaws.com/my-nginx:latest
    $ docker push 301869408653.dkr.ecr.ap-northeast-2.amazonaws.com/my-nginx:latest

    # web 이미지 태그 및 업로드
    $ docker tag my-web:latest 301869408653.dkr.ecr.ap-northeast-2.amazonaws.com/my-web:latest
    $ docker push 301869408653.dkr.ecr.ap-northeast-2.amazonaws.com/my-web:latest
    ```

### ECS 클러스터 및 서비스 구성
[ECS cluster 생성 예시](https://github.com/yamkant/aws-ecs/blob/main/srcs/images/ecs-cluster-setting.png)
- 빠른 구현을 위해 `VPC`는 기본으로, EC2를 이용한 서버 구성으로 진행합니다. (프리티어 사용 가능)
- 일정 시간이 지나고, 클러스터가 생성된 직 후, EC2 대시보드를 보면 인스턴스도 함께 생성됩니다.
- 새로 생성된 인스턴스 특징: `IAM: ecsInstanceRole`, `AMI: ami-ecs`, `ASG(Auto Scailing Group) 설정됨`, `기본 보안 그룹 설정`
- 따라서, 만약 ECS에 등록된 인스턴스를 추가하고자 하면, 위의 설정을 그대로 EC2를 생성하면 됩니다.

### 태스크 정의 생성 (host 모드)
**컨테이너 - 1**
- 이름: web
- 이미지 URI: 301869408653.dkr.ecr.ap-northeast-2.amazonaws.com/my-web 
- 컨테이너 포트: 8000
- 환경 파일 추가: S3에서 호스팅된 파일의 ARN 경로를 기입합니다.

**컨테이너 - 2**
- 이름: nginx
- 이미지 URI: 301869408653.dkr.ecr.ap-northeast-2.amazonaws.com/my-nginx  
- 컨테이너 포트: 80

**환경, 스토리지, 모니터링 및 태그 구성**
- 앱 환경: Amazon EC2 인스턴스
- CPU: 0.125 vCPU / 메모리: 0.25 GB
- 태스크 실행 역할: ecsTaskExcutionRole
- 네트워크 모드: host

**태스크 정의에 대한 설명**
- ecs의 네트워크 모드를 host로 하면, 태스크 정의 내의 모든 컨테이너는 host의 네트워크와 같은 주소를 가집니다.
- 따라서, nginx 내에서 127.0.0.1:8000으로 `web` 컨테이너와 통신할 수 있습니다.
- 태스크 실행 역할의 경우, 처음 생성할 때 자동으로 부여됩니다. S3를 사용하기 위해서는 접근 권한이 필요한데, `ecsTaskExcutionRole` 역할에 `AmazonS3FullAccess` 정책을 추가할 수 있습니다.

### 서비스 생성 (EC2 인스턴스 기반)
**환경**
- 컴퓨팅 옵션: 시작유형
- 시작 유형: EC2

**배포 구성**
- 애플리케이션 유형: 서비스
- 패밀리: 위에서 생성한 태스크 정의
- 서비스 유형: 복제본

**서비스 생성에 대한 설명**
- 시작유형을 EC2로 하는 기본적인 서비스를 실행합니다.
- 서비스 연결을 통한 네임스페이스 사용과 로드밸런싱 추가 부분은 위 동작이 정상적으로 작동하면 추가하는 방식으로 진행합니다.
- 생성이 완료되면, 태스크가 동작하고 있는 EC2에 연결하여 `docker` 관련 명령어를 통해 상태를 모니터링 할 수 있습니다.
- 또한, 해당 EC2의 보안 그룹에 설정된 인바운드 규칙에 따라 포트가 개방되며, EC2의 퍼블릭 IP로 서비스가 호스팅하는 웹사이트에 접속 가능합니다.
