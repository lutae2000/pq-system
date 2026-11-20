-- Keep existing employee numbers and convert remaining writer login IDs.
UPDATE bid_notices notice
SET super_decide_empno = account.employee_no
FROM auth_users account
WHERE NULLIF(BTRIM(notice.super_decide_empno), '') = account.login_id
  AND NOT EXISTS (
      SELECT 1
      FROM auth_users current_writer
      WHERE current_writer.employee_no = BTRIM(notice.super_decide_empno)
  );
