package com.cheil.cheil_be.application.companyperformance.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindResponse;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceConstructionKindQueryService {

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public List<CompanyPerformanceConstructionKindResponse> findByPerformanceSeq(Long seq) {
        if (seq == null) {
            return List.of();
        }

        return jdbcClient.sql("""
                        select k.id, k.seq, k.level1_code, k.level2_code, k.level3_code, code_name
                        from company_performance_construction_kinds k, construction_type c
                        where 1=1
                        and k.seq = :seq
                        and c.use_yn = true
                        and k.level1_code = c.level1_code
                        and k.level2_code = c.level2_code
                        and k.level3_code = c.level3_code
                        """)
                .param("seq", seq)
                .query((rs, rowNum) -> new CompanyPerformanceConstructionKindResponse(
                        rs.getLong("id"),
                        rs.getLong("seq"),
                        rs.getString("level1_code"),
                        rs.getString("level2_code"),
                        rs.getString("level3_code")
                ))
                .list();
    }

    @Transactional
    public CompanyPerformanceConstructionKindResponse create(Long seq, CompanyPerformanceConstructionKindRequest request) {
        Long id = jdbcClient.sql("""
                        INSERT INTO company_performance_construction_kinds (
                            seq, level1_code, level2_code, level3_code
                        )
                        VALUES (
                            :seq, :level1Code, :level2Code, :level3Code
                        )
                        RETURNING id
                        """)
                .param("seq", seq)
                .param("level1Code", required(request.level1Code(), "level1Code"))
                .param("level2Code", required(request.level2Code(), "level2Code"))
                .param("level3Code", required(request.level3Code(), "level3Code"))
                .query(Long.class)
                .single();
        return findById(seq, id);
    }

    @Transactional
    public CompanyPerformanceConstructionKindResponse update(Long seq, Long id, CompanyPerformanceConstructionKindRequest request) {
        int updated = jdbcClient.sql("""
                        UPDATE company_performance_construction_kinds
                        SET level1_code = :level1Code,
                            level2_code = :level2Code,
                            level3_code = :level3Code,
                            last_changed_at = CURRENT_TIMESTAMP
                        WHERE id = :id AND seq = :seq
                        """)
                .param("id", id)
                .param("seq", seq)
                .param("level1Code", required(request.level1Code(), "level1Code"))
                .param("level2Code", required(request.level2Code(), "level2Code"))
                .param("level3Code", required(request.level3Code(), "level3Code"))
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공사종류 정보를 찾을 수 없습니다.");
        }
        return findById(seq, id);
    }

    @Transactional
    public void delete(Long seq, Long id) {
        int updated = jdbcClient.sql("DELETE FROM company_performance_construction_kinds WHERE id = :id AND seq = :seq")
                .param("id", id)
                .param("seq", seq)
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공사종류 정보를 찾을 수 없습니다.");
        }
    }

    private CompanyPerformanceConstructionKindResponse findById(Long seq, Long id) {
        return jdbcClient.sql("""
                        SELECT id, seq, level1_code, level2_code, level3_code
                        FROM company_performance_construction_kinds
                        WHERE id = :id AND seq = :seq
                        """)
                .param("id", id)
                .param("seq", seq)
                .query((rs, rowNum) -> new CompanyPerformanceConstructionKindResponse(
                        rs.getLong("id"),
                        rs.getLong("seq"),
                        rs.getString("level1_code"),
                        rs.getString("level2_code"),
                        rs.getString("level3_code")
                ))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공사종류 정보를 찾을 수 없습니다."));
    }

    private String required(String value, String fieldName) {
        String normalized = StringUtils.hasText(value) ? value.trim() : null;
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "은 필수입니다.");
        }
        return normalized;
    }
}
