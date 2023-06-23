---
layout: archive
title:  "[Django] Form 클래스는 어떻게 사용할까?"
date:   2023-05-13 20:05:07 +0900
categories: [Django Strategy]
---

# FORM
- HTML Form은 웹 페이지에서 필드나 위젯들의 묶음을 말합니다. 폼을 통해 사용자의 입력들을 받으므로, POST 요청으로 server에 데이터를 전달합니다.
  (CSRF 토큰을 통해 위조를 방지하기 위한 안정적인 대책을 세울 수 있습니다.)

### Djnago 폼 처리 과정
1. 브라우저에서 form을 포함한 페이지를 요청합니다.
2. Django는 "unbound" default form을 서빙합니다.  
   (이 시점에서 폼은 초기값이 있지만, Client가 입력한 값에 연관되지 않습니다.)
3. Client는 데이터를 입력하고 서버에 submit합니다.
4. 데이터 유효성을 검사합니다.  
   (실패한다면, error message와 함께 bound form을 다시 유저에게 서빙합니다.)
5. 유효한 데이터를 통해 알맞은 동작을 수행한 후, 성공 URL로 리다이렉트합니다.

### Form 클래스, ViewSet 작성
- Form 클래스는 Django 어드민 시스템의 핵심으로, field들과 배치, widget, 라벨, 초기값, 유효성 확인, 에러 메시지를 결정합니다.

```python
# forms.py

from django import forms
from mytest.models import Category

class ItemForm(forms.Form):
    name = forms.CharField(help_text="상품명을 입력하세요")
    price = forms.IntegerField(help_text="상품 가격을 입력하세요")
    brand = forms.CharField(help_text="브랜드명을 입력하세요")
    cate_id = forms.ModelChoiceField(queryset=Category.objects.all())
```
- 상품 폼 생성시 상품명과 브랜드명 입력부는 text 타입의 input 태그로, 가격 입력부는 number 타입의 input 태그로, category 모델 선정부(FK)는 select 태그로 렌더링됩니다.


```python
# urls.py
from django.contrib import admin
from django.urls import path

from mytest.views import ItemPageViewSet

urlpatterns = [
    path('view/items/', ItemPageViewSet.as_view()),
]
```
```python
# views.py
class ItemPageViewSet(APIView):
    itemRepository = ItemRepository()
    def get(self, request, format=None):
        itemForm = ItemForm(initial={"name": "새로운 상품"})
        context = {
            'form': itemForm,
        }
        return render(request, 'items.html', context)
    
    def post(self, request, format=None, ):
        itemForm = ItemForm(request.data)

        if itemForm.is_valid():
            self.itemRepository.createItem({
                'name': itemForm.cleaned_data['name'],
                'price': itemForm.cleaned_data['price'],
            })
            return redirect("/view/items/")
        context = {
            'form': itemForm,
        }
        return render(request, 'items.html', context)
```
- `view/item/` 경로로 GET 요청을 받으면, unbound form을 우선적으로 렌더링합니다.
- 이 후, 데이터를 입력하고 POST 요청을 통해 새로운 item을 생성할 수 있습니다.
- 이 때, 이 전에 포스팅한 serializer를 수행하는 `itemRepository`를 활용하여 아이템을 생성합니다.
