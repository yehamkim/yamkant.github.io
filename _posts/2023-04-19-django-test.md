---
layout: archive
title:  "[Django] 테스트는 어떻게 수행할까?"
date:   2023-04-19 20:05:07 +0900
categories: [Django Strategy]
---

## 글을 작성하게 된 계기
- 테스트 환경을 구축하는 것이 초반에는 번거로울지 모르지만, 기능 구현에 대한 발전 과정 / 리팩토링 과정을 공유하고 특정 기능에 대해 구체적인 예시로 살펴볼 수 있다는 점에 있어서 편리하다고 생각되었습니다.

### 목표
- DRF에서 제공하는 `APITest`를 이용하여 integration 테스트, e2e 테스트를 진행하는 예시에 대해 작성합니다.
- `Item` 및 `ItemImage` 모델을 기준으로 작성합니다.

### Django 테스트 수행 전략

**integration, e2e 등 테스트를 위한 공통 DB 및 테스트 logger 설정**
```python
# mysite/settings/dev.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        'TEST': {
            'NAME': os.environ.get('TEST_DB_NAME'),
        }
    }
}

...
LOGGING_TEST_FILE_DIRECTORY = './logs/test.log'
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {module}: {message} {process:d} {thread:d}',
            'style': '{',
        },
        ...
    },
    'filters': {
        ...
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'formatter': 'verbose',
            'class': 'logging.StreamHandler',
        },
        'file': {
            'level': 'INFO',
            'formatter': 'verbose',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / LOGGING_TEST_FILE_DIRECTORY,
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5, # 롤링되는 파일의 개수
        },
        ...
    },
    'loggers': {
        ...
        'django.test': {
            'level': 'INFO',
            'handlers': ['console', 'file'],
            'propagate': False,
        },
        ...
    }
}
```
- `./manage.py makemigrations mysite --settings=mysite.settings.dev`를 통해 마이그레이션 파일을 만든 후, 해당 DB 정보를 그대로 테스트 DB에서 사용합니다.
- 배포 관련 포스팅에서 작성한 바와 같이 개발환경에서는 sqlite3를 사용하여 DB를 구성합니다.  
- `TEST` 키워드를 통해 테스트 환경에서 사용할 DB에 이름을 부여합니다.(생략가능)  
- 관련된 구체적인 내용은 다른 포스터 [logger 설정 관련]({% post_url 2023-04-18-django-logger %})를 참고하시면 됩니다.


---

### integration 테스트 관련 전략

**테스트 항목 정리**
1. 테스트를 수행하기 위한 모델 관련 코드
2. integration 테스트를 위한 ItemRepository 코드
3. 테스트를 위한 ItemRepositoryTest 코드
4. 참고: 테스트를 돕는 helper class 추가

**테스트를 수행하기 위한 모델 관련 코드**
```python
# models.py
class Item(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    price = models.IntegerField(default=0)
    brand = models.CharField(max_length=200, default="브랜드 미선택")
    cate_id = models.ForeignKey('Category', on_delete=models.PROTECT, default=1)

    class Meta:
        managed = True
        db_table = 'items'

class ItemImage(models.Model):
    id = models.AutoField(primary_key=True)
    url = models.CharField(max_length=1000)
    img_type = models.CharField(max_length=1)
    item_id = models.ForeignKey('Item', on_delete=models.PROTECT, default=1, related_name='relatedItem')

    class Meta:
        managed = True
        db_table = 'itemImages'
```
- `managed` property는 Django에게 DB 수정/생성 권한을 줍니다. 
- dev.py에서 `DEBUG`는 True로 설정하기 때문에 TEST DB에서 새로운 모델들을 생성할 수 있습니다.

**integration 테스트를 위한 ItemRepository 코드**
```python
from mytest.serializers import ItemSerializer

class ItemRepository():
    serializer_class = ItemSerializer
    def createItem(self, data):
        serializer = self.serializer_class(data=data, partial=True)
        if serializer.is_valid():
            instance = serializer.create(data)
        else:
            raise Exception(serializer.errors)
        return instance
    
    ...
```
- 관련 내용은 다른 포스터 [Serializer 및 Repository 관련내용]({% post_url 2023-05-11-django-serializer %})를 참고하시면 됩니다.


