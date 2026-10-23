# 배치 서비스 개발 규칙

이 문서는 `batch` 프로젝트에서 Spring Batch 작업을 추가하거나 수정할 때 지켜야 하는 기준이다. 배치 작업은 운영 데이터에 반복적으로 접근하므로, 한 번 실행되는 기능보다 재실행·실패 복구·중복 방지·관찰 가능성을 우선한다.

## 기본 원칙

- 기존 업무 기능을 먼저 조사한다. 관련 Job, Step, Scheduler, application service, inbound port, outbound port, adapter, MyBatis Mapper XML, 설정, 마이그레이션, 테스트를 함께 확인한다.
- 한 번에 전체 프로젝트를 기계적으로 재구성하지 않는다. 하나의 bounded context 단위로 변경 범위를 제한하고, 남은 구조적 문제는 변경 요약에 기록한다.
- 업무 규칙은 application service 또는 domain에 두고, SQL과 외부 연동 구현은 adapter에 둔다.
- 배치가 다시 실행되어도 동일한 데이터가 중복 생성되지 않도록 upsert, 고유 키, 멱등 조건을 설계한다.
- 실패를 숨기지 않는다. 예외를 로그에 남기고 Spring Batch 실행 상태가 `FAILED`로 기록되는지 확인한다.
- 운영 설정은 코드와 분리한다. 실행 주기, 활성화 여부, 조회 기간, 보존 기간, API 페이지 크기는 YAML과 환경변수로 관리한다.

## 권장 패키지 구조

bounded context는 다음 구조를 기본으로 한다.

```text
com.cheil.batch.<context>
├─ adapter
│  ├─ in                         # Scheduler, Job 실행 진입점 등
│  └─ out
│     ├─ api                     # 외부 API client
│     └─ persistence              # MyBatis Mapper, XML, persistence adapter
├─ application
│  ├─ model                       # command, query, result
│  ├─ port
│  │  ├─ in                      # 유스케이스 인터페이스
│  │  └─ out                     # 저장소·외부연동 인터페이스
│  └─ service                    # 유스케이스 구현
├─ batch                         # Job, Step Bean 조립
└─ domain                        # 업무 개념과 규칙
```

의존 방향은 다음을 따른다.

```text
adapter.in → application → domain
adapter.out → application, domain
batch → application.port.in, batch 설정 객체
```

- Controller나 Scheduler, Batch Config가 `JdbcClient`, `JdbcTemplate`, MyBatis Mapper, SQL, 외부 API client를 직접 호출하지 않는다.
- application service는 adapter 구현체가 아니라 port에 의존한다.
- domain은 Spring, JDBC, MyBatis, JPA, Redis, 파일 시스템, HTTP DTO에 의존하지 않는다.
- 웹 DTO, ResultSet, MyBatis 타입, SQL 문자열을 application port의 반환값이나 파라미터로 노출하지 않는다.
- Batch Config는 Job과 Step을 조립하고 트랜잭션 경계를 설정하는 역할만 담당한다. 페이지 조회, 중복 제거, 저장 순서, 알림 생성 같은 orchestration은 application service로 이동한다.

## Spring Batch 구현 기준

- Job 이름과 Step 이름은 상수 또는 명확한 고정값으로 관리한다.
- 동일 Job을 실행할 때 Spring Batch가 실행을 구분할 수 있도록 `scheduledAt` 같은 실행 파라미터를 전달한다.
- 단순히 외부 API를 조회하고 일괄 저장하는 작업은 tasklet을 사용할 수 있다. 대량 데이터를 한 건씩 처리하거나 재시작 지점이 필요한 경우에는 chunk 기반 Step을 검토한다.
- 하나의 Step 안에서 외부 API 호출, 데이터 변환, 저장, 알림을 모두 직접 구현하지 않는다. 각 책임을 application service와 outbound port로 나눈다.
- 실행 결과에 전체 조회 건수, 저장 건수, 연계 건수, 알림 건수 같은 핵심 수치를 ExecutionContext와 INFO 로그에 남긴다.
- 스케줄러와 수동 실행 진입점은 `BatchJobRunner`를 사용한다. 일반 Job은 `run`, 중복 실행 방지가 필요한 Job은 TTL과 함께 `runWithLock`으로 실행하며, 실행 파라미터·상태 판정·공통 메트릭·분산 락 코드를 업무별 Launcher에 반복 구현하지 않는다.
- 같은 Job이 동시에 실행될 가능성이 있으면 분산 잠금, 실행 중복 검사, 또는 Spring Batch JobRepository를 통한 제어 방식을 적용한다.
- startup 실행은 `run-on-startup` 같은 명시적인 설정이 켜진 경우에만 수행한다. 운영 환경에서 외부 API 배치가 의도하지 않게 시작되지 않도록 기본값은 비활성화한다.

