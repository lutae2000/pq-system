# Cheil BE Agent Guide

## Project Overview
- Java 25 and Spring Boot 4.1 based backend.
- The product is an enterprise admin system for permissions, common codes, attachments, and audit logging.
- Main stack: JPA, Redis, Security, Actuator, Prometheus, Flyway, REST Docs.

## General Rules
- Use `apiClient` from `lib/http/apiClient.ts` for API calls.
- `apiClient` already injects `x-service-id` and `x-api-key`. Do not call `fetch` directly for secured APIs.
- All frontend API modules should use `apiClient` from `@/lib/http/apiClient` and `apiRequest` from `@/lib/http/apiRequest`.
- Do not add new `const response = await apiClient...; return response.data;` code in frontend API modules. Use `return apiRequest(apiClient.get<T>(...), "failure message")` so response extraction and error conversion stay centralized.
- Use `apiRequest` for FormData uploads as well. Let `apiClient` handle the multipart `Content-Type`.
- Request paths should be rooted under `/api`, which is proxied by Next.js.
- Keep common concerns in shared modules. Reuse existing helpers before creating new abstractions.

## Package Boundaries
- `domain`: pure business objects.
- `application`: use cases and services.
- `adapter/in`: HTTP entrypoints.
- `adapter/out`: database, Redis, file storage, and other outbound adapters.
- `config`: infrastructure configuration.
- `common`: shared utilities, shared services, and shared components.

## Java / Spring Rules
- Prefer constructor injection and `@RequiredArgsConstructor`.
- Use `@Component`, `@Service`, `@Repository`, and `@Configuration` only when the class is a real Spring stereotype.
- Keep interfaces separate from implementations.
- Use builders where they improve readability, especially for entity construction.
- For simple CRUD modules, prefer Spring Data JPA repository methods and JPQL `@Query` over Querydsl/custom query builders.
- When a search/list API is simple enough to express with JPQL, implement it in the repository interface first and keep adapter repository wrappers thin.

## API Rules
- Public token issuing endpoint is `POST /api/token`.
- Protected APIs must validate `x-service-id` and `x-api-key`.
- `x-service-id: server` is for development / test routes and bypasses API key validation.
- Document requests and responses with REST Docs.
- Use request VO objects when a request grows beyond a small set of parameters.
- Do not put request-to-command conversion methods such as `toCommand()` inside controllers.
- Request DTO/record classes should expose `toCommand()` when adapter request data needs to be converted into an application command.
- Controllers should stay thin: bind request parameters/body, call request DTO conversion if needed, delegate to the application service, and map the response DTO.
- Prefer designing list/search endpoints first, then add insert/update/delete flows.

## Frontend CRUD Rules
- For simple CRUD screens, prefer a standard list + modal detail/edit flow over a permanently visible side detail panel.
- If the detail UI naturally has sections or tabs, use a dialog with tabs as the default pattern.
- Keep simple CRUD screens light: standard grid, standard search panel, server paging, and minimal local state.

## Logging and Auditing
- API parameters and responses may be persisted for audit purposes, but do not log sensitive values.
- Audit logging should be done with AOP where possible.
- On auth failures, record the request scope and a masked response.
- If a log category should not appear in the console, disable it explicitly instead of filtering it ad hoc in code.

## Database Rules
- Keep the initial database schema in a single DDL file.
- Do not split the initial schema across multiple versioned Flyway files.
- If the schema needs a change during early development, update the single DDL file instead of adding a new versioned migration.
- Treat DDL as non-versioned during early bootstrap work; do not create additional `V*__*.sql` files for schema changes unless the project policy changes explicitly.
- Do not rely on JPA to create schema changes in a way that would drift from the DDL.
- Write all DDL comments in Korean noun phrases.
- Keep DDL comments and seed strings free of garbled text; verify the source file is saved as UTF-8 without BOM before editing or committing it.
- For PostgreSQL, prefer `Instant` when a real point-in-time value is required.
- JPA entities should match the actual table schema exactly.
- Keep `src/main/resources/data-dev.sql` saved as UTF-8 without BOM so Spring SQL initialization does not fail on an invisible leading character.

## Excel Upload / Migration Rules
- When the user uploads an Excel file and asks to create or migrate data, inspect the workbook sheet names, header row, row count, sample rows, and cell formats before writing SQL.
- If the uploaded Excel represents a new table or changes an existing table shape, produce the required PostgreSQL DDL together with the INSERT seed query.
- If an appropriate table already exists, generate the INSERT query against that table and clearly mention any Excel columns that cannot be stored because the table has no matching column.
- Convert Excel date-like values such as `yyyyMMdd`, `yyyyMMddHHmm`, and `yyyyMMddHHmmss` into SQL date/timestamp literals that match the target column type.
- Preserve source primary keys when the Excel contains a stable sequence/id column. For PostgreSQL identity columns, add a `setval(...)` statement after explicit id inserts so future auto-generated ids continue after the imported maximum id.
- Write generated migration/seed SQL files under `src/main/resources/db/query` unless the user explicitly asks for a Flyway migration.
- Keep generated SQL UTF-8 encoded and use PostgreSQL-safe string escaping.

## Entity Rules
- Use `@Builder` or `@SuperBuilder` for entities to keep construction readable.
- New entities that store audit metadata must inherit from `com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity`.
- The shared audit fields are `createdAt`, `createdId`, `lastChangedAt`, and `lastChangedId`.
- Use `@SuperBuilder` on entities that extend `AuditEntity`.
- Do not set audit timestamps manually in services or repositories when lifecycle hooks can handle them.
- `createdId` and `lastChangedId` should be populated from the current `ServicePrincipal` when available, and fall back to `"system"` when no service principal exists.
- For update flows on audited tables, load the existing entity, mutate it, and save that managed entity so `lastChangedAt` and `lastChangedId` are updated by JPA. Do not implement update as delete-and-reinsert for the same logical row.
- For insert flows, let `AuditEntity` populate both created and last changed fields automatically.
- When adding or changing an audited table during early development, update the single DDL file instead of adding a new Flyway versioned migration.

## Redis
- Use Redis cache only for frequently read APIs.
- Choose cache expiration values based on the expected freshness of the data.

## Security
- Password handling must use the shared password service.
- Token verification should be separated from session verification.
- Do not log secrets or personally sensitive values.

## Testing
- Write focused tests for the changed behavior.
- Prefer `WebMvcTest` for controllers and REST Docs generation where relevant.
- For shared business logic, add unit tests with clear edge cases.

## Useful Commands
```bash
./gradlew test
./gradlew build
./gradlew bootJar
```

## Important Paths
- API docs source: `src/docs/asciidoc/index.adoc`
- Generated docs: `build/docs/asciidoc/index.html`
- REST Docs snippets: `build/generated-snippets`
- Flyway migrations: `src/main/resources/db/migration`
