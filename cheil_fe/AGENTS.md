# 프론트엔드 작업 규칙

- 인증이 필요한 API 호출은 반드시 `lib/http/apiClient.ts`의 `apiClient`를 사용한다.
- `apiClient`는 `x-service-id`와 `x-api-key`를 자동으로 포함한다. 보안이 필요한 API에 `fetch`를 직접 쓰지 않는다.
- 모든 API 모듈은 `@/lib/http/apiClient`의 `apiClient`와 `@/lib/http/apiRequest`의 `apiRequest`를 함께 사용한다.
- API 모듈에서는 `const response = await apiClient...; return response.data;` 패턴을 새로 만들지 않는다. `return apiRequest(apiClient.get<T>(...), "실패 메시지")` 형태로 응답 추출과 에러 메시지 변환을 공통화한다.
- FormData 업로드도 `apiRequest(apiClient.post<T>(url, formData), "...")`를 사용한다. `apiClient`가 FormData 요청의 `Content-Type`을 자동 처리하므로 직접 multipart 헤더를 고정하지 않는다.
- 요청 경로는 Next.js가 노출하는 `/api` 기준으로 작성한다. 예: `apiClient.get("/auth/users")`
- HTTP 타입은 한 곳에서 공통으로 관리하고, 각 모듈은 필요한 타입만 재사용한다.
- 여러 화면에서 반복 조회하는 역할, 사용자, 부서, 공사종류, 공통코드 옵션은 `modules/common/reference`의 reference API와 hook을 우선 사용한다.
- 셀렉트 UI가 필요하면 `components/common/reference-selects`의 `RoleSelect`, `UserSelect`, `DepartmentSelect`, `ConstructionTypeSelect`, `CommonCodeLevel1Select`, `CommonCodeLevel2Select`를 우선 사용한다.
- 화면마다 `useQuery`와 옵션 변환 함수를 새로 만들지 않는다. 특수 필터가 필요하면 reference hook의 `params`로 전달하고, 공통화가 필요한 새 조회 API는 `referenceApi.ts`와 `useReferenceOptions.ts`에 추가한다.
- reference 조회는 조회 전용 공통 데이터에만 사용한다. 저장/수정/삭제가 필요한 관리 화면 API는 각 업무 모듈의 `api.ts`에 둔다.
- reference hook은 `{ items, options, labelByValue }`를 반환한다. 셀렉트는 `options`, 그리드/상세의 코드명 변환은 `labelByValue`, 원본 레코드가 필요하면 `items`를 사용한다.
- reference hook의 query key는 `["references", 도메인명, params]` 형식을 유지하고, 기본 캐시 시간은 `REFERENCE_STALE_TIME`을 사용한다.
- 새 공통 reference를 추가할 때는 `referenceApi.ts`에 `get...References()`, `useReferenceOptions.ts`에 `use...Options()`, 필요하면 `components/common/reference-selects/ReferenceSelects.tsx`에 `...Select`를 함께 추가한다.
- reference option의 `value`는 화면 저장값과 동일한 코드 값을 사용하고, `label`은 사용자가 볼 이름으로 만든다. 중복 value는 `referenceApi.ts`의 공통 변환 로직에서 제거되므로 임의로 중복 option을 만들지 않는다.
- 로컬에서 `x-api-key`가 바뀌면 `.env.local`과 `.env.development`, 백엔드의 `APP_APPLICATION_API_KEY` 값을 같은 값으로 맞춘다.
- `next.config.ts`에는 API 인증 헤더를 직접 주입하지 않는다. 요청 헤더 관리는 `apiClient`에서만 처리한다.
- 기존 기능을 수정할 때는 먼저 같은 화면과 비슷한 모듈이 있는지 확인하고, 그 구조를 우선 따른다.
- 데이터를 업데이트하거나 삭제할 때는 반드시 다이얼로그로 한 번 더 확인한 뒤 작업을 진행한다.
- 저장, 삭제, 조회 결과처럼 화면 전역에서 재사용 가능한 알림은 `useAppSnackbar()`를 우선 사용한다.
- 전역 알림은 `AppProviders`에 이미 연결된 `AppSnackbarProvider`를 재사용하고, 화면별 `Snackbar` state는 신규 작성하지 않는다.
- 모든 업무 화면은 활성 탭 기준으로 `Breadcrumbs`가 보이도록 구성한다. `AppShell`이 아니라 탭 렌더링 레이어에서 활성 탭에만 노출하는 구조를 유지한다.
- 새 화면에서 조회, 요약, 옵션 로딩용 `useQuery`를 추가할 때는 탭 활성 상태를 함께 고려한다. 기본적으로 `useTabQueryEnabled()` 또는 `useTabActivity()`를 사용해 비활성 탭에서는 조회가 돌지 않도록 한다.
- 탭이 많아져도 복귀 시 사용자가 보던 페이지, 필터, 선택 상태가 유지되어야 하므로 일반 업무 화면은 비활성 시에도 mount를 유지하는 것을 기본값으로 본다.
- 일반 업무 화면은 비활성 탭에서 DOM은 유지하되 무거운 조회와 불필요한 렌더만 멈추는 방향을 기본 전략으로 사용한다.
- `dashboard`처럼 초기 렌더와 조회 비용이 큰 화면은 다른 메뉴로 이동해 비활성 탭이 되면 unmount할 수 있다.
- 초기 화면의 LCP를 낮추기 위해 페이지 제목, 기본 레이아웃, 조회조건처럼 즉시 보여야 하는 UI와 무거운 업무 콘텐츠의 로딩을 분리한다. 데이터 조회가 완료될 때까지 페이지 전체를 조건부로 숨기거나 빈 화면으로 만들지 않는다.
- 상세/편집 다이얼로그, 대형 팝업, 차트, 웹 에디터, 엑셀 다운로드 모듈처럼 초기 화면에 필요하지 않은 무거운 컴포넌트는 정적 import하지 말고 `next/dynamic`으로 지연 로딩한다. 닫힌 다이얼로그는 `open={false}`로 항상 렌더링하지 말고 실제 열림 상태에서만 렌더링한다.
- 업무 화면의 초기 조회는 현재 활성 탭이고 실제 조회조건 또는 선택 대상이 준비된 경우에만 실행한다. 선택 대상이 없는 상세/하위 Grid API, 검색어가 비어 있는 자동완성 API, 열지 않은 다이얼로그의 조회 API는 호출하지 않는다.
- Grid는 대량 데이터를 한 번에 렌더링하지 않도록 서버 페이지네이션과 적절한 `pageSize`를 우선 사용하고, `rows`, 컬럼 정의, 변환 결과는 `useMemo`로 안정화한다. 행마다 무거운 컴포넌트나 반복 계산을 직접 렌더링하지 않는다.
- 화면 성능을 수정한 뒤에는 대상 화면 ESLint와 TypeScript 검사를 실행하고, Chrome Performance에서 개발 모드뿐 아니라 `next build` 후 운영 모드의 LCP 및 초기 네트워크 요청도 확인한다.
- 검색용 `TextField`에서 `조회` 버튼이 함께 쓰이면, Enter 키를 눌렀을 때도 동일한 조회 동작이 실행되도록 만든다.
- 가능하면 검색 영역은 `form`과 `onSubmit`으로 묶고, 어렵다면 검색어 입력 필드의 `onKeyDown`에서 Enter를 `onSearch`로 연결한다.
- 이미 공통 검색 패널이 있으면 우선 재사용하고, 새로운 검색 UI를 만들 때도 같은 Enter 동작 규칙을 유지한다.
- 조회조건 컴포넌트는 `value`만 연결하고 `onChange`를 빠뜨리지 않는다. 텍스트 입력, 선택 입력, 날짜 입력 모두 화면 상태와 양방향으로 연결되어야 한다.
- 조회조건 초기화 시에는 필터뿐 아니라 선택 row, 체크 상태, 페이지 번호 같은 화면 상태도 함께 어떤 값으로 돌아갈지 명확히 정의한다.
- 크기 조절이 필요한 카드는 `components/common/ResizableCard`를 우선 사용한다. 손잡이만 따로 만들지 말고, 좌측/우측/하단 조절은 공통 카드와 `ResizeHandle` 조합으로 처리한다.
- 그리드에서 row 클릭 동작과 체크박스 선택 동작이 함께 있는 경우 두 상호작용을 분리해서 설계한다. 필요 시 공통 그리드 옵션으로 row click에 의한 checkbox toggle 여부를 제어한다.
- 선택형 목록을 별도 필터로 보여주는 화면은 "선택된 목록만 보기" 상태에서도 상세 패널 조회가 깨지지 않도록, 체크 상태와 상세 조회 대상을 별도 상태로 관리하는 것을 우선 검토한다.
- 공통 조회 옵션 훅, 공통 셀렉트, 첨부파일 패널처럼 여러 화면에서 재사용되는 컴포넌트는 탭 비활성 최적화 대상인지 먼저 검토하고 공통 레벨에서 막을 수 있으면 공통에서 처리한다.
- 저장, 조회, 삭제, 신규 버튼은 반드시 메뉴 권한과 연결한다.
- 조회 버튼은 `canRead`, 신규 버튼은 `canCreate`, 저장 버튼은 `canCreate` 또는 `canUpdate`, 삭제 버튼은 `canDelete`를 기준으로 제어한다.
- 새 화면을 만들 때는 `useCurrentMenuPermission()`을 우선 확인하고, 공통 `SearchPanel`에는 `searchDisabled={!canRead}`를 넘기며, 직접 만든 버튼도 동일한 권한 기준으로 `disabled` 처리한다.
- 권한이 없는 사용자는 버튼이 눌리지 않도록 해야 하며, 필요하면 버튼을 숨기기보다 비활성화 상태로 일관되게 보여준다.
- 기술자 인사정보 같은 관리 화면은 저장 흐름을 단순하게 유지한다. 마스터 저장과 자식 섹션 저장은 분리하고, 일괄 재저장이나 전체 프로필 병합 로직은 두지 않는다.
- 백엔드 신규 구현은 기존 스택이 이미 JDBC 중심이면 그대로 단순 SQL/JDBC로 유지한다. JPQL이나 QueryDSL은 유지보수 이점이 분명할 때만 도입하고, 복잡한 추상화보다 읽기 쉬운 코드를 우선한다.

