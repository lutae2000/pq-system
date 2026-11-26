ALTER TABLE pq_related_project_history_conditions
    ADD COLUMN condition_id BIGINT GENERATED ALWAYS AS IDENTITY,
    ADD COLUMN employee_no VARCHAR(20);

UPDATE pq_related_project_history_conditions AS conditions
SET employee_no = account.employee_no
FROM auth_users AS account
WHERE account.employee_no = COALESCE(NULLIF(BTRIM(conditions.last_changed_id), ''), NULLIF(BTRIM(conditions.created_id), ''));

-- Keep legacy rows with unknown owners while requiring an account for new writes.
ALTER TABLE pq_related_project_history_conditions
    DROP CONSTRAINT pq_related_project_history_conditions_pkey,
    ADD PRIMARY KEY (condition_id),
    ADD CONSTRAINT uq_pq_related_project_history_conditions_bid_employee UNIQUE (bid_seq, employee_no),
    ADD CONSTRAINT fk_pq_related_project_history_conditions_employee
        FOREIGN KEY (employee_no) REFERENCES auth_users (employee_no) ON DELETE CASCADE,
    ADD CONSTRAINT ck_pq_related_project_history_conditions_employee_required
        CHECK (employee_no IS NOT NULL) NOT VALID;

CREATE INDEX idx_pq_related_project_history_conditions_employee_no
    ON pq_related_project_history_conditions (employee_no);

COMMENT ON TABLE pq_related_project_history_conditions IS '계정 및 공고별 관련 프로젝트 이력 검색 조건';
COMMENT ON COLUMN pq_related_project_history_conditions.condition_id IS '조건 설정 행 식별자';
COMMENT ON COLUMN pq_related_project_history_conditions.employee_no IS '조건 소유 계정의 사번, 소유자를 확인할 수 없는 기존 조건은 NULL';
