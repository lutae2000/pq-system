package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceContractPeriodRequest;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceContractPeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceContractPeriodRepositoryAdapter implements CompanyPerformanceContractPeriodRepository {
    private final JdbcClient jdbcClient;
    @Override public List<Record> findByPerformanceSeq(Long seq) { return jdbcClient.sql("SELECT id,seq,contract_from_date,contract_to_date,sort_seq FROM company_performance_contract_periods WHERE seq=:seq ORDER BY sort_seq NULLS LAST,contract_from_date NULLS LAST,id").param("seq",seq).query((rs,n)->map(rs)).list(); }
    @Override public Record findById(Long seq,Long id) { return jdbcClient.sql("SELECT id,seq,contract_from_date,contract_to_date,sort_seq FROM company_performance_contract_periods WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).query((rs,n)->map(rs)).optional().orElse(null); }
    @Override public Long create(Long seq,CompanyPerformanceContractPeriodRequest r) { return jdbcClient.sql("INSERT INTO company_performance_contract_periods (seq,contract_from_date,contract_to_date,sort_seq) VALUES (:seq,:contractFromDate,:contractToDate,:sortSeq) RETURNING id").param("seq",seq).param("contractFromDate",r.contractFromDate()).param("contractToDate",r.contractToDate()).param("sortSeq",r.sortSeq()).query(Long.class).single(); }
    @Override public int update(Long seq,Long id,CompanyPerformanceContractPeriodRequest r) { return jdbcClient.sql("UPDATE company_performance_contract_periods SET contract_from_date=:contractFromDate,contract_to_date=:contractToDate,sort_seq=:sortSeq,last_changed_at=CURRENT_TIMESTAMP WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).param("contractFromDate",r.contractFromDate()).param("contractToDate",r.contractToDate()).param("sortSeq",r.sortSeq()).update(); }
    @Override public int delete(Long seq,Long id) { return jdbcClient.sql("DELETE FROM company_performance_contract_periods WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).update(); }
    private Record map(java.sql.ResultSet rs)throws java.sql.SQLException{return new Record(rs.getLong("id"),rs.getLong("seq"),rs.getString("contract_from_date"),rs.getString("contract_to_date"),rs.getObject("sort_seq",Integer.class));}
}
