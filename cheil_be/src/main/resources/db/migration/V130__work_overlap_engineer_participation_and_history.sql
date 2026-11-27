ALTER TABLE cheileng.work_overlap_contract_engineers
    ADD COLUMN IF NOT EXISTS participation_end_date varchar(8);

COMMENT ON COLUMN cheileng.work_overlap_contract_engineers.participation_date IS '참여시작일';
COMMENT ON COLUMN cheileng.work_overlap_contract_engineers.participation_end_date IS '참여종료일';

DO $$
DECLARE
    legacy_column text;
    before_column text;
BEGIN
    -- 이전 SQL을 수동 적용한 DB에서는 변경 전 이력값을 컬럼명과 함께 보존한다.
    FOR legacy_column, before_column IN
        SELECT * FROM (VALUES
            ('field', 'before_field'),
            ('participation_type', 'before_participation_type'),
            ('participation_start_date', 'before_participation_start_date'),
            ('participation_end_date', 'before_participation_end_date')
        ) AS columns(old_name, new_name)
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_catalog.pg_attribute
            WHERE attrelid = 'cheileng.work_overlap_contract_engineer_histories'::regclass
              AND attname = legacy_column AND NOT attisdropped
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_attribute
            WHERE attrelid = 'cheileng.work_overlap_contract_engineer_histories'::regclass
              AND attname = before_column AND NOT attisdropped
        ) THEN
            EXECUTE format(
                'ALTER TABLE cheileng.work_overlap_contract_engineer_histories RENAME COLUMN %I TO %I',
                legacy_column, before_column
            );
        END IF;
    END LOOP;
END
$$;

ALTER TABLE cheileng.work_overlap_contract_engineer_histories
    ADD COLUMN IF NOT EXISTS before_field varchar(100),
    ADD COLUMN IF NOT EXISTS before_participation_type varchar(100),
    ADD COLUMN IF NOT EXISTS before_participation_start_date varchar(8),
    ADD COLUMN IF NOT EXISTS before_participation_end_date varchar(8),
    ADD COLUMN IF NOT EXISTS after_field varchar(100),
    ADD COLUMN IF NOT EXISTS after_participation_type varchar(100),
    ADD COLUMN IF NOT EXISTS after_participation_start_date varchar(8),
    ADD COLUMN IF NOT EXISTS after_participation_end_date varchar(8);

COMMENT ON COLUMN cheileng.work_overlap_contract_engineer_histories.before_field IS '변경 전 기술인의 분야';
COMMENT ON COLUMN cheileng.work_overlap_contract_engineer_histories.before_participation_type IS '변경 전 기술인의 참여구분';
COMMENT ON COLUMN cheileng.work_overlap_contract_engineer_histories.before_participation_start_date IS '변경 전 기술인의 참여시작일';
COMMENT ON COLUMN cheileng.work_overlap_contract_engineer_histories.before_participation_end_date IS '변경 전 기술인의 참여종료일';
COMMENT ON COLUMN cheileng.work_overlap_contract_engineer_histories.after_field IS '변경 후 기술인의 분야';
COMMENT ON COLUMN cheileng.work_overlap_contract_engineer_histories.after_participation_type IS '변경 후 기술인의 참여구분';
COMMENT ON COLUMN cheileng.work_overlap_contract_engineer_histories.after_participation_start_date IS '변경 후 기술인의 참여시작일';
COMMENT ON COLUMN cheileng.work_overlap_contract_engineer_histories.after_participation_end_date IS '변경 후 기술인의 참여종료일';

DO $$
DECLARE
    max_history_id bigint;
    sequence_value bigint;
    sequence_called boolean;
BEGIN
    LOCK TABLE cheileng.work_overlap_contract_engineer_histories IN SHARE ROW EXCLUSIVE MODE;

    SELECT max(id) INTO max_history_id
    FROM cheileng.work_overlap_contract_engineer_histories;

    SELECT last_value, is_called INTO sequence_value, sequence_called
    FROM cheileng.work_overlap_contract_engineer_histories_id_seq;

    IF max_history_id > sequence_value OR (max_history_id = sequence_value AND NOT sequence_called) THEN
        EXECUTE format(
            'ALTER SEQUENCE cheileng.work_overlap_contract_engineer_histories_id_seq RESTART WITH %s',
            max_history_id + 1
        );
    END IF;
END
$$;
