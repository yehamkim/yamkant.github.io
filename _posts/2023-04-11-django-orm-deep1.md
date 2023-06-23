---
layout: archive
title:  "[Django] ORM 사용 방법을 위한 기록"
date:   2023-04-11 23:05:07 +0900
categories: 
    - Django Deep
---
## 글을 작성하게 된 계기
- ['우아한테크세미나'에서 이동욱(향로)](https://www.youtube.com/live/DJCmvzhFVOI?feature=share)님께서 제어할 수 없는 것들에 의존하지 않기라는 주제로 발표하셨습니다.
- 제어하기 쉬운 부분은 Business Logic을 담당하는 애플리케이션이고, UI와 Data 파트는 상대적으로 제어하기가 어려운 영역입니다.
- 제어할 수 없는 부분인 Database가 SQL이든, NoSQL이든 어떻게 변경 되더라도 대응하기 쉬운 애플리케이션 코드를 작성하는 것이 좋은 코드라는 말씀에 공감되었습니다.
- Django ORM의 사용법에 한계가 많다고 생각했던 탓에 무작정 Raw SQL을 사용했지만, 이는 DB에 의존적으로 된다는 단점이 있기 때문에 ORM을 익혀두는 것이 중요하다고 생각되었습니다.
- ['2020 파이콘'에서 김성렬님의 강의](https://youtu.be/EZgLfDrUlrk)를 보고 ORM 공부의 필요성을 느꼈습니다.

**이하 사용할 모듈 및 메서드**
- 사용하는 모듈: [Django Query Counter](https://pypi.org/project/django-query-counter/), ORM 사용시 생성되는 쿼리문과 요청 속도 파악을 위해 사용합니다. 
- 사용하는 데이터베이스: postgreSQL


## ORM 사용 권장 팁
- 쿼리셋을 작성할 때 권장되는 순서는 다음과 같습니다. 여기서 핵심은, prefetch를 가장 아래에 두는 것입니다.
- prefetch_related를 통해 테이블을 조회하면, 추가 쿼리가 발생하기 때문에, filter 아래에 두어, 다른 쿼리셋임을 나타내어 보기 용이하게 합니다.

### 추천하는 쿼리셋 순서
```python
queryset = (
    Model.objects
    .annotate(
        커스텀프로퍼티1선언=F("DB컬럼명"),
        커스텀프로퍼티2선언=Case(
            When(
                조건절_모델필드아무거나__isnull=False,
                then=Count('특정모델필드')),
            default=Value(0, output_field=Integerfield(
                help_text='해당 어트리뷰트 결과값을 django에서 무슨타입으로 받을건지 선택하는 파라미터입니다.'
            ),),
        )
    )
    .selected_related("정방향_참조모델1", "정방향참조모델2")
    .filter(Q(), ~Q()).exclude()
    .only() 또는 .defer()
    .prefetch_related(
        Prefetch(to_attr="역방향_참조모델1", queryset=BModel.objects.select_related("b_model의 정방향참조모델1").filter(is_deleted=False)),
        Prefetch(to_attr="역방향_참조모델2", queryset=CModel.objects.all())
    )
)
```

### 쿼리셋 작성 예시
**요구사항**
- 상품 데이터를 조회합니다. 조회시 브랜드명과 카테고리 명을 정방향 참조하여 가져옵니다.
- 상품의 썸네일 부분(이미지 타입 T)을 역방향 참조하여 가져옵니다.

1. raw query만 사용해서 조회하는 경우
    ```python
    from django.db.models.query import RawQuerySet

    def findAllOnlyRawQuery(self) -> List[Product]:
        rawQueryStr: RawQuerySet = f'''
        select 
            p.prod_id
            , p.prod_name
            , b.brand_name
            , p.buy_link
            , string_agg(pi.url, ',') as thumbnailConcat
        from products p
        join productimages pi on pi.prod_id=p.prod_id
        join brands b on b.brand_id=p.brand_id
        where pi.type='T' and p.deleted='N'
        group by p.prod_id, b.brand_name;
        '''
        params = []
        prodQs = self.product.objects.raw(rawQueryStr, params=params, translations=None)
        for prodQ in prodQs:
            logger.info(prodQ.__dict__)
        return prodQs

    # 출력결과
    # [INFO] ProductRepository {'_state': <django.db.models.base.ModelState object at 0xffff7b8280d0>, 'prod_id': 15, 'prod_name': '아주 멋진 옷', 'buy_link': 'https://www.thehandsome.com/ko/PM/productDetail/SH2C3TRN634M?itmNo=004', 'brand_name': '브랜드 미선택', 'thumbnailconcat': 'https://cdn-img.thehandsome.com/studio/goods/SH/2C/SS/SH2C3TRN634M_OW_W01.jpg?rs=684X1032'}

    '''
    http://127.0.0.1:8000/products/
    |------|-----------|----------|----------|----------|------------|
    | Type | Database  |   Reads  |  Writes  |  Totals  | Duplicates |
    |------|-----------|----------|----------|----------|------------|
    | RESP |  default  |    0     |    1     |    1     |     0      |
    |------|-----------|----------|----------|----------|------------|
    Total queries: 1 in 0.0829s
    "GET /products/ HTTP/1.1" 200 833
    '''
    ```
    - 상품의 순번을 GROUP BY로 묶어서 사용하면 쿼리를 한 번에 출력할 수 있지만, 각각의 이미지를 `','`로 나누어 리스트로 다시 넣는 작업을 추가로 작성해야합니다.

2. ORM만 사용하여 조회하는 경우
    ```python
    def findAllOnlyORM(self) -> List[Product]:
        prefetch = Prefetch(
            "related_prod",
            queryset=ProductImage.objects.filter(type="T"),
            to_attr='prodImgs'
        )
        prodQs = Product.objects.annotate(
            prodId=F('prod_id')
            , prodName=F('prod_name')
            , brandName=F('brand_id__brand_name')
        ).select_related(
            "brand_id"
        ).prefetch_related(prefetch)
        for prodQ in prodQs:
            logger.info(prodQ.__dict__)
        return prodQs
    
    # 출력결과
    # [INFO] ProductRepository {'_state': <django.db.models.base.ModelState object at 0xffffb1d27610>, 'prod_id': 15, 'prod_name': '아주 멋진 옷', 'buy_link': 'https://www.thehandsome.com/ko/PM/productDetail/SH2C3TRN634M?itmNo=004', 'cate_id_id': 1, 'brand_id_id': 1, 'deleted': 'N', 'created_at': datetime.date(2023, 4, 5), 'prodId': 15, 'prodName': '아주 멋진 옷', 'brandName': '브랜드 미선택', '_prefetched_objects_cache': {}, 'prodImgs': [<ProductImage: ProductImage object (10)>]}

    '''
    http://127.0.0.1:8000/products/
    |------|-----------|----------|----------|----------|------------|
    | Type | Database  |   Reads  |  Writes  |  Totals  | Duplicates |
    |------|-----------|----------|----------|----------|------------|
    | RESP |  default  |    2     |    0     |    2     |     0      |
    |------|-----------|----------|----------|----------|------------|
    Total queries: 2 in 0.0726s
    '''
    ```
    - model에서 ProductImage의 related_name을 `related_prod`라고 작성해두었기 때문에, `Prefetch`의 looku 인자로 `related_prod`로 갖습니다.
    - 각각의 상품 쿼리는 상품 이미지 쿼리셋을 같습니다. 쿼리셋 메서드를 통해 상품이미지들 중 필요한 쿼리만 사용할 수 있습니다.

3. RawQuery와 ORM을 섞어서 사용하는 경우
    ```python
    def findAllRawQueryWithORM(self) -> List[Product]:
        rawQueryStr = f'''
        select 
            p.prod_id
            , p.prod_name
            , b.brand_name
            , c.cate_name
            , p.buy_link
        from products p
        join brands b on b.brand_id=p.brand_id
        join categories c on c.cate_id=p.cate_id
        '''
        params = []

        prefetch = Prefetch(
            "related_prod",
            queryset=ProductImage.objects.filter(type="T"),
            to_attr='prodImgs'
        )
        prodQs = self.product.objects.raw(rawQueryStr, params=params, translations=None).prefetch_related(prefetch)
        for prodQ in prodQs:
            logger.info(prodQ.__dict__)
        return prodQs

    # 출력결과
    # [INFO] ProductRepository {'_state': <django.db.models.base.ModelState object at 0xffff9efa6110>, 'prod_id': 15, 'prod_name': '아주 멋진 옷', 'buy_link': 'https://www.thehandsome.com/ko/PM/productDetail/SH2C3TRN634M?itmNo=004', 'brand_name': '브랜드 미선택', 'cate_name': '카테고리 미선택', '_prefetched_objects_cache': {}, 'prodImgs': [<ProductImage: ProductImage object (10)>]}
    ```
    - RawQuerySet을 사용하더라도, QuerySet의 제어권에 들어오게 되기 때문에 prefetch_related는 체이닝이 가능합니다.

### 예시들을 작성하며
- RawQuery를 사용하는 경우 어쩔 수 없이 쿼리문을 String으로 작성하게 되며, 이는 리팩토링하여 특정 부분을 재사용하기가 어렵게 됩니다.
- 장고에서 제공하는 객체인 QuerySet 형식으로 재사용 가능한 부분을 이용하기 위해서는 더 고급의 ORM 사용법을 숙지해야할 필요성을 느꼈습니다.
- 또한, Low Query를 판단하기 위해 DEBUG 모드에서 장고가 어떻게 Query문을 변경하여 DB에 요청하는지 모니터링하면서 나은 구문들로 만들 수 있을 것입니다.

  