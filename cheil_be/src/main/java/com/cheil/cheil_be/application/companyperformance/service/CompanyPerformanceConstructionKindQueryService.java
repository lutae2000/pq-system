package com.cheil.cheil_be.application.companyperformance.service;

import com.cheil.cheil_be.application.common.validation.InputValues;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceConstructionKindRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cheil.cheil_be.application.common.exception.ApplicationException;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceConstructionKindQueryService {
  private final CompanyPerformanceConstructionKindRepository repository;

  @Transactional(readOnly = true)
  public List<CompanyPerformanceConstructionKindResponse> findByPerformanceSeq(Long seq) {
    return seq == null ? List.of() : repository.findByPerformanceSeq(seq);
  }

  @Transactional
  public CompanyPerformanceConstructionKindResponse create(
      Long seq, CompanyPerformanceConstructionKindRequest request) {
    CompanyPerformanceConstructionKindRequest normalized = normalize(request);
    Long id = repository.create(seq, normalized);
    return findById(seq, id);
  }

  @Transactional
  public CompanyPerformanceConstructionKindResponse update(
      Long seq, Long id, CompanyPerformanceConstructionKindRequest request) {
    int updated = repository.update(seq, id, normalize(request));
    if (updated != 1) throw ApplicationException.notFound("Construction kind was not found.");
    return findById(seq, id);
  }

  @Transactional
  public void delete(Long seq, Long id) {
    if (repository.delete(seq, id) != 1) throw ApplicationException.notFound("Construction kind was not found.");
  }

  private CompanyPerformanceConstructionKindResponse findById(Long seq, Long id) {
    CompanyPerformanceConstructionKindResponse result = repository.findById(seq, id);
    if (result == null) throw ApplicationException.notFound("Construction kind was not found.");
    return result;
  }

  private CompanyPerformanceConstructionKindRequest normalize(
      CompanyPerformanceConstructionKindRequest request) {
    if (request == null)
      throw ApplicationException.badRequest("Request body is required.");
    return new CompanyPerformanceConstructionKindRequest(
        requiredText(request.level1Code(), "level1Code"),
        requiredText(request.level2Code(), "level2Code"),
        requiredText(request.level3Code(), "level3Code"));
  }

}