## HWPX 템플릿 필드 매핑

- 기술인실적, 회사실적, 업무중복도 HWPX 양식의 필드명은 화면에 매핑 규칙을 하드코딩하지 않고 해당 PQ 공통코드의 `ref_value1`을 사용한다.
- HWPX 업로드 시 필드명을 공통코드의 `code_detail_name`, `code_name`, `level3_code`와 매칭하고, 매칭된 `ref_value1` 경로를 생성 요청의 `mappings`에 담는다.
- `ref_value1`에는 `row.contractTerm`, `row.workTerm`처럼 백엔드가 허용하는 데이터 경로만 저장한다. 필드명의 날짜 형식, 금액 단위, 기간 단위는 경로에 넣지 않고 원래 필드명으로 표현한다.
- 기술인실적 필드 그룹은 `PQ/HG`(기본), `PQ/HH`(경력), `PQ/HI`(이력)를 사용한다. 회사실적과 업무중복도도 화면별 공통코드 그룹을 조회하며, 그룹 코드는 각 패널의 reference 설정을 기준으로 유지한다. 공통코드 조회는 `modules/common/reference`의 그룹 조회 hook을 재사용한다.
- 새 필드를 추가할 때는 먼저 공통코드에 표시명과 `ref_value1`을 등록한 뒤, 업로드 화면의 매핑 경로와 문서 생성 결과를 함께 확인한다.