## 스케줄링과 조회 기간

- 실행 주기는 Java의 `@Scheduled` 기본값에 숨기지 않고 `src/main/resources/application.yaml`에서 관리한다.
- cron, zone, enabled 설정은 한 곳에서 관리하며 Java annotation에는 설정 키만 둔다.
- 환경별 변경은 `BATCH_*` 환경변수로 덮어쓸 수 있어야 한다.
- 최근 N분 데이터를 조회하는 배치는 N을 코드에 고정하지 않는다. 실제 cron의 실행 간격을 설정에서 해석하거나, 명시적인 lookback 설정을 둔다.
- 조회 시작 시각과 종료 시각의 경계 중복이 발생할 수 있으므로 upsert와 고유 키로 중복을 허용하지 않는다.
- 외부 API가 시간 단위나 분 단위만 지원하는지 확인하고, API가 허용하는 포맷으로 변환한다.
- 고정 조회 기간을 테스트나 재처리에 사용할 수 있도록 request-from, request-to 같은 override 설정을 제공할 수 있다.

## MyBatis와 SQL 규칙

- 배치의 업무 DB 조회와 변경 SQL은 MyBatis Mapper XML을 기본으로 사용한다.
- Mapper interface와 XML은 `adapter/out/persistence` 아래에 둔다.
- application service는 Mapper를 직접 주입하지 않고 outbound port만 호출한다.
- Mapper XML의 namespace는 Mapper interface의 전체 클래스명과 정확히 일치해야 한다.
- 동적 SQL에서 `<`, `>`, `&`를 사용할 때 XML escape 또는 CDATA를 사용한다.
- 대량 insert는 페이지 크기와 JDBC/PostgreSQL parameter 제한을 함께 검토한다. 지나치게 큰 한 번의 SQL보다 적절한 chunk 또는 페이지 단위 저장을 선택한다.
- upsert 대상의 고유 키와 충돌 조건을 마이그레이션에서 먼저 확인한다.
- SQL 변경은 관련 migration과 함께 검토한다. 배치 프로젝트가 스키마를 소유하지 않는 경우 backend migration을 수정하고 배치에서 별도 임의 DDL을 실행하지 않는다.
- 삭제 SQL은 보존 기간을 파라미터로 받고, 서비스에서 최소값을 검증한다. 무조건 전체 삭제하는 SQL을 작성하지 않는다.
- 감사로그 삭제 예시는 다음 흐름을 따른다.

```text
CleanupApiCallLogsUseCase
  → ApiCallLogCleanupService
  → DeleteExpiredApiCallLogsPort
  → ApiCallLogCleanupPersistenceAdapter
  → ApiCallLogCleanupMapper
  → ApiCallLogCleanupMapper.xml
```

## 멱등성·변경공고·알림

- 나라장터 후보 데이터는 `(bid_ntce_no, bid_ntce_ord)`를 식별 기준으로 사용한다.
- API 응답을 지역별로 여러 번 조회하는 경우 공고번호와 차수로 메모리 중복을 제거한 뒤 저장한다.
- 지역 코드 조회 결과를 병합할 때 조회에 사용한 지역 코드가 실제 저장 데이터에 필요한지 확인하고, 단일 코드 필드와 목록 필드를 혼동하지 않는다.
- `imported_at` 또는 `imported_bid_seq`와 같은 연계 상태는 원본 후보와 업무 공고의 매핑 결과를 기준으로 갱신한다.
- 변경·취소·재공고 알림은 이미 업무 공고로 입력된 후보와 이후 수집된 후보를 비교해 생성한다.
- 알림 `notice_id`에는 재실행 시 중복 생성되지 않는 결정적 키를 사용하고 `ON CONFLICT` 등 멱등 처리를 둔다.
- 알림 대상, 노출 기간, 링크 경로는 SQL에 흩어지게 만들지 말고 해당 bounded context의 저장 어댑터에서 일관되게 관리한다.
- 알림 SQL을 변경하면 기존에 이미 생성된 알림이 재실행 때 중복되거나 내용이 불필요하게 갱신되지 않는지 확인한다.

## 로그와 민감정보

