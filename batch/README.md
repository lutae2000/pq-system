# Batch

나라장터 공고 수집과 오래된 데이터 정리를 실행하는 Spring Batch 프로젝트입니다.

## 배치 종류

| Job 이름 | 용도 |
| --- | --- |
| `g2bBidNoticeCandidateSyncJob` | 나라장터 용역 공고를 수집하고 후보·동기화 이력을 저장합니다. 등록된 공고의 변경·취소·재공고는 알림으로 기록합니다. |
| `g2bBidNoticeCleanupJob` | `system_policies`의 `G2B_BID_NOTICE_RETENTION_MONTHS`를 기준으로 오래된 미등록 후보와 동기화 이력을 삭제합니다. 정책이 비활성화되면 삭제하지 않습니다. |
| `apiCallLogCleanupJob` | 보관 기간이 지난 API 호출 로그를 삭제합니다. 기본 보관 기간은 3개월입니다. |

## IntelliJ IDEA에서 즉시 실행

1. `Run → Edit Configurations → + → Application`에서 실행 구성을 만듭니다.
2. **Main class**는 `com.cheil.batch.BatchApplication`, **Module**은 `batch.main`, **Working directory**는 batch 프로젝트 루트로 지정합니다.
3. 실행할 배치의 **Program arguments** 한 줄을 그대로 입력하고 Run을 누릅니다. 첫 옵션의 `--`도 포함해야 합니다.

| 실행할 배치 | Program arguments |
| --- | --- |
| 나라장터 공고 수집 | `--spring.batch.job.enabled=true --spring.batch.job.name=g2bBidNoticeCandidateSyncJob` |
| G2B 공고 정리 | `--spring.batch.job.enabled=true --spring.batch.job.name=g2bBidNoticeCleanupJob` |
| API 호출 로그 정리 | `--spring.batch.job.enabled=true --spring.batch.job.name=apiCallLogCleanupJob` |

나라장터 공고 수집을 실행할 때만 **Environment variables**에 `G2B_SERVICE_KEY=<서비스 키>`를 추가합니다. G2B 공고 정리를 실행할 때는 두 번째 줄의 Job 이름을 사용합니다.

`local` 또는 `dev` 프로필로 실행하면 모든 배치의 실행 SQL이 바인딩된 값과 함께 여러 줄로 출력됩니다. `raw_payload`를 다루는 SQL은 로그에서 제외됩니다.

같은 Job을 다시 실행할 때는 Program arguments 끝에 `run.id=1`처럼 실행마다 다른 값을 추가합니다. 이 값은 Spring Batch 실행 구분용이며, G2B 공고 보관 개월수는 `system_policies`에서 별도로 읽습니다.

선택한 Job이 기동 직후 한 번 실행됩니다. 콘솔에서 완료 상태를 확인하고 Stop을 누릅니다. G2B 공고 정리는 적용된 보관 개월수와 삭제 건수를 로그에 출력합니다. 기본 연결은 PostgreSQL `localhost:5432/cheil_local`, Valkey `localhost:6379`이며 관련 테이블과 Spring Batch 메타 테이블이 필요합니다.
