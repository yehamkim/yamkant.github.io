---
title: "Django Strategy"
layout: archive
permalink: categories/django-strategy/
author_profile: true
sidebar_main: true
---

{% assign posts = site.categories.['Django Strategy'] %}
{% for post in posts %} {% include archive-single2.html type=page.entries_layout %} {% endfor %}