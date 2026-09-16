package com.cheil.cheil_be.adapter.out.persistence.newtechnology;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyUsageRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyUsageResponse;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class NewTechnologyUsageRepositoryAdapter implements NewTechnologyUsageRepository {
    private final JdbcClient jdbcClient;
    private static final String COLUMNS = "id, designation_no, title, developers, project_name, client, notice_date, usage_expiration_date, usage_count, amount_thousand, score, summary, weight, disaster_prevention_score, remark, created_at, created_id, last_changed_at, last_changed_id";

    @Override
    public Page<NewTechnologyUsageResponse> findAll(String keyword, String designationNo, String client, String noticeDateFrom, String noticeDateTo, Pageable pageable) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n"); Map<String, Object> params = new LinkedHashMap<>();
        if (text(keyword)) { where.append("AND (LOWER(title) LIKE :keyword OR LOWER(COALESCE(developers, '')) LIKE :keyword OR LOWER(COALESCE(project_name, '')) LIKE :keyword OR LOWER(COALESCE(client, '')) LIKE :keyword OR LOWER(COALESCE(summary, '')) LIKE :keyword OR LOWER(COALESCE(remark, '')) LIKE :keyword)\n"); params.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%"); }
        if (text(designationNo)) { where.append("AND LOWER(designation_no) LIKE :designationNo\n"); params.put("designationNo", "%" + designationNo.trim().toLowerCase(Locale.ROOT) + "%"); }
        if (text(client)) { where.append("AND LOWER(COALESCE(client, '')) LIKE :client\n"); params.put("client", "%" + client.trim().toLowerCase(Locale.ROOT) + "%"); }
        if (text(noticeDateFrom)) { where.append("AND notice_date >= :noticeDateFrom\n"); params.put("noticeDateFrom", noticeDateFrom); }
        if (text(noticeDateTo)) { where.append("AND notice_date <= :noticeDateTo\n"); params.put("noticeDateTo", noticeDateTo); }
        String sql = "SELECT " + COLUMNS + " FROM new_technology_usages " + where + " ORDER BY notice_date DESC NULLS LAST, designation_no, id DESC LIMIT :limit OFFSET :offset";
        Map<String, Object> listParams = new LinkedHashMap<>(params); listParams.put("limit", pageable.getPageSize()); listParams.put("offset", pageable.getOffset());
        List<NewTechnologyUsageResponse> content = bind(jdbcClient.sql(sql), listParams).query((rs, rowNum) -> map(rs)).list();
        Long total = bind(jdbcClient.sql("SELECT COUNT(*) FROM new_technology_usages " + where), params).query(Long.class).single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Override public NewTechnologyUsageResponse findById(Long id) { return jdbcClient.sql("SELECT " + COLUMNS + " FROM new_technology_usages WHERE id = :id").param("id", id).query((rs, rowNum) -> map(rs)).optional().orElse(null); }

    @Override
    public Long create(NewTechnologyUsageRequest r, String actor) {
        return jdbcClient.sql("""
                INSERT INTO new_technology_usages (designation_no, title, developers, project_name, client, notice_date, usage_expiration_date, usage_count, amount_thousand, score, summary, weight, disaster_prevention_score, remark, created_id, last_changed_id)
                VALUES (:designationNo, :title, :developers, :projectName, :client, :noticeDate, :usageExpirationDate, :usageCount, :amountThousand, :score, :summary, :weight, :disasterPreventionScore, :remark, :actor, :actor) RETURNING id
                """).param("designationNo", r.designationNo()).param("title", r.title()).param("developers", r.developers()).param("projectName", r.projectName()).param("client", r.client()).param("noticeDate", r.noticeDate()).param("usageExpirationDate", r.usageExpirationDate()).param("usageCount", r.usageCount()).param("amountThousand", r.amountThousand()).param("score", r.score()).param("summary", r.summary()).param("weight", r.weight()).param("disasterPreventionScore", r.disasterPreventionScore()).param("remark", r.remark()).param("actor", actor).query(Long.class).single();
    }

    @Override
    public int update(Long id, NewTechnologyUsageRequest r, String actor) {
        return jdbcClient.sql("""
                UPDATE new_technology_usages SET designation_no=:designationNo, title=:title, developers=:developers, project_name=:projectName, client=:client, notice_date=:noticeDate, usage_expiration_date=:usageExpirationDate, usage_count=:usageCount, amount_thousand=:amountThousand, score=:score, summary=:summary, weight=:weight, disaster_prevention_score=:disasterPreventionScore, remark=:remark, last_changed_at=CURRENT_TIMESTAMP, last_changed_id=:actor WHERE id=:id
                """).param("id", id).param("designationNo", r.designationNo()).param("title", r.title()).param("developers", r.developers()).param("projectName", r.projectName()).param("client", r.client()).param("noticeDate", r.noticeDate()).param("usageExpirationDate", r.usageExpirationDate()).param("usageCount", r.usageCount()).param("amountThousand", r.amountThousand()).param("score", r.score()).param("summary", r.summary()).param("weight", r.weight()).param("disasterPreventionScore", r.disasterPreventionScore()).param("remark", r.remark()).param("actor", actor).update();
    }
    @Override public int delete(Long id) { return jdbcClient.sql("DELETE FROM new_technology_usages WHERE id=:id").param("id", id).update(); }

    private NewTechnologyUsageResponse map(ResultSet rs) throws SQLException { return new NewTechnologyUsageResponse(rs.getLong("id"), rs.getString("designation_no"), rs.getString("title"), rs.getString("developers"), rs.getString("project_name"), rs.getString("client"), rs.getString("notice_date"), rs.getString("usage_expiration_date"), nullableInt(rs, "usage_count"), rs.getBigDecimal("amount_thousand"), rs.getBigDecimal("score"), rs.getString("summary"), rs.getBigDecimal("weight"), rs.getBigDecimal("disaster_prevention_score"), rs.getString("remark"), instant(rs.getTimestamp("created_at")), rs.getString("created_id"), instant(rs.getTimestamp("last_changed_at")), rs.getString("last_changed_id")); }
    private Integer nullableInt(ResultSet rs, String column) throws SQLException { int value=rs.getInt(column); return rs.wasNull()?null:value; }
    private java.time.Instant instant(Timestamp value) { return value == null ? null : value.toInstant(); }
    private boolean text(String value) { return value != null && !value.trim().isEmpty(); }
    private JdbcClient.StatementSpec bind(JdbcClient.StatementSpec statement, Map<String,Object> params) { JdbcClient.StatementSpec bound=statement; for(var entry:params.entrySet()) bound=bound.param(entry.getKey(),entry.getValue()); return bound; }
}
