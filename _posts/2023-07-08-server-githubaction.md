---
layout: archive
title:  "[Server] Github action을 활용한 CI/CD 구성"
date:   2023-07-08 16:05:07 +0900
categories: 
    - Server
---

## Github action 

**Work Flow 구성**
- github action에서는 아래 템플릿을 기본적으로 제공합니다.  
  (Repository -> Actions -> New workflow [배너] -> 원하는 Framework 검색)
- 템플릿은 해당 프로젝트 리파지토리의 `/.github/workflows/` 디렉토리에 `.yaml` 형식으로 작성합니다.
- 이 때, `.env` 파일 내의 정보는 보안상 workflow에 기입할 수 없으므로, 각각 github repository settings에서 관리합니다.  
  (Repository -> Settings -> Secrets and variables [Actions])

### CI 구성
- Django 기본 템플릿을 응용하여 아래와 같이 Github Action 템플릿을 작성합니다.
- 간단하게, `feat/`으로 시작하는 브랜치에 push/pull 하는 경우 github action이 동작하도록 합니다.
- steps 디렉티브에서 명시한 순서대로 실행 명령어를 수행합니다. 작성한 테스트를 동작시키고, 이상이 있는 경우 작동을 중지합니다.

```yaml
name: CI
on:
push:
    branches:
    - 'feat/**'
pull_request:
    branches:
    - 'feat/**'
jobs:
build:
    runs-on: ubuntu-latest
    strategy:
    max-parallel: 4
    matrix:
        # python-version: [3.7, 3.8, 3.9]
        python-version: [3.9]
    env:
    working-directory: ./web/apps/

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python ${{ matrix.python-version }}
    uses: actions/setup-python@v3
    with:
        python-version: ${{ matrix.python-version }}

    - name: Install Dependencies
    run: |
        python3 -m pip install --upgrade pip
        pip install -r requirements.txt
    working-directory: ${{ env.working-directory }}
    
    - name: Run Tests
    env:
        DJANGO_SECRET_KEY: ${{ secrets.DJANGO_SECRET_KEY }}
        DJANGO_SETTINGS_MODULE: ${{ secrets.DJANGO_SETTINGS_MODULE }}
    run: |
        python3 manage.py test
    working-directory: ${{ env.working-directory }}
```
