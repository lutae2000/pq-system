package com.cheil.cheil_be.adapter.out.persistence.g2bbidnotice;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateSearchCondition;
import com.cheil.cheil_be.application.g2bbidnotice.port.out.G2bBidNoticeCandidateRepository;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidate;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidateAttachment;

/** 후보 테이블 조회 SQL을 담당하는 JDBC 출력 어댑터입니다. */
@Repository
@RequiredArgsConstructor
public class JdbcG2bBidNoticeCandidateRepository implements G2bBidNoticeCandidateRepository {

    private static final String BASE_SELECT = """
            SELECT id, bid_ntce_no, bid_ntce_ord, bef_bid_bbanc_no,
                   ntce_kind_nm,
                   CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'bidMethdNm' ELSE raw_payload ->> 'bidMethdNm' END AS bid_methd_nm,
                   CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'cmmnSpldmdAgrmntRcptdocMethd' ELSE raw_payload ->> 'cmmnSpldmdAgrmntRcptdocMethd' END AS cmmn_spldmd_agrmnt_rcptdoc_methd,
                   CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'pqApplDocRcptMthdNm' ELSE raw_payload ->> 'pqApplDocRcptMthdNm' END AS pq_appl_doc_rcpt_mthd_nm,
                   CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'pqApplDocRcptDt' ELSE raw_payload ->> 'pqApplDocRcptDt' END AS pq_appl_doc_rcpt_dt,
                   cntrct_cncls_mthd_nm, srvce_div_nm,
                   prtcpt_lmt_rgn_cd, cmmn_spldmd_methd_nm,
                   sucsfbid_mthd_nm, indstryty_lmt_yn, pub_prcrmnt_mid_clsfc_nm,
                   pub_prcrmnt_clsfc_nm, sucsfbid_mthd_app_std, asign_bdgt_amt, bid_date,
                   bid_submission_date, pq_submit_date,
                   bid_ntce_nm, ntce_instt_nm,
                   COALESCE(dminstt_nm, CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'dminsttNm' ELSE raw_payload ->> 'dminsttNm' END) AS dminstt_nm,
                   COALESCE(dminstt_cd, CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'dminsttCd' ELSE raw_payload ->> 'dminsttCd' END) AS dminstt_cd,
                   bid_ntce_date,
                   CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'bidBeginDt' ELSE raw_payload ->> 'bidBeginDt' END AS bid_begin_dt,
                   CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'bidQlfctRgstDt' ELSE raw_payload ->> 'bidQlfctRgstDt' END AS bid_qlfct_rgst_dt,
                   bid_clse_dt, openg_dt, bid_ntce_url,
                   imported_at, imported_bid_seq,
                   ntce_spec_file_nm1, ntce_spec_doc_url1,
                   ntce_spec_file_nm2, ntce_spec_doc_url2,
                   ntce_spec_file_nm3, ntce_spec_doc_url3,
                   ntce_spec_file_nm4, ntce_spec_doc_url4,
                   ntce_spec_file_nm5, ntce_spec_doc_url5,
                   ntce_spec_file_nm6, ntce_spec_doc_url6,
                   ntce_spec_file_nm7, ntce_spec_doc_url7,
                   ntce_spec_file_nm8, ntce_spec_doc_url8,
                   ntce_spec_file_nm9, ntce_spec_doc_url9,
                   ntce_spec_file_nm10, ntce_spec_doc_url10
              FROM g2b_bid_notice_candidates
            """;

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void deleteAllById(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        String placeholders = String.join(", ", java.util.Collections.nCopies(ids.size(), "?"));
        jdbcTemplate.update(
                "DELETE FROM g2b_bid_notice_candidates WHERE id IN (" + placeholders + ")",
                ids.toArray()
        );
    }

    @Override
    public void markImported(Long candidateId, Long bidSeq, String importedBy) {
        jdbcTemplate.update(
                "UPDATE g2b_bid_notice_candidates SET imported_at = CURRENT_TIMESTAMP, imported_by = ?, imported_bid_seq = ? WHERE id = ?",
                StringUtils.hasText(importedBy) ? importedBy.trim() : "admin",
                bidSeq,
                candidateId
        );
    }

    @Override
    public List<G2bBidNoticeCandidateAttachment> findAttachmentsByImportedBidSeq(Long bidSeq) {
        String sql = """
                SELECT ntce_spec_file_nm1, ntce_spec_doc_url1,
                       ntce_spec_file_nm2, ntce_spec_doc_url2,
                       ntce_spec_file_nm3, ntce_spec_doc_url3,
                       ntce_spec_file_nm4, ntce_spec_doc_url4,
                       ntce_spec_file_nm5, ntce_spec_doc_url5,
                       ntce_spec_file_nm6, ntce_spec_doc_url6,
                       ntce_spec_file_nm7, ntce_spec_doc_url7,
                       ntce_spec_file_nm8, ntce_spec_doc_url8,
                       ntce_spec_file_nm9, ntce_spec_doc_url9,
                       ntce_spec_file_nm10, ntce_spec_doc_url10
                  FROM g2b_bid_notice_candidates
                 WHERE imported_bid_seq = ?
                 ORDER BY imported_at DESC NULLS LAST, id DESC
                 LIMIT 1
                """;
        return jdbcTemplate.query(sql, resultSet -> resultSet.next() ? loadAttachments(resultSet) : List.of(), bidSeq);
    }

