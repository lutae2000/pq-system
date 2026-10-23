package com.cheil.cheil_be.application.serviceperformance.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.basicDate;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;
import static com.cheil.cheil_be.application.common.validation.InputValues.requireNonNull;
import static com.cheil.cheil_be.application.common.validation.InputValues.validateMaxLength;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceCommand;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceQuery;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceSearch;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceView;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceUseCase;
import com.cheil.cheil_be.application.serviceperformance.port.out.ServicePerformanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ServicePerformanceService implements ServicePerformanceUseCase {
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private final ServicePerformanceRepository repository;
    private final CurrentActorPort currentActorPort;

    @Override
    @Transactional(readOnly = true)
    public Page<ServicePerformanceView> findAll(ServicePerformanceQuery query, Pageable pageable) {
        if (query == null || pageable == null) {
            throw ApplicationException.badRequest("조회 조건과 페이지 정보는 필수입니다.");
        }
        String normalizedDate = basicDate(query.referenceDate(), "referenceDate", false);
        String normalizedPeriod = normalizePeriodType(query.periodType());
        // 조회 조건은 서비스 경계에서 정규화하고, 어댑터에는 비교 가능한 값만 전달합니다.
        return repository.findAll(new ServicePerformanceSearch(
                trimToNull(query.keyword()), trimToNull(query.clientCode()), trimToNull(query.fieldName()),
                trimToNull(query.siteName()), normalizedDate, normalizedPeriod,
                resolvePeriodLowerDate(normalizedDate, normalizedPeriod)), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public ServicePerformanceView findById(Long id) {
        requiredPositive(id, "id");
        ServicePerformanceView view = repository.findById(id);
        if (view == null) throw ApplicationException.notFound("용역실적을 찾을 수 없습니다.");
        return view;
    }

    @Override
    @Transactional
    public ServicePerformanceView create(ServicePerformanceCommand command) {
        ServicePerformanceCommand normalized = normalizeAndValidate(command);
        Long id = repository.create(normalized, currentActorPort.currentActor());
        return findById(id);
    }

    @Override
    @Transactional
    public ServicePerformanceView update(Long id, ServicePerformanceCommand command) {
        requiredPositive(id, "id");
        ServicePerformanceCommand normalized = normalizeAndValidate(command);
        if (repository.update(id, normalized, currentActorPort.currentActor()) != 1) {
            throw ApplicationException.notFound("용역실적을 찾을 수 없습니다.");
        }
        return findById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        requiredPositive(id, "id");
        if (repository.delete(id) != 1) throw ApplicationException.notFound("용역실적을 찾을 수 없습니다.");
    }

    private ServicePerformanceCommand normalizeAndValidate(ServicePerformanceCommand command) {
        requireNonNull(command, "요청 본문은 필수입니다.");
        validateMaxLength(command.remark(), REMARK_MAX_LENGTH, "remark");
        return new ServicePerformanceCommand(requiredText(command.clientCode(), "clientCode"),
                requiredText(command.fieldName(), "fieldName"), requiredText(command.siteName(), "siteName"),
                basicDate(command.evaluationDate(), "evaluationDate", true), command.serviceAmount(),
                command.evaluationScore(), trimToNull(command.remark()));
    }

    private String normalizePeriodType(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) return null;
        String upper = normalized.toUpperCase(Locale.ROOT);
        if (!"3".equals(upper) && !"5".equals(upper) && !"ALL".equals(upper)) {
            throw ApplicationException.badRequest("periodType은 3, 5, ALL 중 하나여야 합니다.");
        }
        return upper;
    }

    private String resolvePeriodLowerDate(String referenceDate, String periodType) {
        if (!"3".equals(periodType) && !"5".equals(periodType)) return null;
        if (referenceDate == null) {
            throw ApplicationException.badRequest("periodType이 3 또는 5이면 referenceDate가 필요합니다.");
        }
        // 기간 조건은 기준일을 포함한 과거 범위의 시작일로 변환해 SQL 어댑터가 단순 비교만 수행하도록 합니다.
        return LocalDate.parse(referenceDate, BASIC_DATE).minusYears(Integer.parseInt(periodType)).format(BASIC_DATE);
    }
}
