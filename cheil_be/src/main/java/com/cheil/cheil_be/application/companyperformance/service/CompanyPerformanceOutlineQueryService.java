package com.cheil.cheil_be.application.companyperformance.service;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceOutlineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceOutlineQueryService {
    private final CompanyPerformanceOutlineRepository repository;
    @Transactional(readOnly=true) public List<CompanyPerformanceOutlineResponse> findByPerformanceSeq(Long seq){return seq==null?List.of():repository.findByPerformanceSeq(seq);}
    @Transactional public CompanyPerformanceOutlineResponse create(Long seq,CompanyPerformanceOutlineRequest request){Long id=repository.create(seq,normalize(request));return findById(seq,id);}
    @Transactional public CompanyPerformanceOutlineResponse update(Long seq,Long id,CompanyPerformanceOutlineRequest request){if(repository.update(seq,id,normalize(request))!=1)throw notFound();return findById(seq,id);}
    @Transactional public void delete(Long seq,Long id){if(repository.delete(seq,id)!=1)throw notFound();}
    private CompanyPerformanceOutlineResponse findById(Long seq,Long id){var result=repository.findById(seq,id);if(result==null)throw notFound();return result;}
    private CompanyPerformanceOutlineRequest normalize(CompanyPerformanceOutlineRequest r){if(r==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Request body is required.");return new CompanyPerformanceOutlineRequest(r.outlineGroupSeq(),r.outlineLineSeq(),text(r.categoryCode()),text(r.subcategoryCode()),text(r.categoryName()),text(r.subcategoryName()),text(r.subcategoryUnit()),text(r.outlineContent()),yn(r.ddlbYn()),text(r.ddlbGroupCode()),r.sortSeq());}
    private String text(String value){return StringUtils.hasText(value)?value.trim():null;} private String yn(String value){String n=text(value);return n==null?null:(n.equalsIgnoreCase("Y")?"Y":"N");} private ResponseStatusException notFound(){return new ResponseStatusException(HttpStatus.NOT_FOUND,"Company performance outline was not found.");}
}
