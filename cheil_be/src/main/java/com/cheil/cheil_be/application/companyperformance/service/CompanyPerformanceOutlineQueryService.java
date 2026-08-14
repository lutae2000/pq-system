package com.cheil.cheil_be.application.companyperformance.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineResponse;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceOutlineQueryService {

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public List<CompanyPerformanceOutlineResponse> findByPerformanceSeq(Long seq) {
        if (seq == null) {
            return List.of();
        }

        return jdbcClient.sql("""
                        SELECT id, seq, otln_gseq, otln_lseq, cate_code, subcate_code, cate_name, subcate_name,
                               subcate_unit, otln_cont, ddlb_yn, ddlbgroup_code, sort_seq
                        FROM company_performance_outlines
                        WHERE seq = :seq
                        ORDER BY sort_seq NULLS LAST, otln_gseq NULLS LAST, otln_lseq NULLS LAST, id
                        """)
                .param("seq", seq)
                .query((rs, rowNum) -> new CompanyPerformanceOutlineResponse(
                        rs.getLong("id"),
                        rs.getLong("seq"),
                        rs.getObject("otln_gseq", Integer.class),
                        rs.getObject("otln_lseq", Integer.class),
                        rs.getString("cate_code"),
                        rs.getString("subcate_code"),
                        rs.getString("cate_name"),
                        rs.getString("subcate_name"),
                        rs.getString("subcate_unit"),
                        rs.getString("otln_cont"),
                        rs.getString("ddlb_yn"),
                        rs.getString("ddlbgroup_code"),
                        rs.getObject("sort_seq", Integer.class)
                ))
                .list();
    }

    @Transactional
    public CompanyPerformanceOutlineResponse create(Long seq, CompanyPerformanceOutlineRequest request) {
        Long id = jdbcClient.sql("""
                        INSERT INTO company_performance_outlines (
                            seq, otln_gseq, otln_lseq, cate_code, subcate_code, cate_name, subcate_name,
                            subcate_unit, otln_cont, ddlb_yn, ddlbgroup_code, sort_seq
                        )
                        VALUES (
                            :seq, :otlnGseq, :otlnLseq, :cateCode, :subcateCode, :cateName, :subcateName,
                            :subcateUnit, :otlnCont, :ddlbYn, :ddlbGroupCode, :sortSeq
                        )
                        RETURNING id
                        """)
                .param("seq", seq)
                .param("otlnGseq", request.outlineGroupSeq())
                .param("otlnLseq", request.outlineLineSeq())
                .param("cateCode", normalize(request.categoryCode()))
                .param("subcateCode", normalize(request.subcategoryCode()))
                .param("cateName", normalize(request.categoryName()))
                .param("subcateName", normalize(request.subcategoryName()))
                .param("subcateUnit", normalize(request.subcategoryUnit()))
                .param("otlnCont", normalize(request.outlineContent()))
                .param("ddlbYn", normalizeYn(request.ddlbYn()))
                .param("ddlbGroupCode", normalize(request.ddlbGroupCode()))
                .param("sortSeq", request.sortSeq())
                .query(Long.class)
                .single();
        return findById(seq, id);
    }

    @Transactional
    public CompanyPerformanceOutlineResponse update(Long seq, Long id, CompanyPerformanceOutlineRequest request) {
        int updated = jdbcClient.sql("""
                        UPDATE company_performance_outlines
                        SET otln_gseq = :otlnGseq,
                            otln_lseq = :otlnLseq,
                            cate_code = :cateCode,
                            subcate_code = :subcateCode,
                            cate_name = :cateName,
                            subcate_name = :subcateName,
                            subcate_unit = :subcateUnit,
                            otln_cont = :otlnCont,
                            ddlb_yn = :ddlbYn,
                            ddlbgroup_code = :ddlbGroupCode,
                            sort_seq = :sortSeq,
                            last_changed_at = CURRENT_TIMESTAMP
                        WHERE id = :id AND seq = :seq
                        """)
                .param("id", id)
                .param("seq", seq)
                .param("otlnGseq", request.outlineGroupSeq())
                .param("otlnLseq", request.outlineLineSeq())
                .param("cateCode", normalize(request.categoryCode()))
                .param("subcateCode", normalize(request.subcategoryCode()))
                .param("cateName", normalize(request.categoryName()))
                .param("subcateName", normalize(request.subcategoryName()))
                .param("subcateUnit", normalize(request.subcategoryUnit()))
                .param("otlnCont", normalize(request.outlineContent()))
                .param("ddlbYn", normalizeYn(request.ddlbYn()))
                .param("ddlbGroupCode", normalize(request.ddlbGroupCode()))
                .param("sortSeq", request.sortSeq())
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공사개요 정보를 찾을 수 없습니다.");
        }
        return findById(seq, id);
    }

    @Transactional
    public void delete(Long seq, Long id) {
        int updated = jdbcClient.sql("DELETE FROM company_performance_outlines WHERE id = :id AND seq = :seq")
                .param("id", id)
                .param("seq", seq)
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공사개요 정보를 찾을 수 없습니다.");
        }
    }

    private CompanyPerformanceOutlineResponse findById(Long seq, Long id) {
        return jdbcClient.sql("""
                        SELECT id, seq, otln_gseq, otln_lseq, cate_code, subcate_code, cate_name, subcate_name,
                               subcate_unit, otln_cont, ddlb_yn, ddlbgroup_code, sort_seq
                        FROM company_performance_outlines
                        WHERE id = :id AND seq = :seq
                        """)
                .param("id", id)
                .param("seq", seq)
                .query((rs, rowNum) -> new CompanyPerformanceOutlineResponse(
                        rs.getLong("id"),
                        rs.getLong("seq"),
                        rs.getObject("otln_gseq", Integer.class),
                        rs.getObject("otln_lseq", Integer.class),
                        rs.getString("cate_code"),
                        rs.getString("subcate_code"),
                        rs.getString("cate_name"),
                        rs.getString("subcate_name"),
                        rs.getString("subcate_unit"),
                        rs.getString("otln_cont"),
                        rs.getString("ddlb_yn"),
                        rs.getString("ddlbgroup_code"),
                        rs.getObject("sort_seq", Integer.class)
                ))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공사개요 정보를 찾을 수 없습니다."));
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeYn(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        return normalized.equalsIgnoreCase("Y") ? "Y" : "N";
    }
}
