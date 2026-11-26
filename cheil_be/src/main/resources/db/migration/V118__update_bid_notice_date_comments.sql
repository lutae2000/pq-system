COMMENT ON COLUMN bid_notices.bid_date IS '입찰서 제출 마감일';
COMMENT ON COLUMN bid_notices.bid_closing_date IS '협정서 제출 마감일';
COMMENT ON COLUMN bid_notices.tp_submit_date IS '제안서 제출일자';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE attrelid = 'bid_notices'::regclass
          AND attname = 'bid_submission_date'
          AND NOT attisdropped
    ) THEN
        COMMENT ON COLUMN bid_notices.bid_submission_date IS '개찰일';
    ELSE
        COMMENT ON COLUMN bid_notices.bid_submission IS '개찰일';
    END IF;
END
$$;
