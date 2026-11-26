-- 명시적인 bid_seq를 사용해 이관된 데이터 이후에도 신규 공고문이
-- 기존 bid_seq와 충돌하지 않도록 Identity 시퀀스를 현재 최대값에 맞춘다.
DO $$
DECLARE
    sequence_name TEXT;
    max_bid_seq BIGINT;
BEGIN
    sequence_name := pg_get_serial_sequence('bid_notices', 'bid_seq');
    SELECT MAX(bid_seq) INTO max_bid_seq FROM bid_notices;

    IF sequence_name IS NOT NULL THEN
        PERFORM setval(
            sequence_name,
            COALESCE(max_bid_seq, 0),
            max_bid_seq IS NOT NULL
        );
    END IF;
END
$$;