업무 모듈별 책임과 프론트·백엔드 연결 관계는 `README.md`의 업무 모듈 안내를 기준으로 확인한다. 공통 기능을 새로 만들기 전에 같은 영역의 `api.ts`, reference hook, 페이지 컴포넌트와 공통 컴포넌트가 이미 있는지 검색한다.

## 프론트엔드 클린 아키텍처

업무 페이지는 화면 조합만 담당하고, 조회·저장·삭제·검증·캐시 무효화는 application 계층으로 이동한다. 새 기능을 추가하거나 기존 페이지를 크게 수정할 때는 다음 의존성 방향을 지킨다.

```text
app/page.tsx
  -> modules/**/**Page.tsx (presentation composition)
    -> application/use*.ts (use case and query orchestration)
      -> domain/models.ts, domain/*.ts (business types and pure rules)
        -> api.ts or application/port/out contracts
          -> lib/http/apiClient.ts, lib/http/apiRequest.ts
```

- `app/**/page.tsx`는 App Router 진입점으로만 사용한다. 업무 API, `useQuery`, `useMutation`, 폼 상태를 직접 작성하지 않는다.
- `*Page.tsx`는 권한, 탭 활성 상태, 화면 전용 상태, 다이얼로그 표시 여부, 자식 presentation component 조합을 담당한다.
- `*Page.tsx`에서 `api.ts`의 조회·저장·삭제 함수를 직접 호출하지 않는다. 페이지는 application hook이 반환한 query와 command만 사용한다.
- `*Page.tsx`에 업무 규칙을 넣지 않는다. 날짜 정렬, 중복 제거, 표시 순번 계산, 요청 payload 조합, 상태 전이 규칙은 application 또는 domain으로 이동한다.
- `presentation/`에는 Grid, 필터, 카드, 컬럼 정의처럼 화면 표시와 사용자 입력에 관한 코드를 둔다. API 호출과 query cache 조작은 두지 않는다.
- `application/`에는 use case별 hook과 query key, 입력 command, 결과 조합을 둔다. `useQuery`, `useMutation`, 권한 확인 결과, 성공·실패 후 캐시 무효화의 조합은 이 계층의 책임이다.
- `domain/`에는 업무 모델, 상태값, 순수 변환·검증 함수를 둔다. React, MUI, TanStack Query, axios, `apiClient`, Web API, 화면 DTO를 import하지 않는다.
- `api.ts`는 HTTP output adapter로 취급한다. URL, HTTP method, query parameter, request/response API 타입, `apiRequest()` 호출만 둔다. 화면 상태나 snackbar, query key, React hook을 두지 않는다.
- application에서 `apiClient`, `apiRequest`를 직접 호출하지 않는다. 기존 구조상 `api.ts`를 직접 사용하는 단계라면 새 기능부터 application port 또는 업무 API 함수로 감싸고, 점진적으로 adapter 경계를 만든다.
- application port와 domain에는 `GridApi`, `GridRowParams`, MUI event, React synthetic event, web DTO를 노출하지 않는다. Grid 정렬 결과나 사용자 입력은 페이지에서 application command 또는 일반 TypeScript 값으로 변환해 전달한다.