- INFO에는 실행 시작·완료, 조회 기간, 페이지 수, 저장·연계·삭제 건수를 기록한다.
- 외부 API 요청은 DEBUG에서 조회 기간, 지역 코드, 페이지, 페이지 크기를 기록할 수 있다.
- 서비스 키, Authorization 헤더, 개인정보, 원본 payload 전체를 로그에 기록하지 않는다.
- MyBatis SQL 로그는 기본 INFO 또는 비활성으로 두고, 장애 분석 시 `BATCH_SQL_LOG_LEVEL=DEBUG`로 일시 활성화한다.
- 대량 SQL parameter 전체를 운영 INFO 로그에 남기지 않는다. 로그량과 민감정보 노출을 함께 검토한다.
- 예외 로그에는 원인을 남기되 URL에 포함된 인증키가 출력되지 않도록 한다.

## 설정 예시

```yaml
batch:
  g2b:
    bid-notice:
      enabled: ${BATCH_G2B_BID_NOTICE_ENABLED:false}
      run-on-startup: ${BATCH_G2B_BID_NOTICE_RUN_ON_STARTUP:false}
      cron: ${BATCH_G2B_BID_NOTICE_CRON:0 */10 8-23 * * *}
      zone: ${BATCH_G2B_BID_NOTICE_ZONE:Asia/Seoul}
  cleanup:
    api-call-logs:
      enabled: ${BATCH_API_CALL_LOG_CLEANUP_ENABLED:true}
      cron: ${BATCH_API_CALL_LOG_CLEANUP_CRON:0 0 3 * * *}
      zone: ${BATCH_API_CALL_LOG_CLEANUP_ZONE:Asia/Seoul}
      retention-months: ${BATCH_API_CALL_LOG_RETENTION_MONTHS:3}

logging:
  level:
    com.cheil.batch: INFO
    com.cheil.batch.*.adapter.out.persistence.*: ${BATCH_SQL_LOG_LEVEL:INFO}
```

실제 Spring Boot logger name은 wildcard 지원 방식이 환경에 따라 다를 수 있으므로, 운영에서 SQL 로그가 필요하면 Mapper의 전체 패키지명을 명시한다.

## 테스트 기준

변경 후 최소한 다음을 실행한다.

```powershell
./gradlew compileJava test --no-daemon
```

필요한 테스트 범위는 다음과 같다.

- application service: 페이지 병합, 중복 제거, 빈 응답, 조회 기간, 저장 port 호출 검증
- persistence adapter: Mapper 호출과 저장 행 변환 검증
- API adapter: URI 파라미터, 인증키 encoding, 응답 mapping, 오류 응답 검증
- 삭제 service: 보존 기간 최소값 검증과 삭제 port 위임 검증
- Spring context 또는 MyBatis test: Mapper XML namespace와 SQL 매핑 로딩 검증
- 실제 DB 실행 전에는 backend Flyway migration이 현재 DB에 적용되어 있는지 확인한다.

IntelliJ에서 특정 Job만 실행할 때는 Spring Boot 실행 설정에서 배치 자동 실행을 끄고, 다음 환경변수를 사용한다.

```text
SPRING_PROFILES_ACTIVE=local
BATCH_G2B_BID_NOTICE_ENABLED=true
BATCH_G2B_BID_NOTICE_RUN_ON_STARTUP=true
BATCH_SQL_LOG_LEVEL=DEBUG
```

`run-on-startup`은 해당 배치 Launcher의 `ApplicationRunner` 실행에만 적용된다. 스케줄러의 실행 메서드에 breakpoint를 걸어 실행 시점과 Job 실행 파라미터를 확인하고, 외부 API 호출 전에는 조회 기간과 대상 지역을 확인한다.

## 변경 전 점검 목록

- 관련 bounded context의 Controller 또는 Scheduler, Job, Step, port, service, adapter, Mapper XML, migration, test를 확인했는가?
- application/domain에서 adapter, SQL, MyBatis, JDBC 타입을 참조하지 않는가?
- 재실행 시 중복 insert나 중복 알림이 발생하지 않는가?
- 실패 시 Spring Batch 상태가 `FAILED`가 되고 원인이 로그에 남는가?
- 조회 기간이 실행 주기와 일치하고 경계 중복을 안전하게 처리하는가?
- API 호출 횟수와 페이지 크기가 제한을 넘지 않는가?
- SQL 로그에 인증키나 원본 개인정보가 포함되지 않는가?
- 현재 DB에 필요한 migration이 적용되어 있는가?
- `./gradlew compileJava test --no-daemon`이 통과하는가?
