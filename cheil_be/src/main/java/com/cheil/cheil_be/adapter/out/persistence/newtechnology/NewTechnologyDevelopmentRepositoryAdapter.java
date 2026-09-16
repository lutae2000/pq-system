package com.cheil.cheil_be.adapter.out.persistence.newtechnology;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyDevelopmentRequest;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyDevelopmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class NewTechnologyDevelopmentRepositoryAdapter implements NewTechnologyDevelopmentRepository {
    private final JdbcClient jdbcClient;
    private static final String COLUMNS = "id, sequence_label, title, technology_type, applicant_count, use_yn, application_date, target_field, application_no, registration_no, valid_until, calculated_score, summary, remark, created_at, created_id, last_changed_at, last_changed_id";

    @Override
    public Page<Record> findAll(String keyword, String technologyType, String targetField, String applicationDateFrom, String applicationDateTo, Boolean useYn, Pageable pageable) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n"); Map<String,Object> params = new LinkedHashMap<>();
        if (text(keyword)) { where.append("AND (LOWER(title) LIKE :keyword OR LOWER(COALESCE(application_no,'')) LIKE :keyword OR LOWER(COALESCE(registration_no,'')) LIKE :keyword OR LOWER(COALESCE(summary,'')) LIKE :keyword OR LOWER(COALESCE(remark,'')) LIKE :keyword)\n"); params.put("keyword", "%"+keyword.trim().toLowerCase()+"%"); }
        if (text(technologyType)) { where.append("AND technology_type = :technologyType\n"); params.put("technologyType", technologyType.trim()); }
        if (text(targetField)) { where.append("AND LOWER(COALESCE(target_field,'')) LIKE :targetField\n"); params.put("targetField", "%"+targetField.trim().toLowerCase()+"%"); }
        if (text(applicationDateFrom)) { where.append("AND application_date >= :applicationDateFrom\n"); params.put("applicationDateFrom", applicationDateFrom); }
        if (text(applicationDateTo)) { where.append("AND application_date <= :applicationDateTo\n"); params.put("applicationDateTo", applicationDateTo); }
        where.append("AND use_yn = :useYn\n"); params.put("useYn", useYn == null || useYn);
        Map<String,Object> listParams = new LinkedHashMap<>(params); listParams.put("limit", pageable.getPageSize()); listParams.put("offset", pageable.getOffset());
        String sql = "SELECT " + COLUMNS + " FROM new_technology_developments " + where + " ORDER BY application_date NULLS LAST, id DESC LIMIT :limit OFFSET :offset";
        List<Record> content = bind(jdbcClient.sql(sql), listParams).query((rs,n) -> map(rs)).list();
        Long total = bind(jdbcClient.sql("SELECT COUNT(*) FROM new_technology_developments " + where), params).query(Long.class).single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }
    @Override public Record findById(Long id) { return jdbcClient.sql("SELECT " + COLUMNS + " FROM new_technology_developments WHERE id=:id").param("id", id).query((rs,n)->map(rs)).optional().orElse(null); }
    @Override public Long create(NewTechnologyDevelopmentRequest r, String actor) { return jdbcClient.sql("INSERT INTO new_technology_developments (sequence_label,title,technology_type,applicant_count,use_yn,application_date,target_field,application_no,registration_no,valid_until,calculated_score,summary,remark,created_id,last_changed_id) VALUES (:sequenceLabel,:title,:technologyType,:applicantCount,:useYn,:applicationDate,:targetField,:applicationNo,:registrationNo,:validUntil,:calculatedScore,:summary,:remark,:actor,:actor) RETURNING id").param("sequenceLabel",r.sequenceLabel()).param("title",r.title()).param("technologyType",r.technologyType()).param("applicantCount",r.applicantCount()).param("useYn",r.useYn()==null||r.useYn()).param("applicationDate",r.applicationDate()).param("targetField",r.targetField()).param("applicationNo",r.applicationNo()).param("registrationNo",r.registrationNo()).param("validUntil",r.validUntil()).param("calculatedScore",r.calculatedScore()).param("summary",r.summary()).param("remark",r.remark()).param("actor",actor).query(Long.class).single(); }
    @Override public int update(Long id, NewTechnologyDevelopmentRequest r, String actor) { return jdbcClient.sql("UPDATE new_technology_developments SET sequence_label=:sequenceLabel,title=:title,technology_type=:technologyType,applicant_count=:applicantCount,use_yn=:useYn,application_date=:applicationDate,target_field=:targetField,application_no=:applicationNo,registration_no=:registrationNo,valid_until=:validUntil,calculated_score=:calculatedScore,summary=:summary,remark=:remark,last_changed_at=CURRENT_TIMESTAMP,last_changed_id=:actor WHERE id=:id").param("id",id).param("sequenceLabel",r.sequenceLabel()).param("title",r.title()).param("technologyType",r.technologyType()).param("applicantCount",r.applicantCount()).param("useYn",r.useYn()==null||r.useYn()).param("applicationDate",r.applicationDate()).param("targetField",r.targetField()).param("applicationNo",r.applicationNo()).param("registrationNo",r.registrationNo()).param("validUntil",r.validUntil()).param("calculatedScore",r.calculatedScore()).param("summary",r.summary()).param("remark",r.remark()).param("actor",actor).update(); }
    @Override public int delete(Long id) { return jdbcClient.sql("DELETE FROM new_technology_developments WHERE id=:id").param("id",id).update(); }
    private Record map(java.sql.ResultSet rs) throws java.sql.SQLException { return new Record(rs.getLong("id"),rs.getString("sequence_label"),rs.getString("title"),rs.getString("technology_type"),rs.getBigDecimal("applicant_count"),rs.getBoolean("use_yn"),rs.getString("application_date"),rs.getBigDecimal("calculated_score"),rs.getString("target_field"),rs.getString("application_no"),rs.getString("registration_no"),rs.getString("valid_until"),rs.getString("summary"),rs.getString("remark"),instant(rs.getTimestamp("created_at")),rs.getString("created_id"),instant(rs.getTimestamp("last_changed_at")),rs.getString("last_changed_id")); }
    private java.time.Instant instant(Timestamp value){return value==null?null:value.toInstant();} private boolean text(String value){return value!=null&&!value.trim().isEmpty();} private JdbcClient.StatementSpec bind(JdbcClient.StatementSpec s,Map<String,Object> p){JdbcClient.StatementSpec b=s;for(var e:p.entrySet())b=b.param(e.getKey(),e.getValue());return b;}
}
