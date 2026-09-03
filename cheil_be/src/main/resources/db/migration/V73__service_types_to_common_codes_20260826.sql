-- service_types의 서비스 유형 코드를 공통코드(ST) 2레벨로 이관한다.
INSERT INTO common_codes (
    code_level,
    level1_code,
    level2_code,
    level3_code,
    code_name,
    code_detail_name,
    ref_value1,
    sort_order,
    remark,
    use_yn
)
SELECT
    2,
    'ST',
    source.service_type_code,
    NULL,
    source.service_type_name,
    NULL,
    NULL,
    code_order.sort_order,
    NULL,
    source.use_yn
FROM (
    VALUES
        ('r', 1), ('1', 2), ('2', 3), ('3', 4), ('4', 5),
        ('5', 6), ('6', 7), ('7', 8), ('8', 9), ('9', 10),
        ('b', 11), ('a', 12), ('c', 13), ('e', 14), ('f', 15),
        ('g', 16), ('h', 17), ('i', 18), ('j', 19), ('k', 20),
        ('l', 21), ('m', 22), ('o', 23), ('p', 24), ('q', 25),
        ('A', 26), ('s', 27), ('B', 28), ('t', 29), ('x', 30),
        ('w', 31), ('y', 32)
) AS code_order(level2_code, sort_order)
JOIN service_types source
  ON source.service_type_code = code_order.level2_code
ON CONFLICT (code_level, level1_code, level2_code, level3_code) DO UPDATE
SET code_name = EXCLUDED.code_name,
    sort_order = EXCLUDED.sort_order,
    use_yn = EXCLUDED.use_yn;