    @Override
    public Optional<G2bBidNoticeCandidate> findByImportedBidSeq(Long bidSeq) {
        String sql = BASE_SELECT + " WHERE imported_bid_seq = ? ORDER BY imported_at DESC NULLS LAST, id DESC LIMIT 1";
        return jdbcTemplate.query(sql, resultSet -> resultSet.next()
                ? Optional.of(mapRow(resultSet, 0))
                : Optional.empty(), bidSeq);
    }

    @Override
    public Optional<G2bBidNoticeCandidate> findImportedByBidNoticeNumber(String bidNoticeNumber) {
        String sql = BASE_SELECT + " WHERE bid_ntce_no = ? AND imported_bid_seq IS NOT NULL ORDER BY imported_at DESC NULLS LAST, id DESC LIMIT 1";
        return jdbcTemplate.query(sql, resultSet -> resultSet.next()
                ? Optional.of(mapRow(resultSet, 0))
                : Optional.empty(), bidNoticeNumber);
    }

    @Override
    public Page<G2bBidNoticeCandidate> findAll(
            G2bBidNoticeCandidateSearchCondition condition,
            Pageable pageable
    ) {
        QueryParts queryParts = buildQueryParts(condition);
        String dataSql = BASE_SELECT + queryParts.whereClause()
                + queryParts.orderClause()
                + " LIMIT ? OFFSET ?";
        List<Object> dataParameters = new ArrayList<>(queryParts.parameters());
        dataParameters.add(pageable.getPageSize());
        dataParameters.add(pageable.getOffset());

        List<G2bBidNoticeCandidate> content = jdbcTemplate.query(
                dataSql,
                dataParameters.toArray(),
                this::mapRow
        );
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM g2b_bid_notice_candidates " + queryParts.whereClause(),
                queryParts.parameters().toArray(),
                Long.class
        );
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    private QueryParts buildQueryParts(G2bBidNoticeCandidateSearchCondition condition) {
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        List<Object> parameters = new ArrayList<>();
        addContains(where, parameters, "bid_ntce_no", value(condition == null ? null : condition.bidNoticeNumber()));
        addContainsAny(where, parameters, "ntce_kind_nm", value(condition == null ? null : condition.noticeKindName()));
        addContainsAny(where, parameters, "cntrct_cncls_mthd_nm", value(condition == null ? null : condition.contractConclusionMethodName()));
        addContainsAny(where, parameters, "srvce_div_nm", value(condition == null ? null : condition.serviceDivisionName()));
        addContains(where, parameters, "bid_ntce_nm", value(condition == null ? null : condition.bidNoticeName()));
        addContains(where, parameters, "ntce_instt_nm", value(condition == null ? null : condition.noticeInstitutionName()));
        addContains(where, parameters, "bef_bid_bbanc_no", value(condition == null ? null : condition.previousBidNoticeNumber()));
        addImportedFilter(where, parameters, value(condition == null ? null : condition.importedYn()));
        addRelatedNoticeFilter(where, parameters, value(condition == null ? null : condition.relatedBidNoticeNumbers()));
        String orderClause = condition != null && condition.orderById()
                ? " ORDER BY id ASC"
                : " ORDER BY bid_ntce_date DESC NULLS LAST, bid_ntce_no DESC, bid_ntce_ord DESC, id ASC";
        return new QueryParts(where.toString(), parameters, orderClause);
    }

    private void addContains(StringBuilder where, List<Object> parameters, String column, String value) {
        if (StringUtils.hasText(value)) {
            where.append(" AND LOWER(COALESCE(").append(column).append(", '')) LIKE ?");
            parameters.add("%" + value.toLowerCase(Locale.ROOT) + "%");
        }
    }

