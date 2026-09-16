package com.cheil.cheil_be.application.newtechnology.service;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyUsageRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyUsageResponse;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyUsageRepository;
import com.cheil.cheil_be.common.file.FileAttachmentService;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
public class NewTechnologyUsageService {
    private static final int CODE_MAX_LENGTH = 100;
    private static final int TITLE_MAX_LENGTH = 500;
    private static final String ATTACHMENT_OWNER_TYPE = "NEW_TECHNOLOGY_USAGE";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private final FileAttachmentService fileAttachmentService;
    private final NewTechnologyUsageRepository repository;

    @Transactional(readOnly = true)
    public Page<NewTechnologyUsageResponse> findAll(String keyword, String designationNo, String client, String noticeDateFrom, String noticeDateTo, Pageable pageable) {
        return repository.findAll(keyword, designationNo, client, normalizeDate(noticeDateFrom, "noticeDateFrom", false), normalizeDate(noticeDateTo, "noticeDateTo", false), pageable);
    }
    @Transactional(readOnly = true)
    public NewTechnologyUsageResponse findById(Long id) {
        if (id == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        NewTechnologyUsageResponse result = repository.findById(id); if (result == null) throw notFound(); return result;
    }
    @Transactional
    public NewTechnologyUsageResponse create(NewTechnologyUsageRequest request) {
        validate(request); Long id = repository.create(normalize(request), AuditActorResolver.resolve()); return findById(id);
    }
    @Transactional
    public NewTechnologyUsageResponse update(Long id, NewTechnologyUsageRequest request) {
        findById(id); validate(request); if (repository.update(id, normalize(request), AuditActorResolver.resolve()) != 1) throw notFound(); return findById(id);
    }
    @Transactional
    public void delete(Long id) {
        findById(id); fileAttachmentService.deleteAll(ATTACHMENT_OWNER_TYPE, String.valueOf(id)); if (repository.delete(id) != 1) throw notFound();
    }
    private NewTechnologyUsageRequest normalize(NewTechnologyUsageRequest r) {
        return new NewTechnologyUsageRequest(StringValues.required(r.designationNo(), "designationNo"), StringValues.required(r.title(), "title"), nullIfBlank(r.developers()), nullIfBlank(r.projectName()), nullIfBlank(r.client()), normalizeDate(r.noticeDate(), "noticeDate", false), normalizeDate(r.usageExpirationDate(), "usageExpirationDate", false), r.usageCount(), r.amountThousand(), r.score(), nullIfBlank(r.summary()), r.weight(), r.disasterPreventionScore(), nullIfBlank(r.remark()));
    }
    private void validate(NewTechnologyUsageRequest r) {
        if (r == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        StringValues.validateMaxLength(StringValues.required(r.designationNo(), "designationNo"), CODE_MAX_LENGTH, "designationNo");
        StringValues.validateMaxLength(StringValues.required(r.title(), "title"), TITLE_MAX_LENGTH, "title");
        StringValues.validateMaxLength(StringValues.normalize(r.client()), 300, "client");
        normalizeDate(r.noticeDate(), "noticeDate", false); normalizeDate(r.usageExpirationDate(), "usageExpirationDate", false);
        nonNegative(r.usageCount(), "usageCount"); nonNegative(r.amountThousand(), "amountThousand"); nonNegative(r.score(), "score"); nonNegative(r.weight(), "weight"); nonNegative(r.disasterPreventionScore(), "disasterPreventionScore");
    }
    private void nonNegative(Integer value, String field) { if (value != null && value < 0) throw invalid(field); }
    private void nonNegative(BigDecimal value, String field) { if (value != null && value.compareTo(BigDecimal.ZERO) < 0) throw invalid(field); }
    private ResponseStatusException invalid(String field) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be greater than or equal to 0."); }
    private String normalizeDate(String value, String field, boolean required) { String normalized=StringValues.normalize(value); if (!StringUtils.hasText(normalized)) { if(required) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field+" is required."); return null; } String compact=normalized.replace("-",""); if(!compact.matches("\\d{8}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field+" must be YYYYMMDD."); try { LocalDate.parse(compact, DATE_FORMATTER); } catch(DateTimeParseException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field+" must be YYYYMMDD."); } return compact; }
    private String nullIfBlank(String value) { String normalized=StringValues.normalize(value); return StringUtils.hasText(normalized)?normalized:null; }
    private ResponseStatusException notFound() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "New technology usage record was not found."); }
}
