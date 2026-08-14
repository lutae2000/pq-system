# Cheil PQ Frontend

Cheil PQ 업무 시스템의 프론트엔드 프로젝트입니다. Next.js App Router 기반으로 대시보드, 공지, 기초정보, 시스템 권한, PQ 업무 화면을 구성합니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Framework | Next.js 16 App Router |
| Runtime | React 19 |
| Language | TypeScript |
| UI | MUI |
| Grid | MUI X Data Grid |
| Server State | TanStack Query |
| Client State | Zustand |
| Package Manager | npm |

## 주요 경로

| 경로 | 역할 |
| --- | --- |
| `app/` | App Router 라우트, 레이아웃, 페이지 |
| `components/` | 공통 UI 컴포넌트 |
| `modules/` | 업무 도메인별 화면/API 모듈 |
| `lib/` | 공통 유틸, HTTP, 권한, provider |
| `store/` | Zustand 상태 저장소 |
| `types/` | 전역 타입 |
| `public/` | 정적 자산 |

## 실행 방법

| 명령어 | 설명 |
| --- | --- |
| `npm install` | 패키지 설치 |
| `npm run dev` | 개발 서버 실행 |
| `npm run dev:local` | 로컬 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |

기본 개발 서버는 `http://localhost:3000`에서 실행됩니다.

## 환경 변수

| 변수 | 설명 |
| --- | --- |
| `NEXT_API_BASE_URL` | 백엔드 API rewrite 대상 주소 |
| `NEXT_API_KEY` | API 호출용 `x-api-key` 값 |
| `NEXT_SERVICE_ID` | API 호출용 `x-service-id` 값 |

환경별 파일은 `.env.local`, `.env.development`, `.env.production`을 사용합니다.

## API 호출 규칙

- 인증이 필요한 API는 `lib/http/apiClient.ts`의 `apiClient`를 사용합니다.
- API 모듈은 `apiRequest()`로 응답 추출과 에러 메시지 변환을 공통 처리합니다.
- 화면 컴포넌트에서 `apiClient`를 직접 호출하지 말고, 각 업무 모듈의 `api.ts` 또는 공통 reference hook을 사용합니다.

```ts
return apiRequest(
  apiClient.get<MyResponse>("/code/example"),
  "목록을 불러오지 못했습니다.",
);
```

## 공통 Reference 조회 사용 가이드

여러 화면에서 반복해서 조회하는 코드성 데이터는 `modules/common/reference`를 우선 사용합니다. 역할, 사용자, 부서, 공사종류, 공통코드처럼 셀렉트 옵션이나 코드명 표시 용도로 자주 쓰이는 데이터를 화면마다 `useQuery`로 새로 만들지 않기 위한 공통 기능입니다.

### 제공 위치

| 파일 | 역할 |
| --- | --- |
| `modules/common/reference/referenceApi.ts` | 공통 조회 API 호출과 `{ items, options, labelByValue }` 변환 |
| `modules/common/reference/useReferenceOptions.ts` | React Query hook과 캐시 정책 |
| `components/common/reference-selects/ReferenceSelects.tsx` | 업무용 셀렉트 컴포넌트 |

### 사용할 수 있는 Hook

| Hook | 용도 |
| --- | --- |
| `useRoleOptions()` | 역할 조회 |
| `useUserOptions()` | 사용자 조회 |
| `useDepartmentOptions()` | 부서 조회 |
| `useConstructionTypeOptions()` | 공사종류 조회 |
| `useCommonCodeLevel1Options()` | 공통코드 1레벨 조회 |
| `useCommonCodeLevel2Options(level1Code)` | 특정 1레벨 하위의 공통코드 2레벨 조회 |

각 hook은 아래 값을 반환합니다.

```ts
const { items, options, labelByValue, isLoading, isError } = useDepartmentOptions();
```

| 반환값 | 사용 예 |
| --- | --- |
| `items` | 원본 API 레코드가 필요할 때 |
| `options` | 셀렉트 옵션 렌더링 |
| `labelByValue` | 그리드나 상세 화면에서 코드값을 이름으로 표시 |

### 셀렉트 컴포넌트 사용

단순 셀렉트는 `components/common/reference-selects`의 컴포넌트를 사용합니다.

