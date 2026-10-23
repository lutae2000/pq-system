# 백엔드 작업 규칙

- 기존 업무 기능은 현재 프로젝트의 JDBC와 단순 SQL 구조를 우선 사용한다. 복잡한 추상화는 유지보수상 이점이 명확할 때만 도입한다.
- 공통코드의 `ref_value1`은 화면별 필드 매핑 경로를 저장할 수 있으므로, 경로를 프론트나 문서 생성 서비스에 필드명별로 하드코딩하지 않는다.
- 공통코드 조회 결과를 변경하는 작업은 관련 Valkey 캐시 키와 캐시 무효화 흐름을 함께 확인한다.
- HWPX 생성 서비스는 요청의 `mappings`를 기준으로 필드값을 조회하고, 필드명의 날짜 형식·금액 단위·기간 단위는 formatter에서 해석한다.
- HWPX 매핑 경로는 허용된 루트(`basic`, `detail`, `summary`, `row`, `history`)와 데이터 필드 조합으로 관리한다. 새 경로를 추가하면 resolve 로직과 formatter를 함께 검토한다.
- HWPX 입력 데이터가 없거나 선택적 컬럼이 null인 경우 문서 생성 전체가 실패하지 않도록 빈 문자열과 빈 목록을 기본값으로 사용한다.
- 한글 문서와 SQL을 수정할 때는 UTF-8 인코딩을 유지하고, 수정 후 컴파일과 관련 테스트를 실행한다.

각 application 서비스의 책임과 도메인 간 연결은 `Readme.md`의 application 서비스 영역을 기준으로 확인한다. 새 기능을 추가할 때는 Controller, application service, persistence/query, DTO, 관련 캐시와 테스트를 함께 찾아 영향 범위를 정리한다.

## HWPX 공통코드 매핑

기술인실적 필드 그룹은 `PQ/HG`(기본), `PQ/HH`(경력), `PQ/HI`(이력)이다. `ref_value1`의 예시는 다음과 같다.

| 필드 의미 | `ref_value1` |
| --- | --- |
| 경력 용역기간 | `row.contractTerm` |
| 경력 참여기간 | `row.workTerm` |
| 경력 참여분야직위 | `row.jobClass` |
| 경력 참여차수기간 | `row.participationPeriods` |

`경력_용역기간(yyyy-mm-dd)(일)`처럼 표시 형식이 필드명에 포함된 경우 경로는 `row.contractTerm`으로 동일하게 두고, `HwpxFieldFormatter`가 필드명을 사용해 날짜 형식과 일·월·년 단위를 계산한다. 여러 차수 기간의 `(총일)`, `(총월)`, `(총년)`도 같은 방식으로 처리한다.

공통코드를 SQL로 직접 변경했다면 다음 레벨2 캐시를 확인하고 삭제하거나 애플리케이션의 공통코드 캐시 무효화 기능을 사용한다.

```text
cache:common-codes:level1:pq:level2:hh:use:y
```

## Hexagonal architecture layer rules

- `adapter.in` is the inbound adapter. Controllers, request/response DTOs, HTTP status handling, and request binding belong here. It may call an application use case, but it must not call `JdbcClient`, JPA repositories, Redis clients, or SQL directly.
- `application` is the use-case layer. Application services coordinate transactions, authorization, validation, domain rules, and calls to ports. Services must depend on interfaces under `application/**/port/in` or `application/**/port/out`, never on classes under `adapter/out`.
- `application` services must not contain SQL, `JdbcClient`, `JdbcTemplate`, `EntityManager`, JPA query annotations, ResultSet mapping, database table names, Redis commands, or file-system client code. Query construction and persistence mapping belong in an output adapter.
- `application/**/port/out` contains the persistence or integration contracts required by a use case. Port methods should express business operations and use application/domain types; do not expose `JdbcClient`, `ResultSet`, JPA entities, SQL strings, or infrastructure-specific types in a port. 페이징 계약은 프로젝트 표준으로 Spring Data의 `Page<T>`와 `Pageable`을 사용할 수 있다.
- `domain` contains business concepts and rules. Domain classes must not depend on Spring, web DTOs, JPA entities, JDBC, Redis, or file clients.
- `adapter.out` implements output ports. JDBC, JPA, Redis, external HTTP clients, file storage, SQL, entity mapping, and infrastructure-specific error translation belong here. An adapter may depend on a port and domain/application models, but the application layer must not depend on the adapter.
- DTO conversion is explicit at the boundary: inbound DTOs are converted before entering the use-case logic, and domain/application results are converted to outbound DTOs in the inbound adapter or a dedicated mapper. Do not make application ports return web-layer DTOs when a domain or application result type can be used.
- A service such as `NotificationPreferenceService` should only resolve the current actor, validate and normalize the use-case input, apply the transaction boundary, and call `NotificationPreferenceRepository`. SQL belongs in `NotificationPreferenceJdbcRepository`, which is the output adapter.
- When adding or changing a feature, create or find the use-case port and output port first, then implement the application service, then implement or update the adapter. Do not place a query temporarily in the service as a shortcut.
- Before submitting backend changes, verify the dependency direction: `adapter.in -> application -> domain`, and `adapter.out -> application/domain`. A dependency from `application` or `domain` to `adapter.out`, web DTOs, JPA entities, or infrastructure clients is an architecture violation and must be removed.

## 공통화, 검증 및 패키지 규칙

