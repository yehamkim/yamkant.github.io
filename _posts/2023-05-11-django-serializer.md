---
layout: archive
title:  "[Django] Sequelizer는 어떻게 사용할까?"
date:   2023-05-11 20:05:07 +0900
categories: [Django Strategy]
---

## 글을 작성하게 된 계기
- Data를 함수간 전달하거나 다른 레이어로 전달하는 경우에 항상 빠진 요소가 없는지, Validation 확인이 필요한지 판단하는 코드를 작성해야합니다.
- 이를 수월하게 하기 위해 custom exception을 만든 적도 있고, @dataclass를 활용한 적도 있지만 drf가 제공하는 기능을 사용할 때 model과의 연동도 수월하며 사용성이 좋았어서 공유하고자 글을 작성합니다.
- 참고: https://www.django-rest-framework.org/api-guide/serializers/

## Post의 목표
- Django의 Serializer 기본 개념 및 예시를 작성합니다.
- Item을 `create` 및 `update`하는 예시를 구현합니다. Item 필요한 부분에서 Validation을 추가합니다.
- 이때, Item은 Category를 FK로 가지며, ItemImage는 Item을 FK로 가집니다.

## Serializers
- Serializer는 쿼리셋과 모델 인스턴스들과 같이 복잡한 데이터 타입들을 Python datatype으로 변경하기 위해 사용합니다.
- 변경된 순수 Python datatype들은 JSON/XML/그 외 content type들로 쉽게 렌더링 될 수 있습니다.

### 기본 Serializer / Model / Repository 예시
- FK를 사용하지 않는 경우, 간단하게 Layer를 분리하여 구현합니다.

**Model part**
```python
# models.py
from django.db import models
from datetime import datetime

class Item(models.Model):
    name = models.CharField(max_length=200)
    price = models.IntegerField(default=0)

    class Meta:
        managed = True
        db_table = 'items'
```
- sqlite3를 사용하여 migration 및 DB 테이블을 연동하여 작업하기 위해 `managed` 설정을 True로 작성합니다.

