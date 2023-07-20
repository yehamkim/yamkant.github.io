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