### 업무 모듈 기본 구조

새 업무 모듈은 기능 규모에 따라 아래 구조를 우선 검토한다.

```text
modules/<area>/<feature>/
  api.ts                         # HTTP output adapter and API DTO
  domain/models.ts               # domain/application models
  domain/rules.ts                # pure business rules, when needed
  application/queryKeys.ts       # feature query-key factory
  application/use<Feature>.ts    # query and mutation orchestration
  presentation/<Feature>Grid.tsx
  presentation/<Feature>Filters.tsx
  <Feature>Page.tsx              # screen composition and local UI state
```

작은 단순 조회 화면은 `application/`을 생략할 수 있지만, 다음 중 하나라도 있으면 application 계층을 만든다.

- 조회가 두 개 이상이고 선택 대상이나 탭 상태에 따라 서로 의존한다.
- 저장·수정·삭제·일괄 처리·동기화 mutation이 있다.
- mutation 이후 두 개 이상의 query를 무효화하거나 다른 업무 모듈을 함께 갱신한다.
- API 응답을 화면 행으로 변환하거나 여러 API 응답을 하나의 화면 모델로 조합한다.
- 권한, 선택 상태, 순번, 중복 제거, 기간 계산 같은 업무 규칙이 있다.

### Query와 mutation 규칙

