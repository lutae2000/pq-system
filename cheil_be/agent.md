# Cheil BE Agent Guide

프로젝트 작업 규칙의 기준 문서는 [`AGENTS.md`](AGENTS.md)입니다. 이 파일은 기존에 사용하던 파일명과의 호환을 위한 안내 파일입니다.

백엔드 작업에서는 다음 원칙을 적용합니다.

- Controller는 요청 바인딩과 응답 변환만 담당하고 application 서비스에 위임합니다.
- 업무 데이터 조회·수정은 기존 `JdbcClient`, JPA repository, 서비스 계층의 패턴을 먼저 확인하고 재사용합니다.
- API 인증·권한, 공통코드 캐시, 감사 필드, Flyway migration의 기존 흐름을 우회하지 않습니다.
- HWPX 템플릿 매핑은 필드명별 Java·TypeScript 하드코딩 대신 `common_codes.ref_value1`과 요청 `mappings`를 사용합니다.
- 변경 후에는 영향 범위에 맞는 Gradle 테스트와 REST Docs 생성을 확인합니다.

세부 규칙과 경로는 [`AGENTS.md`](AGENTS.md), 실행 방법과 서비스 구성은 [`README.md`](Readme.md)를 확인합니다.
