package com.cheil.cheil_be.application.companyperformance.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerCommand;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerResult;
import com.cheil.cheil_be.application.companyperformance.port.in.CompanyPerformanceEngineerUseCase;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceEngineerRepository;
import com.cheil.cheil_be.application.engineer.EngineerCandidate;
import com.cheil.cheil_be.application.engineer.port.out.EngineerMasterRepository;
import com.cheil.cheil_be.common.text.StringValues;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceEngineerQueryService implements CompanyPerformanceEngineerUseCase {
  private final EngineerMasterRepository engineerMasterRepository;
  private final CompanyPerformanceEngineerRepository repository;

  @Override
  @Transactional(readOnly = true)
  public List<EngineerCandidate> findEngineerCandidates(
      String keyword, Integer limit) {
    int size = limit == null ? 30 : Math.max(1, Math.min(limit, 100));
    String text = StringValues.normalize(keyword);
    return engineerMasterRepository.findCompanyPerformanceCandidates(text, PageRequest.of(0, size));
  }

  @Override
  @Transactional(readOnly = true)
  public List<CompanyPerformanceEngineerResult> findByPerformanceSeq(Long seq) {
    return seq == null ? List.of() : repository.findByPerformanceSeq(seq);
  }

  @Override
  @Transactional
  public CompanyPerformanceEngineerResult create(Long seq, CompanyPerformanceEngineerCommand command) {
    Long id = repository.create(seq, normalize(command));
    return findById(seq, id);
  }

  @Override
  @Transactional
  public CompanyPerformanceEngineerResult update(Long seq, Long id, CompanyPerformanceEngineerCommand command) {
    if (repository.update(seq, id, normalize(command)) != 1) {
      throw ApplicationException.notFound("Engineer history was not found.");
    }
    return findById(seq, id);
  }

  @Override
  @Transactional
  public void delete(Long seq, Long id) {
    if (repository.delete(seq, id) != 1) throw ApplicationException.notFound("Engineer history was not found.");
  }

  private CompanyPerformanceEngineerResult findById(Long seq, Long id) {
    var row = id == null ? null : repository.findById(seq, id);
    if (row == null) throw ApplicationException.notFound("Engineer history was not found.");
    return row;
  }

  private CompanyPerformanceEngineerCommand normalize(CompanyPerformanceEngineerCommand r) {
    String id = requiredText(r == null ? null : r.engineerId(), "engineerId");
    return new CompanyPerformanceEngineerCommand(
        id,
        date(r.participationStartDate()),
        date(r.participationEndDate()),
        trimToNull(r.jobTag()),
        trimToNull(r.participationFieldPosition()),
        yn(r.actualParticipationYn()),
        yn(r.reportYn()),
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