**Serializer part**
```python
# serializers.py
from mytest.models import Item
from mytest.validators import validatorBeOverTen, OverTenValidator
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

class ItemSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    price = serializers.IntegerField(validators=[OverTenValidator()])

    def create(self, validated_data):
        return Item.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.price = validated_data.get('price', instance.name)
        instance.save()
        return instance
    
    class Meta:
        validators = [
            UniqueTogetherValidator(
                queryset=Item.objects.all(),
                fields=['name', 'price']
            )
        ]
    
```
- 위와 같이, 내장되어 있는 `create`, `update` method를 overriding하여 사용할 수 있습니다.
- DRF는 내장 validator로 [참고](https://www.django-rest-framework.org/api-guide/validators/)사이트의 기능들을 제공합니다.
- 해당 예시에서는 같은 이름의 같은 가격인 상품은 등록하지 못하도록 validation을 추가하였습니다.

**Repository part**
```python
# repositories.py
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
    
    def updateItem(self, instance, data):
        print(data)
        serializer = self.serializer_class(instance, data=data, partial=True)
        if serializer.is_valid():
            instance = serializer.update(instance, data)
        else:
            raise Exception(serializer.errors)
        return instance
```
- 새로운 데이터 추가 시, 위와 같이 serializer에서 유효한 값인지 먼저 확인하고, 유효하지 않다면 error를 반환할 수 있습니다.
    (참고: `serializer.is_valid(raise_exception=True)` 옵션을 사용하면 400 상태로 바로 반환도 가능합니다.)
- 저의 경우에 Custom Exception 객체를 생성하여 이를 통해 에러를 핸들링하기도 합니다.
- 만약, 위와 같이 create, update 등을 상세하게 구분하여 사용하지 않는 경우, serializer.save()를 메서드를 통해 validated data를 기준으로 데이터 값을 해당 모델에 저장할 수 있습니다. 
- `partial` parameter를 추가하여, 생성시 비어있는 필드는 default 값으로, 업데이트시 데이터에 포함된 필드만 수정합니다.  
    (참고: Serializer의 `UniqueTogatherValidator`에서 fields 조건에 포함된다면, 모두 업데이트를 위한 데이터에 넣어줘야합니다.)

**Validator Part**
```python
# validators.py
from rest_framework import serializers

class OverTenValidator:
    def __init__(self, message="Price must be over ten."):
        self.message = message
    
    def __call__(self, value):
        if not value > 1000:
            raise serializers.ValidationError(self.message)
```
- serializer의 validation 방식에는 `Field-level`, `Object-level` 등이 있습니다.
- 저는 다른 Serializer에서 추가적으로 사용될 수 있으므로, 재사용성을 위해 파일을 분리하여 class based validator로 사용합니다.
- Serializer의 Meta 클래스 내부에는 DRF에 내장되어있는 Validator를 사용하고, 각 필드별 Validator는 custom validator 클래스들을 import 하여 사용합니다.

### 목표 및 정책  

**목표**  
- Nested object를 사용하여 키관계에 있는 model들을 한 번에 생성합니다.

**정책**
1. 상품은 여러 개의 상품 이미지를 가질 수 있고, 각 이미지는 타입에 따라 썸네일/상세이미지로 저장합니다.
2. 상품이 생성될 때, 상품에 대한 썸네일과 상세 이미지 등 이미지 정보가 필수로 들어가야 합니다.

### Nested objects 사용하기
```python
# models.py
class Item(models.Model):
    ...

class ItemImage(models.Model):
    id = models.AutoField(primary_key=True)
    url = models.CharField(max_length=1000)
    img_type = models.CharField(max_length=1)
    item_id = models.ForeignKey('Item', on_delete=models.PROTECT, default=1)

    class Meta:
        managed = True
        db_table = 'itemImages'
```
- 한 상품은 여러개의 상품 이미지를 가질 수 있습니다. 

```python
# serializers.py
...
from django.db import transaction

class ItemImageSerializer(serializers.Serializer):
    url = serializers.CharField(max_length=1000)
    img_type = serializers.CharField(max_length=1)

class ItemSerializer(serializers.Serializer):
    ...
    item_images = ItemImageSerializer(many=True, required=True)

    def create(self, validated_data):
        imgsData = validated_data.pop('item_images')
        with transaction.atomic():
            item = Item.objects.create(**validated_data)
            for imgData in imgsData:
                itemImage = ItemImage.objects.create(item_id=item, **imgData)
        return item
    ...
```
- 상품 생성시 반드시 상품의 이미지도 함께 생성하도록 처리합니다. `item_images` 필드에 `required=True` 옵션을 추가하여 해당 데이터가 전달되지 않는 경우, `serializer.is_valid()`에서 이를 검증합니다.
- `transaction`을 추가하여 상품 이미지 데이터가 잘못되는 경우에, 생성된 상품도 생성되지 않도록 롤백합니다.

### 실행
```python
from mytest.repositories import ItemRepository

itemRepository = ItemRepository()
data = {
    'name': '새로운 상품',
    'price': 3500,
    'item_images': [
        {'url': 'https://my-bucket.s3.us-west-2.amazonaws.com/thumbnail.png', 'img_type': 'T'},
        {'url': 'https://my-bucket.s3.us-west-2.amazonaws.com/detail.png', 'img_type': 'D'}
    ], 
}
itemRepository.createItem(data)
```
- Nested objects를 통해 요소를 생성 후에 바로 키관계를 엮는 부분에서는 편리함이 있습니다.
- 하지만 위의 예제와 같이, 생성시 image의 데이터를 필수적으로 넣어야한다는 점 때문에 dependency가 발생한다고 생각되었습니다.
- 따라서 저는 service layer에서 transaction을 사용하는 방식으로 수행합니다.