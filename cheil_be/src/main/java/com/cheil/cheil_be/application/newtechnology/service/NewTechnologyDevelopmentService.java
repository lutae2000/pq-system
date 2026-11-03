package com.cheil.cheil_be.application.newtechnology.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.basicDate;
import static com.cheil.cheil_be.application.common.validation.InputValues.nonNegative;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopment;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentSearch;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentView;
import com.cheil.cheil_be.application.newtechnology.port.in.NewTechnologyDevelopmentUseCase;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyDevelopmentRepository;
import com.cheil.cheil_be.common.file.FileAttachmentService;
import com.cheil.cheil_be.common.text.StringValues;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NewTechnologyDevelopmentService implements NewTechnologyDevelopmentUseCase {
  private static final int CODE_MAX_LENGTH = 100, TITLE_MAX_LENGTH = 500;
  private static final String ATTACHMENT_OWNER_TYPE = "NEW_TECHNOLOGY_DEVELOPMENT";
  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
  private final CurrentActorPort currentActorPort;
  private final FileAttachmentService fileAttachmentService;
  private final NewTechnologyDevelopmentRepository repository;

  @Override
  @Transactional(readOnly = true)
  public Page<NewTechnologyDevelopmentView> findAll(
      NewTechnologyDevelopmentSearch search, Pageable pageable) {
    if (pageable == null) {
      throw ApplicationException.badRequest("페이지 정보는 필수입니다.");
    }
    NewTechnologyDevelopmentSearch normalized = normalize(search);
    LocalDate reference = referenceDate(normalized.scoreReferenceDate());
    return repository.findAll(normalized, pageable).map(row -> response(row, reference));
  }

  @Override
  @Transactional(readOnly = true)
  public NewTechnologyDevelopmentView findById(Long id, String scoreReferenceDate) {
    requireId(id);
    NewTechnologyDevelopment row = repository.findById(id)
        .orElseThrow(() -> ApplicationException.notFound("신기술 개발실적을 찾을 수 없습니다."));
    return response(row, referenceDate(scoreReferenceDate));
  }

  @Override
  @Transactional
  public NewTechnologyDevelopmentView create(NewTechnologyDevelopmentCommand command) {
    NewTechnologyDevelopmentCommand normalized = normalize(command);
    Long id = repository.create(normalized, currentActorPort.currentActor());
    return findById(id, null);
  }

  @Override
  @Transactional
  public NewTechnologyDevelopmentView update(Long id, NewTechnologyDevelopmentCommand command) {
    requireId(id);
    NewTechnologyDevelopmentCommand normalized = normalize(command);
    if (repository.update(id, normalized, currentActorPort.currentActor()) != 1)
      throw ApplicationException.notFound("신기술 개발실적을 찾을 수 없습니다.");
    return findById(id, null);
  }

  @Override
  @Transactional
  public void delete(Long id) {
    requireId(id);
    if (repository.delete(id) != 1) {
      throw ApplicationException.notFound("신기술 개발실적을 찾을 수 없습니다.");
    }
    fileAttachmentService.deleteAll(ATTACHMENT_OWNER_TYPE, String.valueOf(id));
  }

  private NewTechnologyDevelopmentView response(NewTechnologyDevelopment r, LocalDate reference) {
    BigDecimal elapsed = elapsed(r.applicationDate(), reference);
    return new NewTechnologyDevelopmentView(
        r.id(),
        r.title(),
        r.technologyType(),
        r.workCategory(),
        r.applicantCount(),
        r.useYn(),
        r.applicationDate(),
        elapsed,
        r.calculatedScore(),
        score(r.workCategory(), r.calculatedScore(), r.applicantCount()),
        r.targetField(),
        r.applicationNo(),
        r.registrationNo(),
        r.validUntil(),
        r.summary(),
        r.remark(),
        r.createdAt(),
        r.createdId(),
        r.lastChangedAt(),
        r.lastChangedId());
  }

  private BigDecimal elapsed(String value, LocalDate reference) {
    if (value == null || value.isBlank()) return null;
    long days = ChronoUnit.DAYS.between(LocalDate.parse(value, DATE_FORMATTER), reference);
    if (days < 0) return BigDecimal.ZERO.setScale(2);
    return BigDecimal.valueOf(days)
        .divide(BigDecimal.valueOf(365), 4, RoundingMode.HALF_UP)
        .setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal score(String workCategory, BigDecimal standardScore, BigDecimal applicants) {
    if (!"설계".equals(workCategory) && !"감리".equals(workCategory)) return null;
    if (standardScore == null || applicants == null || applicants.compareTo(BigDecimal.ZERO) <= 0) return null;
    return standardScore.divide(applicants, 3, RoundingMode.DOWN);
  }

  private void validate(NewTechnologyDevelopmentCommand r) {
    if (r == null) throw ApplicationException.badRequest("요청 본문은 필수입니다.");
    InputValues.validateMaxLength(
        InputValues.requiredText(r.title(), "title"), TITLE_MAX_LENGTH, "title");
    InputValues.validateMaxLength(
        StringValues.normalize(r.technologyType()), CODE_MAX_LENGTH, "technologyType");
    InputValues.validateMaxLength(
        StringValues.normalize(r.targetField()), CODE_MAX_LENGTH, "targetField");
    InputValues.validateMaxLength(
        StringValues.normalize(r.applicationNo()), CODE_MAX_LENGTH, "applicationNo");
    InputValues.validateMaxLength(
        StringValues.normalize(r.registrationNo()), CODE_MAX_LENGTH, "registrationNo");
    basicDate(r.applicationDate(), "applicationDate", false);
    basicDate(r.validUntil(), "validUntil", false);
    if (r.applicantCount() != null && r.applicantCount().compareTo(BigDecimal.ZERO) <= 0)
      throw ApplicationException.badRequest("applicantCount must be greater than 0.");
    if (!java.util.Set.of("설계", "감리", "건축").contains(StringValues.normalize(r.workCategory())))
      throw ApplicationException.badRequest("workCategory는 설계, 감리, 건축 중 하나여야 합니다.");
    nonNegative(r.calculatedScore(), "calculatedScore");
    if (("설계".equals(r.workCategory()) || "감리".equals(r.workCategory())) && r.calculatedScore() == null)
      throw ApplicationException.badRequest("설계·감리 업무의 기준점수는 필수입니다.");
    if (r.calculatedScore() != null && (r.calculatedScore().scale() > 3 || r.calculatedScore().precision() - r.calculatedScore().scale() > 7))
      throw ApplicationException.badRequest("calculatedScore는 소수점 셋째 자리까지 입력할 수 있습니다.");
  }

  private NewTechnologyDevelopmentCommand normalize(NewTechnologyDevelopmentCommand r) {
    validate(r);
    return new NewTechnologyDevelopmentCommand(
        InputValues.requiredText(r.title(), "title"),
        trimToNull(r.technologyType()),
        trimToNull(r.workCategory()),
        r.applicantCount(),
        r.calculatedScore(),
        basicDate(r.applicationDate(), "applicationDate", false),
        trimToNull(r.targetField()),
        trimToNull(r.applicationNo()),
        trimToNull(r.registrationNo()),
        basicDate(r.validUntil(), "validUntil", false),
        trimToNull(r.summary()),
        trimToNull(r.remark()),
        r.useYn());
  }

  private NewTechnologyDevelopmentSearch normalize(NewTechnologyDevelopmentSearch search) {
    if (search == null) {
      throw ApplicationException.badRequest("검색 조건은 필수입니다.");
    }
    return new NewTechnologyDevelopmentSearch(
        trimToNull(search.keyword()),
        trimToNull(search.technologyType()),
        trimToNull(search.workCategory()),
        trimToNull(search.targetField()),
        basicDate(search.applicationDateFrom(), "applicationDateFrom", false),
        basicDate(search.applicationDateTo(), "applicationDateTo", false),
        search.useYn(),
        search.validOnly(),
        basicDate(search.scoreReferenceDate(), "scoreReferenceDate", false));
  }

  private LocalDate referenceDate(String value) {
    String normalized = basicDate(value, "scoreReferenceDate", false);
    return normalized != null && !normalized.isBlank()
        ? LocalDate.parse(normalized, DATE_FORMATTER)
        : LocalDate.now();
  }

  private void requireId(Long id) {
    if (id == null || id <= 0) {
      throw ApplicationException.badRequest("id는 1 이상의 값이어야 합니다.");
    }
  }

}
