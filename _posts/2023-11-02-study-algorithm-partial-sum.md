---
layout: archive
title:  "[Algorithm] 부분합을 계산하기 위한 알고리즘"
date:   2023-11-02 00:05:07 +0900
categories: 
    - Algorithm
---

## 부분합
- 입력받은 정수 배열에서 연속된 부분배열의 합이 가장 큰 경우를 구하는 문제입니다.
- 입력 값으로 배열의 크기와 요소들이 주어집니다.

### 무식하게 풀기 O(N * N)
```python
class SolverBruteForce:
    def solve(self, arr: List[int]):
        psum = INT_MIN
        n: int = len(arr)
        for i in range(n):
            for j in range(n):
                if not (i + j < n):
                    continue
                cand_sum = sum(arr[i:i+j+1])
                psum = max(psum, cand_sum)
        return psum

```
- 배열을 순회하며 순회하고 있는 요소부터 하나씩 증가시키며 끝까지 더해서 값을 비교합니다.
- 순회할 때 O(N)만큼, 순회하고 있는 요소부터 마지막까지 순회해야하기 때문에 O(N)만큼 시간이 함께 소모됩니다.
- 따라서, O(N * N)만큼의 시간 복잡도를 가지게 됩니다.


### 분할해서 풀기 O(NLogN)
```python
class SolverOptimizer:
    def solve(self, arr: List[int], k: int):
        self.k: int = k
        psum = self.process(arr, i, i + k - 1)
        return psum

    def process(self, arr, start, end):
        if start >= end:
            return arr[start]

        mid: int = (start + end) // 2

        cand_sum: int = 0
        left_sum: int = INT_MIN
        for i in range(mid, start - 1, -1):
            cand_sum += arr[i]
            left_sum = max(left_sum, cand_sum)
        
        cand_sum: int = 0
        right_sum: int = INT_MIN
        for i in range(mid + 1, end + 1, 1):
            cand_sum += arr[i]
            right_sum = max(right_sum, cand_sum)

        part = max(self.process(arr, start, mid), self.process(arr, mid + 1, end))
        return max(left_sum + right_sum, part)
```
- `mid` 인덱스를 기준으로 왼쪽 값과 오른쪽 값 각각의 부분합의 최댓값을 계산하고, 병합할 때의 최댓값을 계산하여 모든 경우에서 최댓값을 반환하며 병합해나갑니다. 
- 분할해나가는데 O(LogN)의 시간이 소모되며, 병합해나가는데 O(N)의 시간이 소모되므로 총 O(NLogN)의 시간 복잡도를 가지게 됩니다.

### 입력을 위한 파트
```python
...

if __name__ == "__main__":
    n:int = int(input())
    arr:List[int] = []
    for i in range(n):
        el = int(input())
        arr.append(el)
```
