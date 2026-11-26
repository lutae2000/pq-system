ALTER TABLE pq_related_project_history_conditions RENAME TO pq_history_settings;
ALTER TABLE pq_history_settings
    ADD COLUMN company_targets JSONB NOT NULL DEFAULT '[]',
    DROP CONSTRAINT ck_pq_related_project_history_conditions_employee_required;

ALTER SEQUENCE pq_company_performance_document_targets_target_id_seq OWNED BY NONE;
ALTER SEQUENCE pq_company_performance_document_targets_target_id_seq RENAME TO pq_company_target_id_seq;
SELECT setval('pq_company_target_id_seq', GREATEST(
    (SELECT last_value FROM pq_company_target_id_seq),
    COALESCE((SELECT MAX(target_id) FROM pq_company_performance_document_targets), 1)
));

CREATE TEMP TABLE migrated_pq_company_targets ON COMMIT DROP AS
SELECT t.bid_seq, account.employee_no,
       jsonb_agg(jsonb_build_object(
           'target_id', t.target_id,
           'company_performance_seq', t.company_performance_seq,
           'display_order', t.display_order
       ) ORDER BY t.display_order NULLS LAST, t.target_id) AS targets
FROM pq_company_performance_document_targets t
LEFT JOIN auth_users account
    ON account.employee_no = COALESCE(NULLIF(BTRIM(t.created_id), ''), NULLIF(BTRIM(t.last_changed_id), ''))
GROUP BY t.bid_seq, account.employee_no;

INSERT INTO pq_history_settings (bid_seq, employee_no, company_targets, created_id, last_changed_id)
SELECT bid_seq, employee_no, targets, employee_no, employee_no
FROM migrated_pq_company_targets
WHERE employee_no IS NOT NULL
ON CONFLICT (bid_seq, employee_no) DO UPDATE SET company_targets = EXCLUDED.company_targets;

-- Keep unowned selections available for data recovery without exposing them to another account.
UPDATE pq_history_settings settings
SET company_targets = migrated.targets
FROM migrated_pq_company_targets migrated
WHERE settings.bid_seq = migrated.bid_seq
  AND settings.employee_no IS NULL
  AND migrated.employee_no IS NULL;

INSERT INTO pq_history_settings (bid_seq, company_targets)
SELECT migrated.bid_seq, migrated.targets
FROM migrated_pq_company_targets migrated
WHERE migrated.employee_no IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM pq_history_settings settings
      WHERE settings.bid_seq = migrated.bid_seq AND settings.employee_no IS NULL
  );

ALTER TABLE pq_history_settings
    ADD CONSTRAINT ck_pq_history_settings_employee_required CHECK (employee_no IS NOT NULL) NOT VALID,
    ADD CONSTRAINT ck_pq_history_settings_company_targets_array CHECK (jsonb_typeof(company_targets) = 'array');

ALTER TABLE pq_history_settings
    RENAME CONSTRAINT uq_pq_related_project_history_conditions_bid_employee TO uq_pq_history_settings_bid_employee;
ALTER TABLE pq_history_settings
    RENAME CONSTRAINT fk_pq_related_project_history_conditions_employee TO fk_pq_history_settings_employee;
ALTER INDEX idx_pq_related_project_history_conditions_employee_no RENAME TO ix_pq_history_settings_employee;

COMMENT ON TABLE pq_history_settings IS '공고 및 사번별 관련공사 조건과 회사실적 문서 대상';
COMMENT ON COLUMN pq_history_settings.company_targets IS '선정된 회사실적 식별자와 표시 순서';

DROP TABLE pq_company_performance_document_targets;