    private void addImportedFilter(StringBuilder where, List<Object> parameters, String values) {
        if (!StringUtils.hasText(values)) {
            return;
        }
        List<String> normalizedValues = java.util.Arrays.stream(values.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(value -> value.toUpperCase(Locale.ROOT))
                .distinct()
                .toList();
        if (normalizedValues.contains("Y") && !normalizedValues.contains("N")) {
            where.append(" AND imported_at IS NOT NULL");
        } else if (normalizedValues.contains("N") && !normalizedValues.contains("Y")) {
            where.append(" AND imported_at IS NULL");
        }
    }

    private void addRelatedNoticeFilter(StringBuilder where, List<Object> parameters, String values) {
        if (!StringUtils.hasText(values)) {
            return;
        }
        List<String> noticeNumbers = java.util.Arrays.stream(values.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        if (noticeNumbers.isEmpty()) {
            return;
        }
        String placeholders = String.join(", ", java.util.Collections.nCopies(noticeNumbers.size(), "?"));
        where.append(" AND (bid_ntce_no IN (").append(placeholders).append(") OR bef_bid_bbanc_no IN (").append(placeholders).append("))");
        parameters.addAll(noticeNumbers);
        parameters.addAll(noticeNumbers);
    }

    /**
     * 화면에서 전달한 쉼표 구분 다중 선택값을 OR 조건으로 조회한다.
     * 예: 기술용역,일반용역을 선택하면 두 값 중 하나라도 포함된 행을 반환한다.
     */
    private void addContainsAny(StringBuilder where, List<Object> parameters, String column, String values) {
        if (!StringUtils.hasText(values)) {
            return;
        }

        String[] candidates = values.split(",");
        List<String> normalizedCandidates = java.util.Arrays.stream(candidates)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(candidate -> candidate.toLowerCase(Locale.ROOT))
                .toList();
        if (normalizedCandidates.isEmpty()) {
            return;
        }

        where.append(" AND (");
        for (int index = 0; index < normalizedCandidates.size(); index++) {
            if (index > 0) {
                where.append(" OR ");
            }
            where.append("LOWER(COALESCE(").append(column).append(", '')) LIKE ?");
            parameters.add("%" + normalizedCandidates.get(index) + "%");
        }
        where.append(")");
    }

    private String value(String value) {
        return value == null ? null : value.trim();
    }

    private G2bBidNoticeCandidate mapRow(ResultSet resultSet, int rowNumber) throws SQLException {
        return new G2bBidNoticeCandidate(
                resultSet.getLong("id"),
                resultSet.getString("bid_ntce_no"),
                resultSet.getString("bid_ntce_ord"),
                resultSet.getString("bef_bid_bbanc_no"),
                resultSet.getString("ntce_kind_nm"),
                resultSet.getString("bid_methd_nm"),
                resultSet.getString("cmmn_spldmd_agrmnt_rcptdoc_methd"),
                resultSet.getString("pq_appl_doc_rcpt_mthd_nm"),
                resultSet.getString("pq_appl_doc_rcpt_dt"),
                resultSet.getString("cntrct_cncls_mthd_nm"),
                resultSet.getString("srvce_div_nm"),
                resultSet.getString("prtcpt_lmt_rgn_cd"),
                resultSet.getString("cmmn_spldmd_methd_nm"),
                resultSet.getString("sucsfbid_mthd_nm"),
                resultSet.getString("indstryty_lmt_yn"),
                resultSet.getString("pub_prcrmnt_mid_clsfc_nm"),
                resultSet.getString("pub_prcrmnt_clsfc_nm"),
                resultSet.getString("sucsfbid_mthd_app_std"),
                resultSet.getString("asign_bdgt_amt"),
                resultSet.getString("bid_date"),
                resultSet.getString("bid_submission_date"),
                resultSet.getString("pq_submit_date"),
                resultSet.getString("bid_ntce_nm"),
                resultSet.getString("ntce_instt_nm"),
                resultSet.getString("dminstt_nm"),
                resultSet.getString("dminstt_cd"),
                resultSet.getString("bid_ntce_date"),
                resultSet.getString("bid_begin_dt"),
                resultSet.getString("bid_qlfct_rgst_dt"),
                resultSet.getString("bid_clse_dt"),
                resultSet.getString("openg_dt"),
                resultSet.getString("bid_ntce_url"),
                resultSet.getString("imported_at"),
                resultSet.getObject("imported_bid_seq", Long.class),
                loadAttachments(resultSet)
        );
    }

    private List<G2bBidNoticeCandidateAttachment> loadAttachments(ResultSet resultSet) throws SQLException {
        List<G2bBidNoticeCandidateAttachment> attachments = new ArrayList<>();
        for (int sequence = 1; sequence <= 10; sequence++) {
            String fileName = resultSet.getString("ntce_spec_file_nm" + sequence);
            String downloadUrl = resultSet.getString("ntce_spec_doc_url" + sequence);
            if (StringUtils.hasText(fileName) || StringUtils.hasText(downloadUrl)) {
                attachments.add(new G2bBidNoticeCandidateAttachment(fileName, downloadUrl));
            }
        }
        return List.copyOf(attachments);
    }

    private record QueryParts(String whereClause, List<Object> parameters, String orderClause) {
    }
}
