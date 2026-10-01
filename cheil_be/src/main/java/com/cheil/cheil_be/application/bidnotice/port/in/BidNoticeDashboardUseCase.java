package com.cheil.cheil_be.application.bidnotice.port.in;

import java.util.List;

/**
 * 입찰 공고 대시보드 조회 유스케이스의 inbound port입니다.
 * 웹 어댑터는 대시보드 서비스의 구현체가 아니라 이 계약에 의존합니다.
 */
public interface BidNoticeDashboardUseCase {

    List<BidNoticeCalendarEvent> findCalendarByMonth(int year, int month, String departmentCode);

    List<BidNoticeCalendarEvent> findCalendarByYearMonth(String yearMonth, String departmentCode);
}