**테스트를 위한 ItemRepositoryTest 코드**
```python
# tests/integration/ItemRepositoryTest.py

from rest_framework.test import APITestCase
from mytest.repositories import ItemRepository
from mytest.models import Category, ItemImage, Item
from django.db.models import Prefetch
import copy

from django.db import connection
from django.test.utils import CaptureQueriesContext

# 이하 참고 부분에 설명
from mytest.tests.libs.TestLogger import TestLogger

import logging
logger = logging.getLogger('django.test')

class ItemRepositoryTest(APITestCase):
    def setUp(self):
        self.itemRepository = ItemRepository()
        Category.objects.create()
    
    def test_createItem(self):
        # given
        data = {
            'name': '새로운 상품',
            'price': 3000,
            'item_images': [
                {'url': 'https://my-bucket.s3.us-west-2.amazonaws.com/thumbnail.png', 'img_type': 'T'},
                {'url': 'https://my-bucket.s3.us-west-2.amazonaws.com/detail.png', 'img_type': 'D'}
            ], 
        }

        # when
        with CaptureQueriesContext(connection) as ctx:
            newItem = self.itemRepository.createItem(copy.deepcopy(data))
            logger.info(ctx.captured_queries)

        # then
        with CaptureQueriesContext(connection) as ctx:
            prefetch = Prefetch(
                "relatedItem",
                queryset=ItemImage.objects.filter(),
                to_attr='itemImages'
            )
            itemForTest = Item.objects.filter(id=newItem.id).prefetch_related(prefetch).last()
            logger.info(ctx.captured_queries)

        logger.info(TestLogger.printStart())
        assert itemForTest.name == data['name']
        assert itemForTest.price == data['price']
        assert itemForTest.itemImages[0].url == data['item_images'][0]['url']
        assert itemForTest.itemImages[1].url == data['item_images'][1]['url']
        logger.info(TestLogger.printSuccess())

    def tearDown(self):
        itemName = '새로운 상품'
        ItemImage.objects.select_related('item_id').filter(item_id__name=itemName).delete()
        Item.objects.filter(name=itemName).delete()
    
```
- `./manage.py test mytest.tests.integration.ItemRepositoryTest`를 통해 테스트를 수행할 수 있습니다. 
- `APITestCase`의 `setUp` method는 test case마다 실행(Before Each)되며, `setUpTestData`는 전체 test 시작 전(Before All)에 수행됩니다. `tearDown`은 각 테스트가 마무리되고 사용되어 테스트셋 동안 생성한 메모리를 제거하도록 구성할 수 있습니다.
- setting.py에서 설정된 바와 같이 log를 따로 관리합니다. 저희가 사용한 logger는 console, file handler를 사용하도록 설정했기 때문에, console창에 출력되며 동시에 file에 저장될 것입니다.
- query str이 어떻게 작성되었는지, 효율을 확인하기 위해 `Raw SQL Query 분석` 및 `측정시간`을 출력해 볼 수 있는 `CaptureQueriesContext`를 사용하여 관리합니다.

**참고: 테스트를 돕는 helper class 추가**
```python
# tests/libs/TestLogger.py
import traceback
import sys

class TestLogger():
    staticmethod
    def printStart():
        return f"\033[34mSTART {sys._getframe(1).f_code.co_name}\033[0m"

    staticmethod
    def printSuccess():
        return f"\033[32m[OK]\033[0m {sys._getframe(1).f_code.co_name}"

    staticmethod
    def printException(ex: Exception):
        exStr = ''.join(traceback.format_exception(type(ex), ex, ex.__traceback__))
        return f"\033[31m[KO]\033[0m {exStr}"
```
- 아래와 같이 testLogger를 만들어, 테스트 진행상황을 파악하기 유용하도록 작성했습니다.
- 동작 원리: 현재 함수명을 불러오는 부분 / 예외를 출력하는 부분으로 구성하여 테스트 진행 상황을 색깔을 넣어 표시합니다.
