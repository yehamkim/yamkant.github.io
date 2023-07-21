---
layout: archive
title:  "[Study] Python Clean Code - Unittest"
date:   2023-07-20 00:05:07 +0900
categories: 
    - Study
---

## Unit Test
- 단위 테스트란, 다른 코드의 일부분이 유효한지를 검사하는 코드입니다.
- 단위 테스트는 소프트웨어의 핵심이 되는 필수적인 기능으로서 일반 비즈니스 로직과 동일한 수준으로 다루어져야합니다.
- 격리: 단위 테스트는 독립적이며, 비즈니스 로직에만 집중합니다. 이전 상태에 관계없이 임의 순서로 실행될 수 있어야합니다.
- 성능: 신속하게 실행되어야 하며, 반복적으로 여러 번 실행될 수 있어야합니다.
- 자체 검증: 실행만으로 결과를 결정할 수 있어야 하며, 이를 위한 추가 단계(종속성)가 없어야합니다.

**추가**
- 통합 테스트: 한 번에 여러 컴포넌트를 테스트하여, 종합적으로 예상대로 잘 동작하는지 검증합니다.
- 통합 테스트의 경우, 부작용이나 격리를 고려하지 않은 채로, HTTP 요청을 하거나 데이터베이스에 연결하는 등의 작업이 수행 가능합니다.

```python
import logging
import unittest
from unittest.mock import Mock
from enum import Enum

logger = logging.getLogger("skeleton")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

class MergeRequestException(Exception):
    pass

class MergeRequestStatus(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING = "pending"
    OPEN = "open"
    CLOSED = "closed"

class MergeRequest:
    def __init__(self):
        self._context = {
            "upvotes": set(),
            "downvotes": set(),
        }
        self._status = MergeRequestStatus.OPEN
    
    def close(self):
        self._status = MergeRequestStatus.CLOSED
    
    @property
    def status(self):
        if self._status == MergeRequestStatus.CLOSED:
            return self._status

        return AcceptanceThreshold(self._context).status()
    
    def _cannot_vote_if_closed(self):
        if self._status == MergeRequestStatus.CLOSED:
            raise MergeRequestException("종료된 머지 리퀘스트에 투표할 수 없음")
    
    def upvote(self, by_user):
        self._cannot_vote_if_closed()

        self._context["downvotes"].discard(by_user)
        self._context["upvotes"].add(by_user)
    
    def downvote(self, by_user):
        self._cannot_vote_if_closed()

        self._context["upvotes"].discard(by_user)        
        self._context["downvotes"].add(by_user)
    
class AcceptanceThreshold:
    def __init__(self, merge_request_context: dict) -> None:
        self._context = merge_request_context

    def status(self):
        if self._context['downvotes']:
            return MergeRequestStatus.REJECTED
        elif len(self._context["upvotes"]) >= 2:
            return MergeRequestStatus.APPROVED
        return MergeRequestStatus.PENDING


if __name__ == "__main__":
    unittest.main()
```
- 위의 클래스 및 테스터는 머지 상황에서, 두 명 이상의 개발자가 upvote를 하거나 한 명이라도 downvote를 하면 머지를 실패하는 경우에 대한 프로그램입니다.
- `AcceptanceThreshold`를 최소 단위로 분리하여 테스트를 진행하고, `MergeRequest` 클래스에서 이를 사용하는 방식입니다. (리팩토링 전에 `AcceptanceThreshold`의 status 메서드가 `MergeRequest` 메서드였음)

