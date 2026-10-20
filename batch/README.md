# Batch

여러 정기 작업을 독립적으로 실행하는 Spring Batch 프로젝트입니다. 각 업무는 패키지로 구분하고, 외부 API와 DB 같은 인프라 구현은 헥사고날 아키텍처의 아웃바운드 어댑터로 분리합니다.

## 현재 배치

### 나라장터 기술용역 조달요청 통신 확인

`g2bBidNoticeCandidateSyncJob`은 나라장터 용역 입찰공고를 조회하고 동기화 이력과 `g2b_bid_notice_candidates`에 저장합니다. 저장된 후보 중 기존 공고문으로 등록된 공고의 변경·취소·재공고는 `system_notices`에 알림으로 기록합니다.

- 기본 실행 주기: 매시간 정각
- 조회 API: `getBidPblancListInfoServcPPSSrch`
- API 서비스: `BidPublicInfoService`
- 정기 실행 여부: `BATCH_G2B_BID_NOTICE_ENABLED` (기본값 `false`, 서비스 키 권한 확인 후 `true`)
- 기동 시 1회 실행 여부: `BATCH_G2B_BID_NOTICE_RUN_ON_STARTUP`
- 실행 주기: `BATCH_G2B_BID_NOTICE_CRON`
- 수동 실행과 정기 실행의 중복 방지 락 TTL: `BATCH_G2B_BID_NOTICE_LOCK_TTL` (기본값 `30m`)
- 조회 시간 범위: 배치 cron의 분 간격을 자동으로 사용
- 페이지 크기: `BATCH_G2B_BID_NOTICE_PAGE_SIZE`
- 서비스 키: `G2B_SERVICE_KEY`

이 API는 기존 입찰공고정보서비스와 별도의 조달요청서비스입니다. 공공데이터포털에서 조달요청서비스 활용신청이 완료된 서비스 키를 사용해야 하며, 입찰공고정보서비스에만 등록된 키를 사용하면 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR(30)`이 반환됩니다.

### API 호출 로그 정리

`apiCallLogCleanupJob`은 보관기간이 지난 `api_call_logs` 데이터를 삭제합니다.

- 기본 보관기간: 3개월
- 기본 실행 주기: 매일 03:00
- 실행 여부: `BATCH_API_CALL_LOG_CLEANUP_ENABLED`
- 실행 주기: `BATCH_API_CALL_LOG_CLEANUP_CRON`
- 보관기간: `BATCH_API_CALL_LOG_RETENTION_MONTHS`

## 개발 중 나라장터 API 바로 호출하기

스케줄을 기다리지 않고 애플리케이션 기동 시 한 번 실행할 수 있습니다.

```powershell
$env:BATCH_G2B_BID_NOTICE_ENABLED='true'
$env:BATCH_G2B_BID_NOTICE_RUN_ON_STARTUP='true'
$env:G2B_SERVICE_KEY='발급받은 서비스 키'
./gradlew.bat bootRun
```

로그에서 아래 내용을 확인한 다음 `Ctrl+C`로 종료합니다.

```text
나라장터 용역 입찰공고 API 통신 성공
나라장터 응답 예시
g2bBidNoticeCandidateSyncJob started
```

`BATCH_G2B_BID_NOTICE_ENABLED=false`이면 정기 실행과 `RUN_ON_STARTUP=true`로 지정한 기동 시 1회 실행이 모두 중지됩니다.

## 테스트 실행 방법

외부 API를 호출하지 않는 기본 테스트입니다. JSON 변환, 요청 파라미터와 인증키 인코딩을 로컬 모의 서버로 확인합니다.

```powershell
./gradlew.bat test
```

실제 나라장터 API까지 호출하는 통합 테스트입니다.

```powershell
$env:G2B_LIVE_TEST='true'
$env:G2B_SERVICE_KEY='발급받은 서비스 키'
./gradlew.bat test --tests com.cheil.batch.g2bbidnotice.adapter.out.api.G2bBidNoticeApiLiveTest
```

일반적인 `test` 실행에서는 실 API 테스트가 자동으로 제외되므로 나라장터 장애나 호출 한도가 CI 빌드에 영향을 주지 않습니다.

## Spring Batch 코드 구조

나라장터 배치는 다음 흐름으로 실행됩니다.

```text
G2bBidNoticeBatchLauncher
  -> JobOperator
  -> g2bBidNoticeCandidateSyncJob / g2bBidNoticeCandidateSyncStep
  -> FetchG2bBidNoticesUseCase
  -> G2bBidNoticeService
  -> LoadG2bBidNoticesPort
  -> G2bBidNoticeApiAdapter
  -> 나라장터 Open API
```

- `batch`: Job, Step, 스케줄과 실행 설정을 관리합니다.
- `application/port/in`: 배치가 호출하는 유스케이스 인터페이스입니다.
- `application/service`: 업무 흐름을 조정합니다.
- `application/port/out`: 외부 API나 DB에 필요한 인터페이스입니다.
- `adapter/out`: HTTP, DB 같은 실제 인프라 통신을 구현합니다.
- `domain`: 외부 프레임워크와 무관한 업무 데이터를 정의합니다.

새로운 배치는 업무 패키지 안에 Spring Batch `Job`과 `Step`, 실행 주기를 담당하는 Scheduler를 둡니다. 기동 시 1회 실행이 필요하면 해당 Scheduler가 `ApplicationRunner`를 구현하고 설정값을 확인해 같은 Job을 실행합니다.

## Job과 Step 이해하기

- Job은 하나의 배치 업무 전체입니다.
- Step은 Job 안에서 순서대로 실행되는 처리 단계입니다.
- Tasklet은 한 번에 끝나는 작업에 적합합니다. 현재 API 통신 확인과 로그 삭제 작업이 해당합니다.
- Chunk 방식은 많은 데이터를 읽고 가공하고 저장할 때 사용합니다. 나라장터 공고를 DB에 저장하는 단계에서는 `ItemReader`, `ItemProcessor`, `ItemWriter` 구조를 검토합니다.
- JobParameter가 다르면 Spring Batch는 새로운 실행으로 기록합니다. 각 Scheduler는 실행 시각을 파라미터로 넣어 매 실행을 구분합니다.
- 실행 이력은 Spring Batch 메타 테이블에 기록됩니다. 실패 원인은 로그와 `BATCH_JOB_EXECUTION`, `BATCH_STEP_EXECUTION` 상태로 확인할 수 있습니다.

## K8S 실행 설정

서비스 키는 이미지에 새로 넣지 않고 K8S Secret을 `G2B_SERVICE_KEY` 환경변수로 주입하는 방식을 권장합니다. 나라장터 배치는 Valkey 분산 락으로 스케줄 실행과 수동 실행의 중복을 방지합니다.

DB 접속 정보는 `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` 환경변수로 설정합니다.