- query와 mutation은 application hook에서 선언하고 페이지에는 결과와 command를 반환한다.
- 페이지 하나에서 같은 업무 mutation을 두 번 선언하지 않는다. application hook으로 이동한 mutation은 페이지에 레거시 구현을 남기지 않는다.
- query key는 `application/queryKeys.ts`에서 factory로 관리한다. 페이지나 mutation 안에 문자열 배열을 새로 하드코딩하지 않는다.
- 같은 feature의 전체 목록을 무효화할 때는 `all`, 특정 항목을 무효화할 때는 구체적인 factory key를 사용한다.
- query의 `enabled`는 `canRead`, `useTabQueryEnabled()`, 선택 대상의 존재 여부를 모두 반영한다. 비활성 탭이나 선택 대상이 없는 상세 query를 실행하지 않는다.
- mutation의 권한 검사는 버튼의 `disabled`만 믿지 말고 application command에서도 수행한다.
- mutation 성공 후에는 관련 query key를 application 계층에서 무효화하고, 페이지는 필요한 화면 상태만 초기화한다.
- 여러 mutation을 한 번에 실행할 때는 부분 성공 가능성을 검토한다. 서로 독립된 요청만 `Promise.all`로 묶고, 순서가 중요한 요청은 순차 실행한다.
- API 에러를 페이지에서 임의의 문자열로 변환하지 않는다. API adapter의 공통 에러 처리와 application의 업무별 fallback 메시지를 사용한다.

### 타입과 DTO 규칙

- API 응답 타입과 화면 행 타입을 같은 타입으로 재사용하지 않는다. API 응답은 `api.ts`, 업무 모델은 `domain/`, 화면 행은 `presentation` 또는 application mapper에 둔다.
- `api.ts`의 타입이 특정 Dialog나 Grid 파일에서 export되도록 만들지 않는다. 여러 계층에서 사용하는 타입은 `domain/models.ts` 또는 API 전용 타입 파일에 둔다.
- inbound 화면 입력은 application command로 명시적으로 변환한다. `FormEvent`, `GridRowParams`, MUI selection model을 application에 전달하지 않는다.
- API 응답을 화면에 그대로 전달하지 말고 필요한 경우 `toViewModel`, `toRow`, `toRequest` 같은 명시적인 변환 함수를 둔다.
- `null`, 빈 문자열, 선택적 컬럼의 기본값은 domain/application 변환 단계에서 정한다. 각 JSX 셀에서 같은 null 처리를 반복하지 않는다.
- 코드값을 화면에 표시할 때는 reference hook의 `labelByValue`를 application 또는 presentation mapper에 주입한다. 페이지마다 같은 코드명 변환 함수를 새로 만들지 않는다.

### 상태와 이벤트 규칙

- 서버 상태는 TanStack Query가 소유하고, 선택 행·다이얼로그·패널 크기·현재 탭 같은 일시적 화면 상태만 React state가 소유한다.
- 서버 응답을 필요 이상으로 별도 React state에 복제하지 않는다. 사용자가 편집 중인 draft처럼 원본과 다른 값이 필요한 경우에만 분리한다.
- 같은 대상의 `selectedIds`와 `activeId`는 의미가 다르면 별도 상태로 둔다. 체크 상태를 상세 조회 대상의 대체값으로 사용하지 않는다.
- row 클릭, checkbox 클릭, Ctrl/Meta 다중 선택, Shift 범위 선택은 presentation component에서 이벤트를 해석하고 application에는 최종 ID 목록만 전달한다.
- 화면 초기화는 필터, 선택 행, active 대상, 페이지 번호, anchor, pending dialog 상태를 함께 정의한다. 일부 상태만 초기화해 이전 대상의 상세 query가 남지 않게 한다.
- `useCallback`, `useMemo`는 자식 Grid의 props 안정화나 실제 비용이 있는 변환에만 사용한다. 무조건 모든 함수를 감싸지 않는다.

### 권한, 알림, 외부 연동

