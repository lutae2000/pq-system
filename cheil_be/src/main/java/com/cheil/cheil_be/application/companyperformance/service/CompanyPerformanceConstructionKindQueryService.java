package com.cheil.cheil_be.application.companyperformance.service;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceConstructionKindRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceConstructionKindQueryService {
    private final CompanyPerformanceConstructionKindRepository repository;

    @Transactional(readOnly=true)
    public List<CompanyPerformanceConstructionKindResponse> findByPerformanceSeq(Long seq) { return seq == null ? List.of() : repository.findByPerformanceSeq(seq); }
    @Transactional
    public CompanyPerformanceConstructionKindResponse create(Long seq, CompanyPerformanceConstructionKindRequest request) { CompanyPerformanceConstructionKindRequest normalized=normalize(request); Long id=repository.create(seq,normalized); return findById(seq,id); }
    @Transactional
    public CompanyPerformanceConstructionKindResponse update(Long seq,Long id,CompanyPerformanceConstructionKindRequest request) { int updated=repository.update(seq,id,normalize(request)); if(updated!=1)throw notFound(); return findById(seq,id); }
    @Transactional
    public void delete(Long seq,Long id) { if(repository.delete(seq,id)!=1)throw notFound(); }
    private CompanyPerformanceConstructionKindResponse findById(Long seq,Long id){CompanyPerformanceConstructionKindResponse result=repository.findById(seq,id);if(result==null)throw notFound();return result;}
    private CompanyPerformanceConstructionKindRequest normalize(CompanyPerformanceConstructionKindRequest request){if(request==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Request body is required.");return new CompanyPerformanceConstructionKindRequest(required(request.level1Code(),"level1Code"),required(request.level2Code(),"level2Code"),required(request.level3Code(),"level3Code"));}
    private String required(String value,String field){String normalized=StringUtils.hasText(value)?value.trim():null;if(!StringUtils.hasText(normalized))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,field+" is required.");return normalized;}
    private ResponseStatusException notFound(){return new ResponseStatusException(HttpStatus.NOT_FOUND,"Construction kind was not found.");}
}
