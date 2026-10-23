package com.cheil.cheil_be.application.companyperformance.service;

import com.cheil.cheil_be.application.common.validation.InputValues;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.adapter.in.web.companyperformance.*;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceEngineerRepository;
import com.cheil.cheil_be.application.engineer.port.out.EngineerMasterRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceEngineerQueryService {
  private final EngineerMasterRepository engineerMasterRepository;
  private final CompanyPerformanceEngineerRepository repository;

  @Transactional(readOnly = true)
  public List<CompanyPerformanceEngineerCandidateResponse> findEngineerCandidates(
      String keyword, Integer limit) {
    int size = limit == null ? 30 : Math.max(1, Math.min(limit, 100));
    String text = StringValues.normalize(keyword);
    return engineerMasterRepository
        .findCompanyPerformanceCandidates(text, PageRequest.of(0, size))
        .stream()
        .map(
            e ->
                new CompanyPerformanceEngineerCandidateResponse(
                    e.engineerId(),
                    e.name(),
                    e.birthDate(),
                    e.department(),
                    e.position(),
                    e.dutyPart(),
                    e.proPart(),
                    e.designGrade()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<CompanyPerformanceEngineerResponse> findByPerformanceSeq(Long seq) {
    return seq == null ? List.of() : repository.findByPerformanceSeq(seq);
  }

  @Transactional
  public CompanyPerformanceEngineerResponse create(
      Long seq, CompanyPerformanceEngineerRequest request) {
    String id = requiredText(request == null ? null : request.engineerId(), "engineerId");
    int updated = repository.create(seq, normalize(request, id));
    if (updated != 1)
      throw new IllegalStateException("Engineer history could not be saved.");
    Long latest = repository.findLatestId(seq, id);
    return findById(seq, latest);
  }

  @Transactional
  public CompanyPerformanceEngineerResponse update(
      Long seq, Long id, CompanyPerformanceEngineerRequest request) {
    String engineerId = requiredText(request == null ? null : request.engineerId(), "engineerId");
    if (repository.update(seq, id, normalize(request, engineerId)) != 1) {
      throw ApplicationException.notFound("Engineer history was not found.");
    }
    return findById(seq, id);
  }

  @Transactional
  public void delete(Long seq, Long id) {
    if (repository.delete(seq, id) != 1) throw ApplicationException.notFound("Engineer history was not found.");
  }

  private CompanyPerformanceEngineerResponse findById(Long seq, Long id) {
    var row = id == null ? null : repository.findById(seq, id);
    if (row == null) throw ApplicationException.notFound("Engineer history was not found.");
    return row;
  }

  private CompanyPerformanceEngineerRequest normalize(
      CompanyPerformanceEngineerRequest r, String id) {
    return new CompanyPerformanceEngineerRequest(
        id,
        date(r.participationStartDate()),
        date(r.participationEndDate()),
        trimToNull(r.category()),
        trimToNull(r.participationFieldPosition()),
        yn(r.actualParticipationYn()),
        yn(r.reportYn()),
        r.participationGrade(),
        trimToNull(r.companyAtParticipation()),
        trimToNull(r.departmentAtParticipation()),
        trimToNull(r.positionAtParticipation()),
        trimToNull(r.duty()),
        trimToNull(r.jobField()),
        trimToNull(r.specialtyField()),
        trimToNull(r.remark()));
  }

  private String date(String v) {
    String normalized = trimToNull(v);
    return normalized == null ? null : normalized.replaceAll("\\D", "");
  }

  private String yn(String v) {
    String n = trimToNull(v);
    return n == null ? null : (n.equalsIgnoreCase("Y") ? "Y" : "N");
  }

}