**`unittest` 모듈을 사용한 테스트 케이스**
```python
class TestMergeRequestStatus(unittest.TestCase):
    # NOTE: 한 명이 downvote하여, 머지 리퀘스트가 거부된 상황입니다.
    def test_simple_rejected(self):
        merge_request = MergeRequest()
        merge_request.downvote("maintainer")
        self.assertEqual(merge_request.status, MergeRequestStatus.REJECTED)
    
    def test_just_created_is_pending(self):
        self.assertEqual(MergeRequest().status, MergeRequestStatus.PENDING)
    
    # NOTE: 한 명만 upvote를 한 상황에서는 다음 투표를 대기합니다.
    def test_pending_awaiting_review(self):
        merge_request = MergeRequest()
        merge_request.upvote("core-dev")
        self.assertEqual(merge_request.status, MergeRequestStatus.PENDING)

    # NOTE: 두 명 이상이 upvote를 수행하면 승인됩니다.
    def test_approved(self):
        merge_request = MergeRequest()
        merge_request.upvote("dev1")
        merge_request.upvote("dev2")
        self.assertEqual(merge_request.status, MergeRequestStatus.APPROVED)

    # NOTE: 투표함이 닫히면, 더이상 투표를 할 수 없습니다.
    def test_cannot_upvote_on_closed_merge_request(self):
        merge_request = MergeRequest()
        merge_request.close()
        self.assertRaises(
            MergeRequestException, merge_request.upvote, "dev1"
        )
    
    # NOTE: 투표함이 닫히면, 더이상 투표를 할 수 없습니다.
    def test_cannot_downvote_on_closed_merge_request(self):
        merge_request = MergeRequest()
        merge_request.close()
        self.assertRaisesRegex(
            MergeRequestException,
            "종료된 머지 리퀘스트에 투표할 수 없음",
            merge_request.downvote,
            "dev1",
        )

class TestAcceptanceThreshold(unittest.TestCase):
    # NOTE: 테스트 전반에 걸쳐 사용될 데이터 픽스처를 정의합니다.
    def setUp(self):
        self.fixture_data = (
            {"downvotes": set(), "upvotes": set()},
            MergeRequestStatus.PENDING
        ), (
            {"downvotes": set(), "upvotes": {"dev1"}},
            MergeRequestStatus.PENDING
        ), (
            {"downvotes": "dev1", "upvotes": set()},
            MergeRequestStatus.REJECTED
        ), (
            {"downvotes": set(), "upvotes": {"dev1", "dev2"}},
            MergeRequestStatus.APPROVED
        )

    def test_status_resolution(self):
        for context, expected in self.fixture_data:
            # NOTE: subTest: 호출되는 테스트 조건을 표시하는데 사용됩니다.
            #       반복 중 하나가 실패하면, subTest에 전달된 변수의 값을 나타냅니다.
            with self.subTest(context=context):
                status = AcceptanceThreshold(context).status()
                self.assertEqual(status, expected)
```
- `unittest` 모듈을 사용하는 경우, `TestCase` 클래스를 상속받는 테스터 클래스를 생성합니다.
- `Exception` 반환을 테스트하기 위해 `unittest.TestCase.assertRaises`, `unittest.TestCase.assertRaisesRegex` 메서드를 사용할 수 있습니다.
- for 루프를 이용하면, 테스트에서 오류가 발생한 시점에서 멈추게 되지만, `subTest` 메서드를 사용하면 모든 케이스에 대해 테스트를 마치고, 실패 케이스들을 모두 알 수 있습니다.


