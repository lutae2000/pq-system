# batch

Spring Batch 기반의 정기 실행 작업 프로젝트입니다.

## 현재 배치

`apiCallLogCleanupJob`은 `api_call_logs.occurred_at`이 현재 시각 기준 보관기간을 초과한 로그를 삭제합니다.

- 기본 보관기간: 3개월
- 기본 실행 주기: 매일 03:00
- 실행 비활성화: `BATCH_API_CALL_LOG_CLEANUP_ENABLED=false`
- 실행 주기 변경: `BATCH_API_CALL_LOG_CLEANUP_CRON`
- 보관기간 변경: `BATCH_API_CALL_LOG_RETENTION_MONTHS`

## 실행

```powershell
./gradlew.bat bootRun
```

DB 접속 정보는 `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` 환경변수로 설정할 수 있습니다.
