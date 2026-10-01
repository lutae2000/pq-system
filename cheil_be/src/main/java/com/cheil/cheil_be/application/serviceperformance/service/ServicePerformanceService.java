package com.cheil.cheil_be.application.serviceperformance.service;

import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceCommand;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformancePage;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformancePageQuery;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceView;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceUseCase;
import com.cheil.cheil_be.application.serviceperformance.port.out.ServicePerformanceRepository;
import com.cheil.cheil_be.application.serviceperformance.exception.ServicePerformanceApplicationException;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ServicePerformanceService implements ServicePerformanceUseCase {
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private final ServicePerformanceRepository repository;

    @Transactional(readOnly = true)
    public ServicePerformancePage findAll(String keyword, String clientCode, String fieldName,
                                                     String siteName, String referenceDate, String periodType,
                                                     ServicePerformancePageQuery pageQuery) {
        String normalizedDate = normalizeQueryDate(referenceDate);
        String normalizedPeriod = normalizePeriodType(periodType);
        // 조회 조건은 서비스 경계에서 정규화하고, 어댑터에는 비교 가능한 값만 전달합니다.
        return repository.findAll(new ServicePerformanceRepository.ServicePerformanceSearch(
                keyword, clientCode, fieldName, siteName, normalizedDate, normalizedPeriod,
                resolvePeriodLowerDate(normalizedDate, normalizedPeriod)), pageQuery);
    }

    @Transactional(readOnly = true)
    public ServicePerformanceView findById(Long id) {
        if (id == null) throw invalid("id는 필수입니다.");
        ServicePerformanceView view = repository.findById(id);
        if (view == null) throw notFound();
        return view;
    }

    @Transactional
    public ServicePerformanceView create(ServicePerformanceCommand command) {
        validate(command);
        Long id = repository.create(normalize(command), AuditActorResolver.resolve());
        return findById(id);
    }

    @Transactional
    public ServicePerformanceView update(Long id, ServicePerformanceCommand command) {
        findById(id);
        validate(command);
        if (repository.update(id, normalize(command), AuditActorResolver.resolve()) != 1) throw notFound();
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        if (repository.delete(id) != 1) throw notFound();
    }

    private ServicePerformanceCommand normalize(ServicePerformanceCommand command) {
        return new ServicePerformanceCommand(normalizeRequired(command.clientCode(), "clientCode"),
                normalizeRequired(command.fieldName(), "fieldName"), normalizeRequired(command.siteName(), "siteName"),
                normalizeDate(command.evaluationDate(), "evaluationDate"), command.serviceAmount(),
                command.evaluationScore(), nullIfBlank(command.remark()));
    }

    private void validate(ServicePerformanceCommand command) {
        if (command == null) throw invalid("요청 본문은 필수입니다.");
        normalize(command);
        validateMaxLength(command.remark(), REMARK_MAX_LENGTH, "remark");
    }

    private String normalizeRequired(String value, String fieldName) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) throw invalid(fieldName + "는 필수입니다.");
        return normalized;
    }
    private String normalizeDate(String value, String fieldName) {
        String normalized = normalizeRequired(value, fieldName).replace("-", "");
        if (!normalized.matches("\\d{8}")) throw invalid(fieldName + "는 YYYYMMDD 형식이어야 합니다.");
        try {
            LocalDate.parse(normalized, BASIC_DATE);
        } catch (java.time.format.DateTimeParseException exception) {
            throw invalid(fieldName + "는 YYYYMMDD 형식이어야 합니다.");
        }
        return normalized;
    }
    private String normalizeQueryDate(String value) {
        String normalizedValue = normalize(value);
        if (normalizedValue == null || normalizedValue.isBlank()) return null;
        String normalized = normalizedValue.replace("-", "");
        if (!normalized.matches("\\d{8}")) throw invalid("referenceDate는 YYYYMMDD 형식이어야 합니다.");
        try {
            LocalDate.parse(normalized, BASIC_DATE);
        } catch (java.time.format.DateTimeParseException exception) {
            throw invalid("referenceDate는 YYYYMMDD 형식이어야 합니다.");
        }
        return normalized;
    }
    private String normalizePeriodType(String value) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) return null;
        String upper = normalized.toUpperCase(Locale.ROOT);
        if (!"3".equals(upper) && !"5".equals(upper) && !"ALL".equals(upper)) {
            throw invalid("periodType은 3, 5, ALL 중 하나여야 합니다.");
        }
        return upper;
    }
    private String resolvePeriodLowerDate(String referenceDate, String periodType) {
        if (!"3".equals(periodType) && !"5".equals(periodType)) return null;
        if (referenceDate == null) {
            throw invalid("periodType이 3 또는 5이면 referenceDate가 필요합니다.");
        }
        // 기간 조건은 기준일을 포함한 과거 범위의 시작일로 변환해 SQL 어댑터가 단순 비교만 수행하도록 합니다.
        return LocalDate.parse(referenceDate, BASIC_DATE).minusYears(Integer.parseInt(periodType)).format(BASIC_DATE);
    }
    private String nullIfBlank(String value) {
        String normalized = normalize(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }
    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value != null && value.length() > maxLength) {
            throw invalid(fieldName + "는 " + maxLength + "자 이하로 입력해야 합니다.");
        }
    }

    private ServicePerformanceApplicationException invalid(String message) {
        return new ServicePerformanceApplicationException(
                ServicePerformanceApplicationException.Type.BAD_REQUEST,
                message
        );
    }

    private ServicePerformanceApplicationException notFound() {
        return new ServicePerformanceApplicationException(
                ServicePerformanceApplicationException.Type.NOT_FOUND,
                "용역실적을 찾을 수 없습니다."
        );
    }
}
