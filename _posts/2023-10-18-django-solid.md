---
layout: archive
title:  "[Django] 파이썬에서 프레임워크에서 구현하는 동기화 / 비동기화"
date:   2023-10-18 00:05:07 +0900
categories: 
    - Study
---

## 글을 작성하게 된 이유
- Spring과 같은 웹 프레임 워크에서는 자바의 클래스 기반의 특성을 활용하여 OOP 방식으로 코드를 작성하는 것이 수월하다는 것을 익히 들어왔고, 공부해왔습니다.
- Django에서는 DRF라는 프레임워크가 이에 대한 역할을 어느정도 수행해주지만, 커스텀한 코드들을 짤 때 어떻게 SOLID한 방식으로 작성할 수 있을 것인지, 역할과 책임을 어떻게 분리하여 좋은 코드를 만들 수 잇을 것인지 고민하게 되었습니다.
- 다양한 자료를 보며 실용적인 코드를 작성할 수 있는 팁을 모아두어 공부하기 위해 블로깅하게 되었습니다.


### Introduction
- SOLID 원칙은 개발자들이 소프트웨어 시스템을 유연하게 하여, 더 유지보수가 쉽고 확장이 가능하도록 하는 방법입니다.
- Django의 파트 중 ORM에 대한 부분에 이를 적용하여 쿼리 빌딩을 최적화하고 앱 성능을 향상시키는 방법을 알아보겠습니다.

### Single Responsibility Principle (SRP)
- SRP는 클래스가 변경되어야하는 이유는 단 하나의 이유 때문이라는 원칙입니다. (클래스의 단일 책임)
- Django ORM에서는 SRP를 통해 더 작고 모놀리식 모델을 피해 모델에 집중하여 다양한 태스크를 수행하는 방식으로 작성해야합니다.
- 따라서, SRP를 준수하기 위해 장고 모델에 단일 목적을 제공하고 한 가지 유형의 데이터만 처리하도록 합니다.

### Open/Closed Principle (OCP)
- 소프트웨어 객체는 확장에는 열려있고 수정에는 닫혀있어야 한다는 원칙입니다.
- Django ORM에서, 이 원칙는 추상 기본 클래스(abstract base class)와 믹스인을 사용하여 기존 코드를 수정하지 않고 기능을 확장함으로써 적용할 수 있습니다.
- 코드 예시는 다음과 같습니다.
    ```python
    from django.db import models
    import datetime

    class TimestampMixin(models.Model):
        created_at = models.DateTimeField(default=datetime.datetime.now)
        updated_at = models.DateTimeField(default=datetime.datetime.now)
        class Meta:
            abstract = True

    class Post(TimestampMixin, models.Model):
        title = models.CharField(max_length=100)
        content = models.TextField()
    ```

### Liskov Substitution Principle (LSP)
- LSP는 슈퍼클래스의 객체가 프로그램의 일관성에 영향을 미치지 않고 서브클래스의 객체로 대체될 수 있어야 한다는 원칙입니다. 
- Django ORM에서 이 원칙은 모델을 상속하고, 상속된 모델이 기본 클래스의 예상되는 동작을 유지하도록 할 수 있습니다.
- 코드 예시는 다음과 같습니다.
    ```python
    class Content(models.Model):
        text = models.TextField() 
        def word_count(self):
            return len(self.text.split()) 

    class Article(Content):
        title = models.CharField(max_length=100)
        author = models.ForeignKey(User, on_delete=models.CASCADE)    
        def word_count(self):
            return super().word_count()
    ```

### Interface Segregation Principle (ISP)
- 고객이 사용하지 않는 인터페이스에 대해서는 의존하지 않도록 인터페이스 각각을 구체적으로 작성하여 서로 분리해야한다는 원칙입니다. (인터페이스의 단일 책임)
- Django ORM에서, 사용자 지정 `Model Manger`와 `queryset`을 만들어 적용할 수 있으며, 고객이 필요한 관련된 기능만을 사용할 수 있도록 합니다.
- 코드 예시는 다음과 같습니다.
    ```python
    class ActiveUserManager(models.Manager):
        def active_users(self):
            return self.filter(is_active=True)
        def inactive_users(self):
            return self.filter(is_active=False)

    class User(models.Model):
        is_active = models.BooleanField(default=True)
        objects = ActiveUserManager()
    ```
    - 커스텀 `model manager`를 통해 기본 objects의 기능을 사용할 뿐만 아니라(ActiveUserManager가 기본 매니저 상속) 커스텀 매니저 기능도 사용할 수 있게 됩니다.  
    (상황에 따라서는 커스텀 매니저와 기본 매니저를 분리해서 지정하는 것도 가능)

