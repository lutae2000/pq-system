# PQ참여 기술자 관리 API

## Base URL

`/pq/participating-engineers`

인증이 필요한 API이며 프론트에서는 `modules/pq/pq-participating-engineers/api.ts`를 통해 호출한다.

## 후보 기술자 조회

`GET /pq/participating-engineers/candidates`

### Query Params

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `bidSeq` | number | 공고문 시퀀스 |
| `workDutyId` | string | PQ작업자 |
| `keyword` | string | 기술자명, 부서, 직위 검색어 |
| `retireYn` | `Y` \| `N` | 재직/퇴직 여부 |
| `certificationName` | string | 보유 자격증 |
| `specialtyField` | string | 전문분야 |
| `jobField` | string | 직무분야 |
| `designGrade` | string | 설계등급 |
| `constructionManagementGrade` | string | 건설사업관리등급 |
| `projectHistoryConditions` | JSON string | 관련 공사 참여 이력 조건 |
| `page` | number | 0부터 시작하는 페이지 |
| `size` | number | 페이지 크기 |

### `projectHistoryConditions`

조건 배열을 JSON 문자열로 전달한다. 두 번째 조건부터 `logicalOperator`가 앞 조건과의 결합 방식이다.

```json
[
  {
    "conditionType": "constructionKind",
    "logicalOperator": "AND",
    "level1Code": "10",
    "level2Code": "02",
    "level3Code": "01",
    "operator": "=",
    "valueType": "code",
    "value": "01"
  },
  {
    "conditionType": "outline",
    "logicalOperator": "OR",
    "outlineCategoryCode": "Z28",
    "outlineSubcategoryCode": "01",
    "operator": ">=",
    "valueType": "number",
    "value": "1000"
  }
]
```

### Condition Mapping

| `conditionType` | 조회 대상 | 주요 컬럼 |
| --- | --- | --- |
| `constructionKind` | 회사실적 공사종류 | `company_performance_construction_kinds.level1_code`, `level2_code`, `level3_code` |
| `general` | 회사실적/참여이력 일반 컬럼 | `company_performances`, `pq_engineer_project_history`의 일반 속성 |
| `outline` | 회사실적 공사개요 상세값 | `company_performance_outlines.category_code`, `subcategory_code`, `outline_content` |

### General Condition Mapping

| 코드 | 항목 | 추천 매핑 |
| --- | --- | --- |
| `C0104C1` | 사업시작일 | `company_performances.contract_from_date` |
| `C0105C1` | 계약종료일 | `company_performances.contract_to_date` |
| `C0108C1` | 구분(설계,감리) | `company_performances.job_type` |
| `C0101C1` | 용역명 | `company_performances.job_name` |
| `C0110C1` | 용역구분 | `company_performances.business_type` |
| `C0121C1` | 공사개요 | `company_performances.summary` |
| `C0160C1` | 참여분야직위 | `pq_engineer_project_history.job_part` 또는 `job_class` |
| `C0150C1` | 자사타사구분 | `pq_engineer_project_history.comp_name` 또는 별도 구분 컬럼 |
| `C0107C1` | 출금액 | `company_performances.contract_amt` |
| `C0108C1_AMT` | 당사금액 | `company_performances.own_amt` |
| `C0140C1` | 실질참여여부 | `pq_engineer_project_history.join_yn` |
| `C0120C1` | 참여시작일 | `pq_engineer_project_history.start_dt` |
| `C0141C1` | 신고여부 | `pq_engineer_project_history.return_yn` 또는 신고여부 컬럼 |
| `C0102C1` | 발주처구분 | `company_performances.client_kind` |
| `C0130C1` | 진행상태 | `company_performances.job_finish_yn` |

백엔드 실제 컬럼명이 다르면 위 매핑 테이블만 조정한다.

### Response

```json
{
  "content": [
    {
      "engrId": "99",
      "name": "홍길동",
      "department": "기술부",
      "position": "부장",
      "jobField": "QA001",
      "specialtyField": "PA001",
      "designGrade": "1",
      "constructionManagementGrade": "1",
      "retireYn": "N"
    }
  ],
  "page": 0,
  "size": 50,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

## 선정 기술자 조회

`GET /pq/participating-engineers?bidSeq={bidSeq}&workDutyId={workDutyId}`

`PQ_FIND_ENGR_INFO`를 기준으로 선정된 기술자를 조회한다.

## 등록

`POST /pq/participating-engineers`

```json
{
  "bidSeq": 20100001,
  "workDutyId": "100924",
  "engrId": "99"
}
```

## 수정

`PUT /pq/participating-engineers/{bidSeq}/{workDutyId}/{engrId}`

현재 DDL 기준으로는 키 컬럼만 있으므로 수정 대상이 없다. 향후 순번, 역할, 메모 컬럼이 추가되면 이 API에서 갱신한다.

## 삭제

`DELETE /pq/participating-engineers/{bidSeq}/{workDutyId}/{engrId}`

## 일괄 반영

`PUT /pq/participating-engineers`

화면의 `선정 목록 반영`에서 사용한다. 구현은 같은 `bidSeq`, `workDutyId`의 기존 rows를 삭제 후 요청 목록을 다시 insert한다.

```json
{
  "bidSeq": 20100001,
  "workDutyId": "100924",
  "engineers": [
    { "engrId": "99", "priority": 1, "role": "참여기술자", "memo": null }
  ]
}
```

현재 `PQ_FIND_ENGR_INFO` DDL에는 `ENGR_ID`, `WORK_DUTY_ID`, `BID_SEQ`만 있으므로 `priority`, `role`, `memo`는 저장하지 않거나 별도 컬럼 추가 후 저장한다.
