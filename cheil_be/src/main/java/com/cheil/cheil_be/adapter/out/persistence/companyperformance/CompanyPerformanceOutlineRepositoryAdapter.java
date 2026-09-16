package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceOutlineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceOutlineRepositoryAdapter implements CompanyPerformanceOutlineRepository {
    private final JdbcClient jdbcClient;
    private static final String COLUMNS="id,seq,otln_gseq,otln_lseq,cate_code,subcate_code,cate_name,subcate_name,subcate_unit,otln_cont,ddlb_yn,ddlbgroup_code,sort_seq";
    @Override public List<CompanyPerformanceOutlineResponse> findByPerformanceSeq(Long seq){return jdbcClient.sql("SELECT "+COLUMNS+" FROM company_performance_outlines WHERE seq=:seq ORDER BY sort_seq NULLS LAST,otln_gseq NULLS LAST,otln_lseq NULLS LAST,id").param("seq",seq).query((rs,n)->map(rs)).list();}
    @Override public CompanyPerformanceOutlineResponse findById(Long seq,Long id){return jdbcClient.sql("SELECT "+COLUMNS+" FROM company_performance_outlines WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).query((rs,n)->map(rs)).optional().orElse(null);}
    @Override public Long create(Long seq,CompanyPerformanceOutlineRequest r){return jdbcClient.sql("INSERT INTO company_performance_outlines (seq,otln_gseq,otln_lseq,cate_code,subcate_code,cate_name,subcate_name,subcate_unit,otln_cont,ddlb_yn,ddlbgroup_code,sort_seq) VALUES (:seq,:otlnGseq,:otlnLseq,:cateCode,:subcateCode,:cateName,:subcateName,:subcateUnit,:otlnCont,:ddlbYn,:ddlbGroupCode,:sortSeq) RETURNING id").param("seq",seq).param("otlnGseq",r.outlineGroupSeq()).param("otlnLseq",r.outlineLineSeq()).param("cateCode",r.categoryCode()).param("subcateCode",r.subcategoryCode()).param("cateName",r.categoryName()).param("subcateName",r.subcategoryName()).param("subcateUnit",r.subcategoryUnit()).param("otlnCont",r.outlineContent()).param("ddlbYn",r.ddlbYn()).param("ddlbGroupCode",r.ddlbGroupCode()).param("sortSeq",r.sortSeq()).query(Long.class).single();}
    @Override public int update(Long seq,Long id,CompanyPerformanceOutlineRequest r){return jdbcClient.sql("UPDATE company_performance_outlines SET otln_gseq=:otlnGseq,otln_lseq=:otlnLseq,cate_code=:cateCode,subcate_code=:subcateCode,cate_name=:cateName,subcate_name=:subcateName,subcate_unit=:subcateUnit,otln_cont=:otlnCont,ddlb_yn=:ddlbYn,ddlbgroup_code=:ddlbGroupCode,sort_seq=:sortSeq,last_changed_at=CURRENT_TIMESTAMP WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).param("otlnGseq",r.outlineGroupSeq()).param("otlnLseq",r.outlineLineSeq()).param("cateCode",r.categoryCode()).param("subcateCode",r.subcategoryCode()).param("cateName",r.categoryName()).param("subcateName",r.subcategoryName()).param("subcateUnit",r.subcategoryUnit()).param("otlnCont",r.outlineContent()).param("ddlbYn",r.ddlbYn()).param("ddlbGroupCode",r.ddlbGroupCode()).param("sortSeq",r.sortSeq()).update();}
    @Override public int delete(Long seq,Long id){return jdbcClient.sql("DELETE FROM company_performance_outlines WHERE id=:id AND seq=:seq").param("id",id).param("seq",seq).update();}
    private CompanyPerformanceOutlineResponse map(java.sql.ResultSet rs)throws java.sql.SQLException{return new CompanyPerformanceOutlineResponse(rs.getLong("id"),rs.getLong("seq"),rs.getObject("otln_gseq",Integer.class),rs.getObject("otln_lseq",Integer.class),rs.getString("cate_code"),rs.getString("subcate_code"),rs.getString("cate_name"),rs.getString("subcate_name"),rs.getString("subcate_unit"),rs.getString("otln_cont"),rs.getString("ddlb_yn"),rs.getString("ddlbgroup_code"),rs.getObject("sort_seq",Integer.class));}
}
