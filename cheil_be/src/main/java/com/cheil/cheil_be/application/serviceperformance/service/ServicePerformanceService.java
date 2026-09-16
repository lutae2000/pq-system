package com.cheil.cheil_be.application.serviceperformance.service;

import com.cheil.cheil_be.adapter.in.web.serviceperformance.ServicePerformanceRequest;
import com.cheil.cheil_be.adapter.in.web.serviceperformance.ServicePerformanceResponse;
import com.cheil.cheil_be.application.serviceperformance.port.out.ServicePerformanceRepository;
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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ServicePerformanceService {
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private final ServicePerformanceRepository repository;

    @Transactional(readOnly = true)
    public Page<ServicePerformanceResponse> findAll(String keyword, String clientCode, String fieldName,
                                                     String siteName, String referenceDate, String periodType,
                                                     Pageable pageable) {
        String normalizedDate = normalizeQueryDate(referenceDate);
        String normalizedPeriod = normalizePeriodType(periodType);
        return repository.findAll(new ServicePerformanceRepository.ServicePerformanceSearch(
                keyword, clientCode, fieldName, siteName, normalizedDate, normalizedPeriod,
                resolvePeriodLowerDate(normalizedDate, normalizedPeriod)), pageable);
    }

    @Transactional(readOnly = true)
    public ServicePerformanceResponse findById(Long id) {
        if (id == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        ServicePerformanceResponse response = repository.findById(id);
        if (response == null) throw notFound();
        return response;
    }

    @Transactional
    public ServicePerformanceResponse create(ServicePerformanceRequest request) {
        validate(request);
        Long id = repository.create(normalize(request), AuditActorResolver.resolve());
        return findById(id);
    }

    @Transactional
    public ServicePerformanceResponse update(Long id, ServicePerformanceRequest request) {
        findById(id);
        validate(request);
        if (repository.update(id, normalize(request), AuditActorResolver.resolve()) != 1) throw notFound();
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        if (repository.delete(id) != 1) throw notFound();
    }

    private ServicePerformanceRequest normalize(ServicePerformanceRequest request) {
        return new ServicePerformanceRequest(normalizeRequired(request.clientCode(), "clientCode"),
                normalizeRequired(request.fieldName(), "fieldName"), normalizeRequired(request.siteName(), "siteName"),
                normalizeDate(request.evaluationDate(), "evaluationDate"), request.serviceAmount(),
                request.evaluationScore(), nullIfBlank(request.remark()));
    }

    private void validate(ServicePerformanceRequest request) {
        if (request == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        normalize(request);
        StringValues.validateMaxLength(StringValues.normalize(request.remark()), REMARK_MAX_LENGTH, "remark");
    }

    private String normalizeRequired(String value, String fieldName) { return StringValues.required(value, fieldName); }
    private String normalizeDate(String value, String fieldName) {
        String normalized = StringValues.required(value, fieldName).replace("-", "");
        if (!normalized.matches("\\d{8}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMMDD.");
        return normalized;
    }
    private String normalizeQueryDate(String value) {
        String normalized = StringValues.normalize(value).replace("-", "");
        if (!StringUtils.hasText(normalized)) return null;
        if (!normalized.matches("\\d{8}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "referenceDate must be YYYYMMDD.");
        return normalized;
    }
    private String normalizePeriodType(String value) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) return null;
        String upper = normalized.toUpperCase(Locale.ROOT);
        if (!"3".equals(upper) && !"5".equals(upper) && !"ALL".equals(upper)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "periodType must be 3, 5, or ALL.");
        }
        return upper;
    }
    private String resolvePeriodLowerDate(String referenceDate, String periodType) {
        if (!"3".equals(periodType) && !"5".equals(periodType)) return null;
        return LocalDate.parse(referenceDate, BASIC_DATE).minusYears(Integer.parseInt(periodType)).format(BASIC_DATE);
    }
    private String nullIfBlank(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }
    private ResponseStatusException notFound() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "Service performance was not found."); }
}
