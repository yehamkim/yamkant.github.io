---
layout: archive
title:  "[Go] Go Package는 어떤 방식으로 구성될까?"
date:   2024-08-22 00:05:07 +0900
categories: [Strategy]
---

### Package란?
- 패키지들은 Go 소스코드의 재사용성과 가독성을 높이며 organize하기 위해 사용되며, 같은 디렉터리 내에 있는 소스 파일들의 조합입니다.
- 실행 가능한 Go 어플리케이션은 main function을 포함해야만 합니다. 이 함수는 실행을 위한 entry point입니다.
- 