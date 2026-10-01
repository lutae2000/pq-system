package com.cheil.cheil_be.application.newemployment.port.out;

import java.util.List;

import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatusPivot;

/**
 * 월별 고용 현황 조회에 필요한 데이터만 정의하는 outbound port입니다.
 * SQL과 JdbcClient는 이 계약의 구현체인 persistence adapter에만 둡니다.
 */
public interface NewEmploymentMonthlyStatusReader {

    List<NewEmploymentMonthlyStatus> findMonthlyStatuses(String baseYearMonth, String departmentCode, int monthCount);

    List<NewEmploymentMonthlyStatusPivot> findMonthlyStatusPivot(String baseYearMonth, boolean previousYear);
}