- `useCurrentMenuPermission()`은 페이지에서 읽되, 권한에 따른 업무 실행 차단은 application command에서도 확인한다.
- `useAppSnackbar()`의 표시 함수 자체를 domain이나 `api.ts`에 전달하지 않는다. application hook에는 `showSuccess`, `showError` 같은 좁은 callback만 주입할 수 있다.
- Excel, HWPX, 파일 다운로드처럼 브라우저 API가 필요한 기능은 application에서 순수 업무 데이터와 파일 작업을 분리한다. `window`, `Blob`, anchor click은 presentation adapter 또는 전용 service에 둔다.
- 다른 업무 모듈의 API를 함께 갱신해야 하는 경우 application use case에서 orchestration하고, 페이지에서 두 API를 연속 호출하지 않는다.
- 공통코드·reference 조회는 전용 reference hook을 사용하고, 해당 결과의 캐시 정책과 무효화 규칙을 임의로 덮어쓰지 않는다.

### 기존 페이지 개선 순서

기존 페이지를 리팩터링할 때는 한 번에 UI를 다시 만들지 말고 다음 순서로 진행한다.

1. 페이지에서 API 호출, query key, mutation, 업무 변환 함수를 목록화한다.
2. `domain/models.ts`에 API 모델과 화면 모델을 구분하고, 순수 규칙을 domain으로 이동한다.
3. `application/queryKeys.ts`와 `application/use<Feature>.ts`를 만든다.
4. 조회와 mutation을 application hook으로 옮기고, 성공 후 캐시 무효화를 같은 hook에 둔다.
5. 페이지가 직접 참조하는 API 호출과 중복 mutation을 제거한다. 옮긴 뒤 레거시 구현을 남기지 않는다.
6. Grid와 필터를 `presentation/`으로 분리하고, 페이지에는 조합과 화면 상태만 남긴다.
7. 타입 검사, 대상 ESLint, 관련 테스트를 실행한다. 기존 오류가 있으면 새 오류와 구분해 기록한다.

### 제출 전 아키텍처 점검

- `*Page.tsx`에 `apiClient`, `apiRequest`, 직접 API 함수 호출이 없는가?
- 페이지에 `useQuery`와 `useMutation`이 남아 있다면 단순 조회 화면인지, application으로 이동해야 할 업무 로직인지 설명 가능한가?
- 같은 mutation 또는 query key가 페이지와 application에 중복 선언되지 않았는가?
- domain이 React, MUI, TanStack Query, axios, API adapter를 의존하지 않는가?
- application이 Dialog, Grid, DTO, `window` 같은 presentation/infrastructure 세부사항을 받지 않는가?
- mutation의 권한 검사, 성공 후 캐시 무효화, 실패 알림이 한 곳에 모여 있는가?
- API 모델, domain 모델, 화면 행 타입의 경계가 명확한가?
- 비활성 탭, 선택 대상 없음, 빈 응답, null 선택 컬럼에서 불필요한 조회나 전체 화면 실패가 발생하지 않는가?
- 리팩터링 후 기존 레거시 구현과 새 구현이 동시에 실행되지 않는가?

## 인코딩 및 한글 텍스트 주의사항

- 한글이 들어간 파일은 셸 리다이렉션, `Set-Content`, `Out-File`, `>`, `>>`로 직접 덮어쓰지 않는다. UTF-8 저장이 끝까지 보장되는 경우에만 사용한다.
- 한글 UI 문구, 안내 문구, SQL 주석, 마크다운 문서를 수정할 때는 가능하면 `apply_patch`를 우선 사용한다.
- 한글이 포함된 파일을 수정한 뒤에는 다시 열어서 한글이 정상적으로 유지됐는지, 그리고 JSX나 SQL 문법이 깨지지 않았는지 확인한다.
- 콘솔에서 글자가 깨져 보여도 바로 파일을 다시 쓰지 않는다. 먼저 표시 문제인지 확인하고, 파일 재저장으로 인코딩 손상을 키우지 않는다.
- 한 번에 넓은 범위를 고치기보다, 한글 변경은 가능한 한 작은 단위로 나눠서 적용한다.
