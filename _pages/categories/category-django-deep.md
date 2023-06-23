---
title: "Django Deep"
layout: archive
permalink: categories/django-deep/
author_profile: true
sidebar_main: true
---

{% assign posts = site.categories.['Django Deep'] %}
{% for post in posts %} {% include archive-single2.html type=page.entries_layout %} {% endfor %}