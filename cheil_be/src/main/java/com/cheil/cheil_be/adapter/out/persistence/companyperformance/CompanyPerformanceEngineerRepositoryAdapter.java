package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerCommand;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerResult;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceEngineerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceEngineerRepositoryAdapter implements CompanyPerformanceEngineerRepository {

    private static final String HISTORY_COLUMNS = """
            h.id,
            h.engr_id,
            m.namekor,
            h.startdt,
            h.enddt,
            h.jobclass,
            h.jobtag,
            h.joinyn,
            h.returnyn,
            h.compname,
            h.deptname,
            h.grade,
            h.duty,
            h.jobpart,
            h.propart,
            h.remark
            """;

    private final JdbcClient jdbcClient;

    @Override
    public List<CompanyPerformanceEngineerResult> findByPerformanceSeq(Long seq) {
        return jdbcClient.sql("""
                        SELECT %s
                        FROM pq_engineer_project_history h
                        LEFT JOIN pq_engineer_master m ON m.engr_id = h.engr_id
                        WHERE h.seq = :seq
                        ORDER BY h.startdt NULLS LAST, m.namekor NULLS LAST, h.id
                        """.formatted(HISTORY_COLUMNS))
                .param("seq", seq.intValue())
                .query((rs, rowNum) -> map(rs))
                .list();
    }

    @Override
    public CompanyPerformanceEngineerResult findById(Long seq, Long id) {
        return jdbcClient.sql("""
                        SELECT %s
                        FROM pq_engineer_project_history h
                        LEFT JOIN pq_engineer_master m ON m.engr_id = h.engr_id
                        WHERE h.seq = :seq AND h.id = :id
                        """.formatted(HISTORY_COLUMNS))
                .param("seq", seq.intValue())
                .param("id", id)
                .query((rs, rowNum) -> map(rs))
                .optional()
                .orElse(null);
    }

    @Override
    public Long create(Long seq, CompanyPerformanceEngineerCommand command) {
        return bind(jdbcClient.sql("""
                        INSERT INTO pq_engineer_project_history (
                            engr_id, seq, startdt, enddt, jobclass, jobtag, joinyn, returnyn,
                            compname, deptname, grade, duty, jobpart, propart, remark
                        ) VALUES (
                            :engineerId, :seq, :startDt, :endDt, :jobClass, :jobTag, :joinYn, :returnYn,
                            :compName, :deptName, :grade, :duty, :jobPart, :proPart, :remark
                        )
                        RETURNING id
                        """), params(seq, command))
                .query(Long.class)
                .single();
    }

    @Override
    public int update(Long seq, Long id, CompanyPerformanceEngineerCommand command) {
        Map<String, Object> params = params(seq, command);
        params.put("id", id);
        return bind(jdbcClient.sql("""
                        UPDATE pq_engineer_project_history
                        SET engr_id = :engineerId,
                            startdt = :startDt,
                            enddt = :endDt,
                            jobclass = :jobClass,
                            jobtag = :jobTag,
                            joinyn = :joinYn,
                            returnyn = :returnYn,
                            compname = :compName,
                            deptname = :deptName,
                            grade = :grade,
                            duty = :duty,
                            jobpart = :jobPart,
                            propart = :proPart,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP
                        WHERE id = :id AND seq = :seq
                        """), params)
                .update();
    }

    @Override
    public int delete(Long seq, Long id) {
        return jdbcClient.sql("DELETE FROM pq_engineer_project_history WHERE id = :id AND seq = :seq")
                .param("id", id)
                .param("seq", seq.intValue())
                .update();
    }

    private Map<String, Object> params(Long seq, CompanyPerformanceEngineerCommand request) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("seq", seq.intValue());
        params.put("engineerId", request.engineerId());
        params.put("startDt", digits(request.participationStartDate()));
        params.put("endDt", digits(request.participationEndDate()));
        params.put("jobClass", request.participationFieldPosition());
        params.put("jobTag", request.jobTag());
        params.put("joinYn", request.actualParticipationYn());
        params.put("returnYn", request.reportYn());
        params.put("compName", request.companyAtParticipation());
        params.put("deptName", request.departmentAtParticipation());
        params.put("grade", request.positionAtParticipation());
        params.put("duty", request.duty());
        params.put("jobPart", request.jobField());
        params.put("proPart", request.specialtyField());
        params.put("remark", request.remark());
        return params;
    }

    private JdbcClient.StatementSpec bind(JdbcClient.StatementSpec statement, Map<String, Object> params) {
        JdbcClient.StatementSpec bound = statement;
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            bound = bound.param(entry.getKey(), entry.getValue());
        }
        return bound;
    }

    private CompanyPerformanceEngineerResult map(ResultSet rs) throws SQLException {
        return new CompanyPerformanceEngineerResult(
                rs.getLong("id"), rs.getString("engr_id"), rs.getString("namekor"),
                rs.getString("startdt"), rs.getString("enddt"), rs.getString("jobtag"),
                rs.getString("jobclass"), rs.getString("joinyn"), rs.getString("returnyn"),
                rs.getString("compname"),
                rs.getString("deptname"), rs.getString("grade"), rs.getString("duty"),
                rs.getString("jobpart"), rs.getString("propart"), rs.getString("remark")
        );
    }

    private String digits(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }
}