- private 도우미를 추가하기 전에 동일한 정규화·필수값·길이·날짜·숫자·파싱 로직이 이미 있는지 검색한다. null/blank 처리, 반환값, 오류 유형까지 같은 경우에만 공통화하고, 이름만 비슷한 도메인 규칙은 해당 모듈에 둔다.
- `common`의 값 도우미는 순수 변환과 비교만 제공하며 `application`, HTTP 예외, 웹 DTO에 의존하지 않는다. 애플리케이션 오류를 발생시키는 공통 입력 검증은 `application/common/validation`에 둔다.
- HTTP 요청의 형식·길이·필수값은 Jakarta Bean Validation 애노테이션과 `@Valid`로 먼저 검증한다. 같은 유스케이스가 배치나 내부 호출에서도 안전하도록 핵심 불변식은 application 계층에서도 검증한다.
- 범용 `Utils` 클래스와 무관한 기능을 한 파일에 모으는 방식을 피한다. `StringValues`, `InputValues`, 목적별 codec/parser처럼 책임이 드러나는 이름을 사용하고, 정적 도우미는 `final` 클래스와 private 생성자로 선언한다. Lombok `@UtilityClass`는 숨은 변환이 주는 이점이 명확할 때만 사용한다.
- application 계층에서 현재 사용자, 현재 시각, 외부 상태가 필요하면 `CurrentActorPort`, `Clock`과 같은 주입 가능한 경계를 사용한다. SecurityContext나 정적 resolver를 application 서비스에서 직접 호출하지 않는다.
- Java 패키지 세그먼트는 모두 소문자로 작성한다. 긴 합성어는 camelCase나 밑줄 대신 의미 단위의 계층으로 나눈다. 예: `relatedprojecthistory.condition`. 패키지를 변경할 때 application, inbound/outbound adapter, 테스트와 문서의 경로를 함께 변경한다.
- 기존의 짧고 안정된 패키지는 이름만 바꾸기 위해 일괄 이동하지 않는다. 해당 bounded context를 개선할 때 컨트롤러부터 포트, 서비스, 어댑터, 테스트까지 한 단위로 패키지 구조를 정리한다.
- 단순 CRUD를 줄이기 위해 범용 base service나 reflection 기반 CRUD 프레임워크를 만들지 않는다. inbound use case, application model, outbound port를 얇게 유지하고 반복 입력 정책만 `InputValues`와 값별 공통 클래스로 공유한다.
- `port.in`에는 유스케이스 인터페이스를 두고, command/query/result처럼 inbound와 outbound가 함께 사용하는 타입은 해당 context의 `model`에 둔다. 페이징만을 위한 업무별 `PageQuery`, `PageResult` 타입을 만들지 않고 Spring Data의 `Pageable`, `Page<T>`를 사용한다.
- 목록 API의 컨트롤러는 `Pageable`을 바인딩하고 공통 `PageRequests`로 page와 size 범위를 보정한 뒤 유스케이스에 전달한다. 유스케이스와 출력 포트의 반환 계약은 `Page<T>`로 선언한다. 직접 조회한 목록과 전체 건수를 조합하는 구현은 `new PageImpl<>(content, pageable, totalElements)`를 사용하되, 메서드 반환 타입에 구체 클래스인 `PageImpl<T>`를 노출하지 않는다.
- private 중첩 record가 해당 서비스의 저장 필드 조합이나 도메인 정규화 결과를 표현하면 모듈 내부 타입으로 유지한다. 필드와 정책이 다른 여러 record를 하나의 범용 DTO로 합치지 않는다.

## Module-by-module architecture improvement workflow

- Treat `AGENTS.md` as the canonical backend architecture guide. `agent.md` is only a short navigation note and must not contain rules that contradict this file.
- Improve one bounded context at a time. Before changing code, inventory that module's controller, request/response DTOs, inbound ports, application services, outbound ports, persistence/integration adapters, cache flow, migrations, and tests.
- The inbound adapter must depend on an inbound use-case interface under `application/<context>/port/in`. Controllers must not inject concrete application service classes.
- An application service implements the inbound port and may depend only on inbound commands/queries, domain objects, outbound port interfaces, and infrastructure-neutral application services. Spring Data의 `Page<T>`와 `Pageable`은 프로젝트의 페이징 표준으로 application 서비스와 포트에서 사용할 수 있다. 그 밖의 web DTOs, `ResponseStatusException`, `HttpStatus`, JPA entities, repository implementations, JDBC clients, Redis clients, SQL, or file clients는 import하지 않는다.
- HTTP status translation belongs in `adapter/in/web/error`. Application validation and business failures use application/domain exceptions; the web adapter maps those exceptions to HTTP responses.
- Outbound ports expose business operations and application/domain types. 페이징에는 Spring Data `Page<T>`와 `Pageable`을 표준으로 사용한다. web DTOs, JPA entities, QueryDSL types, SQL strings, and infrastructure clients must stay at the adapter boundary. `PageImpl<T>`는 목록 데이터를 조합하는 구현에서만 생성하고 포트 계약에는 `Page<T>`를 사용한다.
- Persistence adapters own query construction, entity-to-domain mapping, transaction-specific persistence details, and infrastructure exception translation. They must not push SQL or entity types into application services.
- Domain objects contain business rules and must not depend on Spring, web, persistence, cache, filesystem, or third-party client types.
- DTO conversion is explicit: request DTO -> inbound command/query in the controller or inbound mapper, and domain/application result -> response DTO in the controller or inbound mapper.
- For each module migration, add or update focused tests for the inbound port/service and adapter contract, then run `./gradlew test` (or the smallest relevant Gradle test task) and `./gradlew compileJava` before moving to the next module.
- Record remaining violations in the change summary and keep the next module boundary small enough to review. Do not perform a repository-wide mechanical rewrite in a single module change.

HWPX 생성 요청은 multipart의 `template`과 JSON `request`로 전달되며, `request.mappings`는 HWPX 필드명과 `ref_value1` 경로의 매핑이다. 프론트의 경로가 비어 있는 필드는 생성 요청에 포함하지 않는다.
