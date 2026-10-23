package com.cheil.cheil_be.application.companyperformance.service;

import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceOutlineRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cheil.cheil_be.application.common.exception.ApplicationException;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceOutlineQueryService {
  private final CompanyPerformanceOutlineRepository repository;

  @Transactional(readOnly = true)
  public List<CompanyPerformanceOutlineResponse> findByPerformanceSeq(Long seq) {
    return seq == null ? List.of() : repository.findByPerformanceSeq(seq);
  }

  @Transactional
  public CompanyPerformanceOutlineResponse create(
      Long seq, CompanyPerformanceOutlineRequest request) {
    Long id = repository.create(seq, normalize(request));
    return findById(seq, id);
  }

  @Transactional
  public CompanyPerformanceOutlineResponse update(
      Long seq, Long id, CompanyPerformanceOutlineRequest request) {
    if (repository.update(seq, id, normalize(request)) != 1) {
      throw ApplicationException.notFound("Company performance outline was not found.");
    }
    return findById(seq, id);
  }

  @Transactional
  public void delete(Long seq, Long id) {
    if (repository.delete(seq, id) != 1) {
      throw ApplicationException.notFound("Company performance outline was not found.");
    }
  }

  private CompanyPerformanceOutlineResponse findById(Long seq, Long id) {
    var result = repository.findById(seq, id);
    if (result == null) throw ApplicationException.notFound("Company performance outline was not found.");
    return result;
  }

  private CompanyPerformanceOutlineRequest normalize(CompanyPerformanceOutlineRequest r) {
    if (r == null)
      throw ApplicationException.badRequest("Request body is required.");
    return new CompanyPerformanceOutlineRequest(
        r.outlineGroupSeq(),
        r.outlineLineSeq(),
        trimToNull(r.categoryCode()),
        trimToNull(r.subcategoryCode()),
        trimToNull(r.categoryName()),
        trimToNull(r.subcategoryName()),
        trimToNull(r.subcategoryUnit()),
        trimToNull(r.outlineContent()),
        yn(r.ddlbYn()),
        trimToNull(r.ddlbGroupCode()),
        r.sortSeq());
  }

  private String yn(String value) {
    String n = trimToNull(value);
    return n == null ? null : (n.equalsIgnoreCase("Y") ? "Y" : "N");
  }

}
