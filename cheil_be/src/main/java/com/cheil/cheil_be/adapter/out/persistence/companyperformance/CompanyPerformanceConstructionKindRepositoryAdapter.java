package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceConstructionKindRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceConstructionKindRepositoryAdapter implements CompanyPerformanceConstructionKindRepository {
    private final JdbcClient jdbcClient;
    private static final String COLUMNS = "id, seq, level1_code, level2_code, level3_code";

    @Override
    public List<CompanyPerformanceConstructionKindResponse> findByPerformanceSeq(Long seq) {
        return jdbcClient.sql("""
                SELECT k.id, k.seq, k.level1_code, k.level2_code, k.level3_code
                FROM company_performance_construction_kinds k
                INNER JOIN construction_type c ON c.level1_code = k.level1_code
                    AND c.level2_code = k.level2_code AND c.level3_code = k.level3_code
                WHERE k.seq = :seq AND c.use_yn = TRUE
                """).param("seq", seq).query((rs,n) -> map(rs)).list();
    }
    @Override public CompanyPerformanceConstructionKindResponse findById(Long seq, Long id) { return jdbcClient.sql("SELECT " + COLUMNS + " FROM company_performance_construction_kinds WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).query((rs,n)->map(rs)).optional().orElse(null); }
    @Override public Long create(Long seq, CompanyPerformanceConstructionKindRequest r) { return jdbcClient.sql("INSERT INTO company_performance_construction_kinds (seq,level1_code,level2_code,level3_code) VALUES (:seq,:level1Code,:level2Code,:level3Code) RETURNING id").param("seq",seq).param("level1Code",r.level1Code()).param("level2Code",r.level2Code()).param("level3Code",r.level3Code()).query(Long.class).single(); }
    @Override public int update(Long seq, Long id, CompanyPerformanceConstructionKindRequest r) { return jdbcClient.sql("UPDATE company_performance_construction_kinds SET level1_code=:level1Code,level2_code=:level2Code,level3_code=:level3Code,last_changed_at=CURRENT_TIMESTAMP WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).param("level1Code",r.level1Code()).param("level2Code",r.level2Code()).param("level3Code",r.level3Code()).update(); }
    @Override public int delete(Long seq, Long id) { return jdbcClient.sql("DELETE FROM company_performance_construction_kinds WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).update(); }
    private CompanyPerformanceConstructionKindResponse map(java.sql.ResultSet rs) throws java.sql.SQLException { return new CompanyPerformanceConstructionKindResponse(rs.getLong("id"),rs.getLong("seq"),rs.getString("level1_code"),rs.getString("level2_code"),rs.getString("level3_code")); }
}
