package com.cheil.cheil_be.application.companyperformance.port.in;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;

/**
 * 회사 실적의 생성·조회·수정·삭제를 정의하는 inbound port입니다.
 * 웹 어댑터는 구체 서비스가 아니라 이 계약에 의존합니다.
 */
public interface CompanyPerformanceAdminUseCase {

    Page<CompanyPerformance> findAll(CompanyPerformanceSearchCondition condition, Pageable pageable);

    CompanyPerformance findById(Long seq);

    CompanyPerformance create(CompanyPerformanceUpsertCommand command);

    List<CompanyPerformance> createAll(List<CompanyPerformanceUpsertCommand> commands);

    CompanyPerformance update(Long seq, CompanyPerformanceUpsertCommand command);

    void delete(Long seq);
}