```tsx
import { DepartmentSelect, RoleSelect } from "@/components/common/reference-selects";

<DepartmentSelect
  label="부서"
  value={draft.deptCode}
  onChange={(value) => updateDraft("deptCode", value)}
/>

<RoleSelect
  label="역할"
  value={draft.groupCode}
  onChange={(value) => updateDraft("groupCode", value)}
/>
```

검색 조건처럼 "전체" 옵션이 필요하면 `includeAll`을 사용합니다.

```tsx
<DepartmentSelect
  includeAll
  label="부서"
  value={filters.deptCode}
  onChange={(value) => setFilters((current) => ({ ...current, deptCode: value || "All" }))}
/>
```

특정 조건으로 조회해야 하면 `params`를 넘깁니다.

```tsx
<UserSelect
  label="담당자"
  params={{ deptCode: selectedDeptCode, useYn: "Y" }}
  value={draft.loginId}
  onChange={(value) => updateDraft("loginId", value)}
/>
```

공통코드 2레벨은 기준 1레벨 코드를 넘겨 사용합니다.

```tsx
<CommonCodeLevel2Select
  label="거래처 분류"
  level1Code="QA"
  value={draft.orderClass}
  onChange={(value) => updateDraft("orderClass", value)}
/>
```

### 코드명을 표시하는 방법

그리드에서 코드값 대신 이름을 보여줄 때는 hook의 `labelByValue`를 사용합니다.

```tsx
const { labelByValue: departmentLabelByCode } = useDepartmentOptions();

const columns = [
  {
    field: "deptCode",
    headerName: "부서",
    valueGetter: (_value, row) => departmentLabelByCode[row.deptCode] ?? row.deptCode,
  },
];
```

### 새 공통 Reference 추가 방법

예를 들어 `거래처` reference를 추가한다면 아래 순서로 작성합니다.

1. 업무 API가 없으면 먼저 업무 모듈에 조회 함수를 만듭니다.

```ts
// modules/code/clients/api.ts
export async function listClientCodes(params: ClientCodeSearchParams): Promise<ClientCodePageResponse> {
  return apiRequest(
    apiClient.get<ClientCodePageResponse>("/code/client-codes", { params }),
    "거래처 목록을 불러오지 못했습니다.",
  );
}
```

2. `referenceApi.ts`에 option 변환 함수를 추가합니다.

```ts
export async function getClientReferences(params: ClientReferenceSearchParams = {}) {
  const page = await listClientCodes({ page: 0, size: 200, ...params });

  return toResult(
    page.content,
    (client) => ({
      label: client.orderName,
      value: client.clientCode,
    }),
  );
}
```

3. `useReferenceOptions.ts`에 hook을 추가합니다.

```ts
export function useClientOptions(params: ClientReferenceSearchParams = {}, options?: ReferenceQueryOptions<ClientCodeRecord>) {
  return useReferenceQuery(["references", "clients", params], () => getClientReferences(params), options);
}
```

4. 셀렉트가 자주 필요하면 `ReferenceSelects.tsx`에 래퍼 컴포넌트를 추가하고 `index.ts`에서 export합니다.

```tsx
export function ClientSelect({ params = {}, ...props }: ReferenceSelectProps & { params?: ClientReferenceSearchParams }) {
  const { isLoading, options } = useClientOptions(params);

  return (
    <ReferenceSelect {...props} isLoading={isLoading}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </ReferenceSelect>
  );
}
```

### 작성 기준

- 조회 전용 공통 데이터만 reference로 추가합니다.
- 저장, 수정, 삭제가 필요한 화면 API는 각 업무 모듈의 `api.ts`에 둡니다.
- 화면마다 `useQuery`, `mapOption`, `labelByValue`를 새로 만들지 않습니다.
- 캐시 키는 `["references", "도메인명", params]` 형태를 유지합니다.
- option의 `value`는 DB/API에 저장되는 코드값, `label`은 사용자에게 보여줄 이름으로 만듭니다.
- reference 기본 캐시 시간은 `REFERENCE_STALE_TIME`을 사용합니다.

## 개발 규칙

- 기존 공통 컴포넌트와 모듈 구조를 먼저 확인하고 재사용합니다.
- 조회용 grid는 `EnterpriseDataGrid`를 우선 사용합니다.
- 검색 입력은 Enter 키로도 조회가 실행되도록 구성합니다.
- 저장, 조회, 삭제, 신규 버튼은 메뉴 권한과 연결합니다.
- 한글 문구가 들어간 파일은 UTF-8 인코딩이 깨지지 않도록 주의합니다.
