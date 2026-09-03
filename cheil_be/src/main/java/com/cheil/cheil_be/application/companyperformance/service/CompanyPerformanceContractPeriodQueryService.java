package com.cheil.cheil_be.application.companyperformance.service;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceContractPeriodRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceContractPeriodResponse;

/** 회사실적의 계약기간을 조회하고 기간별 참여 정보를 관리하는 서비스. */
@Service
@RequiredArgsConstructor
public class CompanyPerformanceContractPeriodQueryService {

    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public List<CompanyPerformanceContractPeriodResponse> findByPerformanceSeq(Long seq) {
        if (seq == null) {
            return List.of();
        }

        return jdbcClient.sql("""
                        SELECT id, seq, contract_from_date, contract_to_date, sort_seq
                        FROM company_performance_contract_periods
                        WHERE seq = :seq
                        ORDER BY sort_seq NULLS LAST, contract_from_date NULLS LAST, id
                        """)
                .param("seq", seq)
                .query((rs, rowNum) -> toResponse(
                        rs.getLong("id"),
                        rs.getLong("seq"),
                        rs.getString("contract_from_date"),
                        rs.getString("contract_to_date"),
                        rs.getObject("sort_seq", Integer.class)
                ))
                .list();
    }

    @Transactional
    public CompanyPerformanceContractPeriodResponse create(Long seq, CompanyPerformanceContractPeriodRequest request) {
        String contractFromDate = normalizeDate(request.contractFromDate(), "contractFromDate");
        String contractToDate = normalizeDate(request.contractToDate(), "contractToDate");
        validateDateRange(contractFromDate, contractToDate);

        Long id = jdbcClient.sql("""
                        INSERT INTO company_performance_contract_periods (
                            seq, contract_from_date, contract_to_date, sort_seq
                        )
                        VALUES (
                            :seq, :contractFromDate, :contractToDate, :sortSeq
                        )
                        RETURNING id
                        """)
                .param("seq", seq)
                .param("contractFromDate", contractFromDate)
                .param("contractToDate", contractToDate)
                .param("sortSeq", request.sortSeq())
                .query(Long.class)
                .single();
        return findById(seq, id);
    }

    @Transactional
    public CompanyPerformanceContractPeriodResponse update(Long seq, Long id, CompanyPerformanceContractPeriodRequest request) {
        String contractFromDate = normalizeDate(request.contractFromDate(), "contractFromDate");
        String contractToDate = normalizeDate(request.contractToDate(), "contractToDate");
        validateDateRange(contractFromDate, contractToDate);

        int updated = jdbcClient.sql("""
                        UPDATE company_performance_contract_periods
                        SET contract_from_date = :contractFromDate,
                            contract_to_date = :contractToDate,
                            sort_seq = :sortSeq,
                            last_changed_at = CURRENT_TIMESTAMP
                        WHERE id = :id AND seq = :seq
                        """)
                .param("id", id)
                .param("seq", seq)
                .param("contractFromDate", contractFromDate)
                .param("contractToDate", contractToDate)
                .param("sortSeq", request.sortSeq())
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "계약기간 정보를 찾을 수 없습니다.");
        }
        return findById(seq, id);
    }

    @Transactional
    public void delete(Long seq, Long id) {
        int updated = jdbcClient.sql("DELETE FROM company_performance_contract_periods WHERE id = :id AND seq = :seq")
                .param("id", id)
                .param("seq", seq)
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "계약기간 정보를 찾을 수 없습니다.");
        }
    }

    private CompanyPerformanceContractPeriodResponse findById(Long seq, Long id) {
        return jdbcClient.sql("""
                        SELECT id, seq, contract_from_date, contract_to_date, sort_seq
                        FROM company_performance_contract_periods
                        WHERE id = :id AND seq = :seq
                        """)
                .param("id", id)
                .param("seq", seq)
                .query((rs, rowNum) -> toResponse(
                        rs.getLong("id"),
                        rs.getLong("seq"),
                        rs.getString("contract_from_date"),
                        rs.getString("contract_to_date"),
                        rs.getObject("sort_seq", Integer.class)
                ))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "계약기간 정보를 찾을 수 없습니다."));
    }

    private CompanyPerformanceContractPeriodResponse toResponse(
            Long id,
            Long seq,
            String contractFromDate,
            String contractToDate,
            Integer sortSeq
    ) {
        Period period = calculatePeriod(contractFromDate, contractToDate);
        return new CompanyPerformanceContractPeriodResponse(
                id,
                seq,
                contractFromDate,
                contractToDate,
                period.getYears() * 12 + period.getMonths(),
                period.getDays(),
                sortSeq
        );
    }

    private Period calculatePeriod(String contractFromDate, String contractToDate) {
        if (!StringUtils.hasText(contractFromDate) || !StringUtils.hasText(contractToDate)) {
            return Period.ZERO;
        }
        LocalDate from = LocalDate.parse(contractFromDate, BASIC_DATE);
        LocalDate to = LocalDate.parse(contractToDate, BASIC_DATE);
        if (to.isBefore(from)) {
            return Period.ZERO;
        }
        return Period.between(from, to.plusDays(1));
    }

    private String normalizeDate(String value, String fieldName) {
        String normalized = StringUtils.hasText(value) ? value.trim().replace("-", "") : null;
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "는 필수입니다.");
        }
        try {
            LocalDate.parse(normalized, BASIC_DATE);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " 형식이 올바르지 않습니다.");
        }
        return normalized;
    }

    private void validateDateRange(String contractFromDate, String contractToDate) {
        LocalDate from = LocalDate.parse(contractFromDate, BASIC_DATE);
        LocalDate to = LocalDate.parse(contractToDate, BASIC_DATE);
        if (to.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "계약기간 종료일은 시작일보다 빠를 수 없습니다.");
        }
    }
}
