package com.cheil.cheil_be.application.similarserviceperformance.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.similarserviceperformance.exception.SimilarServicePerformanceApplicationException;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformancePage;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;
import com.cheil.cheil_be.application.similarserviceperformance.port.in.SimilarServicePerformanceUseCase;
import com.cheil.cheil_be.application.similarserviceperformance.port.out.SimilarServicePerformanceRepository;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class SimilarServicePerformanceService implements SimilarServicePerformanceUseCase {

    private static final int TEXT_MAX_LENGTH = 500;
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final DateTimeFormatter BASIC_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final SimilarServicePerformanceRepository repository;

    @Override
    @Transactional(readOnly = true)
    public SimilarServicePerformancePage findAll(SimilarServicePerformanceSearch search) {
        if (search == null) throw badRequest("Search condition is required.");
        String from = date(search.contractFromDate(), "contractFromDate");
        String to = date(search.contractToDate(), "contractToDate");
        validateDateRange(from, to, "contractFromDate", "contractToDate");

        // 검색 조건은 application에서 정규화해 어댑터마다 서로 다른 해석을 하지 않도록 합니다.
        return repository.findAll(new SimilarServicePerformanceSearch(
                keyword(search.keyword()), value(search.constructionType()), value(search.client()),
                from, to, Math.max(search.page(), 0), Math.max(search.size(), 1)
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public SimilarServicePerformance findById(Long id) {
        return findExisting(id);
    }

    @Override
    @Transactional
    public SimilarServicePerformance create(SimilarServicePerformanceCommand command) {
        return repository.save(repository.nextId(), normalize(command));
    }

    @Override
    @Transactional
    public SimilarServicePerformance update(Long id, SimilarServicePerformanceCommand command) {
        findExisting(id);
        return repository.save(id, normalize(command));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        findExisting(id);
        repository.deleteById(id);
    }

    private SimilarServicePerformance findExisting(Long id) {
        if (id == null) throw badRequest("id is required.");
        return repository.findById(id).orElseThrow(() -> notFound("유사용역 수행실적을 찾을 수 없습니다."));
    }

    private SimilarServicePerformanceCommand normalize(SimilarServicePerformanceCommand command) {
        if (command == null) throw badRequest("Request body is required.");
        String contractFrom = date(command.contractFromDate(), "contractFromDate");
        String contractTo = date(command.contractToDate(), "contractToDate");
        String constructionFrom = date(command.constructionFromDate(), "constructionFromDate");
        String constructionTo = date(command.constructionToDate(), "constructionToDate");
        validateDateRange(contractFrom, contractTo, "contractFromDate", "contractToDate");
        validateDateRange(constructionFrom, constructionTo, "constructionFromDate", "constructionToDate");

        return new SimilarServicePerformanceCommand(
                limitedText(command.serviceName(), "serviceName"),
                limitedText(command.constructionType(), "constructionType"),
                limitedText(command.client(), "client"), contractFrom, contractTo,
                constructionFrom, constructionTo,
                nonNegative(command.contractPrice(), "contractPrice"),
                nonNegative(command.shareRatio(), "shareRatio"),
                nonNegative(command.weight(), "weight"), value(command.summary()), limitedRemark(command.remark())
        );
    }

    private String limitedText(String value, String fieldName) {
        String normalized = value(value);
        StringValues.validateMaxLength(normalized, TEXT_MAX_LENGTH, fieldName);
        return normalized;
    }

    private String limitedRemark(String value) {
        String normalized = value(value);
        StringValues.validateMaxLength(normalized, REMARK_MAX_LENGTH, "remark");
        return normalized;
    }

    private String keyword(String value) {
        String normalized = value(value);
        return normalized == null ? null : normalized.toLowerCase(java.util.Locale.ROOT);
    }

    private String value(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized.trim() : null;
    }

    private String date(String value, String fieldName) {
        String normalized = value(value);
        if (normalized == null) return null;
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) throw badRequest(fieldName + " must be YYYYMMDD.");
        try {
            LocalDate.parse(compact, BASIC_DATE_FORMAT);
        } catch (DateTimeParseException exception) {
            throw badRequest(fieldName + " must be a valid calendar date.");
        }
        return compact;
    }

    private void validateDateRange(String from, String to, String fromField, String toField) {
        if (from != null && to != null && from.compareTo(to) > 0) {
            throw badRequest(fromField + " must be less than or equal to " + toField + ".");
        }
    }

    private BigDecimal nonNegative(BigDecimal value, String fieldName) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw badRequest(fieldName + " must be greater than or equal to 0.");
        }
        return value;
    }

    private SimilarServicePerformanceApplicationException badRequest(String message) {
        return new SimilarServicePerformanceApplicationException(SimilarServicePerformanceApplicationException.Type.BAD_REQUEST, message);
    }

    private SimilarServicePerformanceApplicationException notFound(String message) {
        return new SimilarServicePerformanceApplicationException(SimilarServicePerformanceApplicationException.Type.NOT_FOUND, message);
    }
}