### Dependency Inversion Principle (DIP)
- 높은 수준의 모듈이 낮은 수준의 모듈에 의존하면 안된다는 원칙입니다. 대신, 추상화에 의존해야합니다.
- Django ORM에서 이 원리는 ForeignKey, OneToOneField 및 ManyToManyField와 같은 모델 관계를 사용자 정의하기 위해 Django의 내장 기능을 사용하여 지킬 수 있습니다.
- 이러한 추상화에 의존함으로써, 높은 수준의 애플리케이션 로직을 데이터베이스 스키마의 낮은 수준의 세부 사항과 분리할 수 있다는 장점이 있습니다.
- 코드 예시는 다음과 같습니다.
    ```python
    from django.conf import settings
    from django.db import models

    class Post(models.Model):
        author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
        title = models.CharField(max_length=100)
        content = models.TextField()
    ```
    - 외래 키 관계에서, 장고의 내장 설정인 AUTH_USER_MODEL을 추상화로 사용할 수 있습니다.

### 결론
- Django의 내장 ORM 기능과 DRF가 알게 모르게 SOLID 원칙에 기반하여 각각의 기능들이 구성되있음을 파악할 수 있었습니다.
- 특히, ORM에서 Manager의 기능에 대해 더 학습하고 공부해야겠다고 생각하여, 계속해서 Django Manager의 기능에 대해 작성해보겠습니다.

## Django Manager 활용하기

### Manager를 통해 QuerySet에 대한 중복 코드를 제거하는 방법
#### 일반적으로
```python
class User(models.Model):
    name = models.CharField(max_length=50)
    active = models.BooleanField(default=True)
```
- 이 때 활성화된 유저만 사용하기 위해서는 필요한 구간마다, `User.objects.filter(active=True)`와 같은 방식으로 호출하게 됩니다.
- 만약, `active=True` 조건 이외에도 활성화된 유저를 찾는 방식에 추가적인 조건이 사용된다면(ex. 일정날짜 이후 가입 유저만 활성화 유저로 인정하겠다), 모든 구문을 찾아서 변경해주어야 할 것입니다.

#### 코드 수정 이후
```python
class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(active=True)

class User(models.Model):
    objects = models.Manager()
    active_objects = ActiveManager()
```
- `ActiveManager` 클래스를 추가하여, 메서드로 기입된 기능을 User에게 위임합니다.
- 이때, `ActiveManager`는 기본 매니저를 상속받기 때문에, `User.active_objects.exclude(name="admin")`와 같은 기능도 사용할 수 있습니다.

#### Default Manager 설정시 주의사항
- Default Manager은 기본적으로 Django 프레임워크 내부에서 우선순위에 따라 선정합니다.
    1. Meta.default_manager_name 설정
    2. 부모(다중 상속받는 경우 가장 첫 번째 클래스) 클래스의 Meta.default_manager_name 설정
    3. 해당 모델내에서 manager를 정의했다면, 가장 첫 번째 설정된 manager
- 따라서, 모델 내에서 아래와 같이 명시적으로 작성을 해주는 것이 좋습니다. 
    ```python
    class User(models.Model):
        active_objects = ActiveManager()
        objects = models.Manager()

        class Meta:
            default_manager_name = 'objects'
    ```

### Custom QuerySet 사용하기
#### Manager 사용에서 QuerySet 중복 제거
- ORM 중복코드를 사용하면, 내부에서 QuerySet 중복 코드가 발생하게 됩니다.
```python
class PersonQuerySet(models.QuerySet):
    def authors(self):
        return self.filter(role='A')
    def editors(self):
        return self.filter(role='E')

# class PersonManager(models.Manager):
#     def get_queryset(self):
#         return PersonQuerySet(self.model, using=self._db)
#     def authors(self):
#         return self.get_queryset()
#     def editors(self):
#         return self.get_queryset()

class ActivePersonManager(models.Manager):
    def get_queryset(self):
        return PersonQuerySet.filter(active=True)
    # def authors(self):
    #     return self.get_queryset()
    # def editors(self):
    #     return self.get_queryset()

class Person(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    role = models.CharField(max_length=1, choices=[('A', _('Author')), ('E', _('Editor'))])
    active = models.BooleanField(default=True)
    people = PersonManager.as_manager()
    active_people = ActivePeopleManager.from_queryset(PersonQuerySet)()
```
- `as_manager` 메서드를 통해 커스텀 쿼리셋 자체를 매니저로서 사용할 수 있습니다. 아래와 같은 역할을 합니다.
    ```python
    class PersonManager(models.Manager):
        def get_queryset(self):
            return PersonQuerySet(self.model, using=self._db)
        def authors(self):
            return self.get_queryset().filter(role='A')
        def editors(self):
            return self.get_queryset().filter(role='B')
    ```
- `from_queryset` 메서드를 통해 기존 매니저에 기본 쿼리셋으로 설정할 커스텀 쿼리셋을 추가할 수 있습니다.

## References
- [넥스트리소프트 - 객체지향 개발 5대 원리:SOLID](https://www.nextree.co.kr/p6960/)
- [Dinesh Kumar님의 블로그](https://medium.com/@dkthelearner/leveraging-solid-principles-in-django-orm-for-optimized-query-building-fd52e60133e8)
- [화해블로그 - Django Manager 적용](https://blog.hwahae.co.kr/all/tech/tech-tech/4108)