**`pytest` 모듈을 사용한 테스트 케이스**
```python
# NOTE: MergeRequestStatus
def test_simple_rejected():
    merge_request = MergeRequest()
    merge_request.downvote("maintainer")
    assert merge_request.status == MergeRequestStatus.REJECTED

def test_just_created_is_pending():
    assert MergeRequest().status == MergeRequestStatus.PENDING

def test_pending_awaiting_review():
    merge_request = MergeRequest()
    merge_request.upvote("core-dev")
    assert merge_request.status == MergeRequestStatus.PENDING

def test_approved():
    merge_request = MergeRequest()
    merge_request.upvote("dev1")
    merge_request.upvote("dev2")
    assert merge_request.status == MergeRequestStatus.APPROVED

def test_invalid_types():
    merge_request = MergeRequest()
    pytest.raises(TypeError, merge_request.upvote, {"invalid-object"})

def test_cannot_upvote_on_closed_merge_request():
    merge_request = MergeRequest()
    merge_request.close()
    pytest.raises(MergeRequestException, merge_request.upvote, "dev1")

def test_cannot_downvote_on_closed_merge_request():
    merge_request = MergeRequest()
    merge_request.close()
    with pytest.raises(
        MergeRequestException,
        match="종료된 머지 리퀘스트에 투표할 수 없음"
    ):
        merge_request.downvote("dev1")

# NOTE: AcceptanceThreshold
@pytest.mark.parametrize("context, expected_status", (
    (
        {"downvotes": set(), "upvotes": set()},
        MergeRequestStatus.PENDING
    ), (
        {"downvotes": set(), "upvotes": {"dev1"}},
        MergeRequestStatus.PENDING
    ), (
        {"downvotes": "dev1", "upvotes": set()},
        MergeRequestStatus.REJECTED
    ), (
        {"downvotes": set(), "upvotes": {"dev1", "dev2"}},
        MergeRequestStatus.APPROVED
    )
))
def test_acceptance_threshold_status_resolution(context, expected_status):
    assert AcceptanceThreshold(context).status() == expected_status
```
- pytest에서는 `assert` 비교만으로 단위 테스트를 식별하고 결과를 확인하는 것이 가능합니다.
- 또한, unittest로 작성한 테스트까지 실행하기 때문에 호환성이 좋습니다.
- `pytest.raises`는 `unittest.TestCase.assertRaises`와 동일합니다. `assertRaises`의 경우에는 위와 같이 `match` 파라미터를 사용하여 구현할 수 있습니다.
- `unittest.TestCase.subTest`에서 반복적으로 테스트했다면, pytest에서는 데코레이터를 통해 수행할 수 있습니다. 첫 번째 파라미터는 파라미터의 이름을, 두 번쨰 파라미터는 테스트하고자 하는 값들의 튜플입니다.

### Mock 객체
- 시스템이 서비스 되기 위해서는 외부 서비스(DB, Storage, 외부 API, 클라우드)를 사용하게 됩니다.
- 외부 서비스를 사용하며 발생하는 부작용을 최소화하기 위해 외부 요소를 분리하고, 인터페이스를 사용하여 추상화해야 합니다.
- Mock 객체는 원하지 않는 부작용으로부터 테스트 코드를 보호하는 방법 중 하나입니다.
- 통햅테스트에서는 외부 서비스에 대한 테스트까지를 포함하지만, 단위 테스트에서는 모킹하는 것만으로 원하는 기능 위주로 테스트해야합니다.

**Patch, Mock 사용시 주의사항**
- 간단한 테스트를 작성하기 위해 다양한 몽키패치(런타임 중 코드를 수정하는 것)과 모킹을 해야 한다면, 코드가 좋지 않다는 신호입니다.
- Patch란 import 중에 경로를 지정했던 원본 코드를 Mock 객체로 대체하는 것으로, 런타임 중에 코드가 바뀌고 처음에 있던 원래 코드와의 연결이 끊어집니다.

### Mock 사용
```python
from unittest.mock import MagicMock
from typing import List, Dict

class GitBranch:
    def __init__(self, commits: List[Dict]):
        self._commits = { c["id"]: c for c in commits }
    
    def __getitem__(self, commit_id):
        return self._commits[commit_id]
    
    def __len__(self):
        return len(self._commits)
    
def author_by_id(commit_id, branch):
    return branch[commit_id]["author"]

def test_find_commit():
    branch = GitBranch([{"id": "123", "author": "dev1"}])
    assert author_by_id("123", branch) == "dev1"

def test_find_any():
    mbranch = MagicMock()
    mbranch.__getitem__.return_value = {"author": "test"}
    assert author_by_id("123", mbranch) == "test"
```
- `MagicMock`을 사용해서 `GitBranch` 객체를 모킹합니다. 이 떄, `GitBranch`는 매직메서드를 사용하기 때문에 `MagicMock`을 이용합니다.
- 이 때, `mbarnch`는 `__getitem__`에 대한 반환 값만 지정했기 때문에, `commit_id`에 상관없이 출력값만 테스트합니다.

