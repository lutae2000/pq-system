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
- `application/**/port/out` contains the persistence or integration contracts required by a use case. Port methods should express business operations and use application/domain types; do not expose `JdbcClient`, `ResultSet`, JPA entities, SQL strings, or infrastructure-specific types in a port.
- `domain` contains business concepts and rules. Domain classes must not depend on Spring, web DTOs, JPA entities, JDBC, Redis, or file clients.
- `adapter.out` implements output ports. JDBC, JPA, Redis, external HTTP clients, file storage, SQL, entity mapping, and infrastructure-specific error translation belong here. An adapter may depend on a port and domain/application models, but the application layer must not depend on the adapter.
- DTO conversion is explicit at the boundary: inbound DTOs are converted before entering the use-case logic, and domain/application results are converted to outbound DTOs in the inbound adapter or a dedicated mapper. Do not make application ports return web-layer DTOs when a domain or application result type can be used.
- A service such as `NotificationPreferenceService` should only resolve the current actor, validate and normalize the use-case input, apply the transaction boundary, and call `NotificationPreferenceRepository`. SQL belongs in `NotificationPreferenceJdbcRepository`, which is the output adapter.
- When adding or changing a feature, create or find the use-case port and output port first, then implement the application service, then implement or update the adapter. Do not place a query temporarily in the service as a shortcut.
- Before submitting backend changes, verify the dependency direction: `adapter.in -> application -> domain`, and `adapter.out -> application/domain`. A dependency from `application` or `domain` to `adapter.out`, web DTOs, JPA entities, or infrastructure clients is an architecture violation and must be removed.

HWPX 생성 요청은 multipart의 `template`과 JSON `request`로 전달되며, `request.mappings`는 HWPX 필드명과 `ref_value1` 경로의 매핑이다. 프론트의 경로가 비어 있는 필드는 생성 요청에 포함하지 않는다.
