package com.cheil.cheil_be.application.companyperformance.service;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceContractPeriodRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceContractPeriodResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceContractPeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceContractPeriodQueryService {
    private static final DateTimeFormatter BASIC_DATE=DateTimeFormatter.BASIC_ISO_DATE;
    private final CompanyPerformanceContractPeriodRepository repository;
    @Transactional(readOnly=true) public List<CompanyPerformanceContractPeriodResponse> findByPerformanceSeq(Long seq){return seq==null?List.of():repository.findByPerformanceSeq(seq).stream().map(this::response).toList();}
    @Transactional public CompanyPerformanceContractPeriodResponse create(Long seq,CompanyPerformanceContractPeriodRequest request){CompanyPerformanceContractPeriodRequest normalized=normalize(request);Long id=repository.create(seq,normalized);return findById(seq,id);}
    @Transactional public CompanyPerformanceContractPeriodResponse update(Long seq,Long id,CompanyPerformanceContractPeriodRequest request){CompanyPerformanceContractPeriodRequest normalized=normalize(request);if(repository.update(seq,id,normalized)!=1)throw notFound();return findById(seq,id);}
    @Transactional public void delete(Long seq,Long id){if(repository.delete(seq,id)!=1)throw notFound();}
    private CompanyPerformanceContractPeriodResponse findById(Long seq,Long id){var record=repository.findById(seq,id);if(record==null)throw notFound();return response(record);}
    private CompanyPerformanceContractPeriodResponse response(CompanyPerformanceContractPeriodRepository.Record r){Period period=period(r.contractFromDate(),r.contractToDate());return new CompanyPerformanceContractPeriodResponse(r.id(),r.seq(),r.contractFromDate(),r.contractToDate(),period.getYears()*12+period.getMonths(),period.getDays(),r.sortSeq());}
    private Period period(String from,String to){if(!StringUtils.hasText(from)||!StringUtils.hasText(to))return Period.ZERO;return Period.between(LocalDate.parse(from,BASIC_DATE),LocalDate.parse(to,BASIC_DATE).plusDays(1));}
    private CompanyPerformanceContractPeriodRequest normalize(CompanyPerformanceContractPeriodRequest r){if(r==null)throw invalid("Request body is required.");String from=date(r.contractFromDate(),"contractFromDate"),to=date(r.contractToDate(),"contractToDate");if(LocalDate.parse(to,BASIC_DATE).isBefore(LocalDate.parse(from,BASIC_DATE)))throw invalid("Contract end date must not be before start date.");return new CompanyPerformanceContractPeriodRequest(from,to,r.sortSeq());}
    private String date(String value,String field){String normalized=StringUtils.hasText(value)?value.trim().replace("-",""):null;if(!StringUtils.hasText(normalized))throw invalid(field+" is required.");try{LocalDate.parse(normalized,BASIC_DATE);}catch(DateTimeParseException e){throw invalid(field+" must be YYYYMMDD.");}return normalized;}
    private ResponseStatusException invalid(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);} private ResponseStatusException notFound(){return new ResponseStatusException(HttpStatus.NOT_FOUND,"Contract period was not found.");}
}