### 테스트 더블 사용 예시
```python
# mock_2.py
from datetime import datetime

import requests
from constants import STATUS_ENDPOINT

class BuildStatus:
    """Continuous Integration  도구에서의 머지 리퀘스트 상태"""

    @staticmethod
    def build_date() -> str:
        return datetime.utcnow().isoformat()
    
    @classmethod
    def notify(cls, merge_request_id, status):
        build_status = {
            "id": merge_request_id,
            "status": status,
            "built_at": cls.build_date(),
        }
        response = requests.post(STATUS_ENDPOINT, json=build_status)
        response.raise_for_status() # 200이 아닐 경우에 예외 발생
        return response
```
- constants.py 모듈에는 `STATUS_ENDPOINT`를 test@example.com으로 설정해뒀습니다.
- `notify` 메서드는 원하는 endpoint에 post 요청한 결과값을 받아옵니다.

```python
from unittest import mock

from constants import STATUS_ENDPOINT
from mock_2 import BuildStatus

@mock.patch("mock_2.requests")
def test_build_notification_sent(mock_requests):
    build_date = "2023-01-01T00:00:01" # 반환값으로 사용할 build_date
    with mock.patch("mock_2.BuildStatus.build_date", return_value=build_date):
        BuildStatus.notify(123, "OK")
    
    expected_payload = {"id": 123, "status": "OK", "built_at": build_date}
    mock_requests.post.assert_called_with(
        STATUS_ENDPOINT, json=expected_payload
    )
```
- 데코레이터는 테스트 함수 내에서 mock_2.requests를 호출하면 함수의 인자인 mock_requests라는 객체가 mock을 대신할 것이라고 알려줍니다.
- `mock_2.BuildStatus.build_date` 메서드에 대한 반환값으로는 테스터 내에서 지정해준 `build_date`로 사용하도록 context를 구성하고, `notify` 메서드에 `id`와 `status`를 인자로 넣습니다.
- `mock_requests`는 post 요청이 될 때 어떤 인자로 호출되었는지 테스트합니다.

### 리팩토링
- 위와 같이 설계하는 경우, `notify` 메서드가 request 모듈에 직접 의존하는 문제가 있습니다.
- 따라서, 테스터를 작성시에도 의존성을 고려해서 메서드와 객체에 대한 설정을 함께 생각하며 작성해야합니다.
- 함수의 간의 의존성을 줄이는 방식으로 아래와 같이 리팩토링 할 수 있습니다.

```python
# mock_2_refactor.py
class BuildStatus:
    endpoint = STATUS_ENDPOINT

    def __init__(self, transport):
        self.transport = transport

    @staticmethod
    def build_date() -> str:
        return datetime.utcnow().isoformat()
    
    def compose_payload(self, merge_request_id, status) -> dict:
        return {
            "id": merge_request_id,
            "status": status,
            "built_at": self.build_date(),
        }
    
    def deliver(self, payload):
        response = requests.post(STATUS_ENDPOINT, json=payload)
        response.raise_for_status()
        return response
    
    def notify(self, merge_request_id, status):
        return self.deliver(self.compose_payload(merge_request_id, status))
```
- `notify` 메서드를 `compose_payload`, `deliver` 메서드로 각각 분리하고 `requests` 모듈로 한정지어 구현하는 것이 아닌, 생성자 주입으로 처리합니다.

```python
# test_mock_2_refactor.py
from unittest import mock
import pytest
from mock_2_refactor import BuildStatus


@pytest.fixture
def build_status():
    # NOTE: transport에 mock 객체를 주입합니다.
    bstatus = BuildStatus(mock.Mock())
    bstatus.build_date = mock.Mock(return_value="2023-01-01T00:00:01")
    return bstatus

def test_build_notification_sent(build_status):
    build_status.notify(123, "OK")

    expected_payload = {
        "id": 123,
        "status": "OK",
        "built_at": build_status.build_date()
    }

    # NOTE: transport 자리에 mock 객체가 주입되었기 때문에 아래와 같이 사용 가능합니다.
    build_status.transport.post.assert_called_with(
        build_status.endpoint, json=expected_payload
    )
```
- requests 모듈 등 호출을 담당하는 `transport` 자리에 Mock 객체를 주입하여 처리합니다.
- `BuildStatus`에 모킹 처리를 한 `build_status` fixture를 사용해서 테스트를 보다 깔끔하게 진행할 수 있습니다.