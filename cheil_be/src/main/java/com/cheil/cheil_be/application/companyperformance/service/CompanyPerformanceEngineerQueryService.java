package com.cheil.cheil_be.application.companyperformance.service;

import com.cheil.cheil_be.adapter.in.web.companyperformance.*;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceEngineerRepository;
import com.cheil.cheil_be.application.engineer.port.out.EngineerMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceEngineerQueryService {
    private final EngineerMasterRepository engineerMasterRepository;
    private final CompanyPerformanceEngineerRepository repository;
    @Transactional(readOnly=true) public List<CompanyPerformanceEngineerCandidateResponse> findEngineerCandidates(String keyword,Integer limit){int size=limit==null?30:Math.max(1,Math.min(limit,100));String text=StringUtils.hasText(keyword)?keyword.trim():"";return engineerMasterRepository.findCompanyPerformanceCandidates(text,PageRequest.of(0,size)).stream().map(e->new CompanyPerformanceEngineerCandidateResponse(e.engineerId(),e.name(),e.department(),e.position(),e.dutyPart(),e.proPart(),e.designGrade())).toList();}
    @Transactional(readOnly=true) public List<CompanyPerformanceEngineerResponse> findByPerformanceSeq(Long seq){return seq==null?List.of():repository.findByPerformanceSeq(seq);}
    @Transactional public CompanyPerformanceEngineerResponse create(Long seq,CompanyPerformanceEngineerRequest request){String id=required(request==null?null:request.engineerId(),"engineerId");int updated=repository.create(seq,normalize(request,id));if(updated!=1)throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Engineer history could not be saved.");Long latest=repository.findLatestId(seq,id);return findById(seq,latest);}
    @Transactional public CompanyPerformanceEngineerResponse update(Long seq,Long id,CompanyPerformanceEngineerRequest request){String engineerId=required(request==null?null:request.engineerId(),"engineerId");if(repository.update(seq,id,normalize(request,engineerId))!=1)throw notFound();return findById(seq,id);}
    @Transactional public void delete(Long seq,Long id){if(repository.delete(seq,id)!=1)throw notFound();}
    private CompanyPerformanceEngineerResponse findById(Long seq,Long id){var row=id==null?null:repository.findById(seq,id);if(row==null)throw notFound();return row;}
    private CompanyPerformanceEngineerRequest normalize(CompanyPerformanceEngineerRequest r,String id){return new CompanyPerformanceEngineerRequest(id,date(r.participationStartDate()),date(r.participationEndDate()),text(r.category()),text(r.participationFieldPosition()),yn(r.actualParticipationYn()),yn(r.reportYn()),r.participationGrade(),text(r.companyAtParticipation()),text(r.departmentAtParticipation()),text(r.positionAtParticipation()),text(r.duty()),text(r.jobField()),text(r.specialtyField()),text(r.remark()));}
    private String required(String v,String f){String n=text(v);if(!StringUtils.hasText(n))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,f+" is required.");return n;} private String text(String v){return StringUtils.hasText(v)?v.trim():null;} private String date(String v){return text(v)==null?null:text(v).replaceAll("\\D","");} private String yn(String v){String n=text(v);return n==null?null:(n.equalsIgnoreCase("Y")?"Y":"N");} private ResponseStatusException notFound(){return new ResponseStatusException(HttpStatus.NOT_FOUND,"Engineer history was not found.");}
}
