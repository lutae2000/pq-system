package com.cheil.cheil_be.application.similarserviceperformance.service;

import com.cheil.cheil_be.application.common.validation.InputValues;

import static com.cheil.cheil_be.application.common.validation.InputValues.basicDate;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;
import static com.cheil.cheil_be.application.common.validation.InputValues.nonNegative;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;
import com.cheil.cheil_be.application.similarserviceperformance.port.in.SimilarServicePerformanceUseCase;
import com.cheil.cheil_be.application.similarserviceperformance.port.out.SimilarServicePerformanceRepository;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class SimilarServicePerformanceService implements SimilarServicePerformanceUseCase {

    private static final int TEXT_MAX_LENGTH = 500;
    private static final int REMARK_MAX_LENGTH = 1000;
    private final SimilarServicePerformanceRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Page<SimilarServicePerformance> findAll(
            SimilarServicePerformanceSearch search, Pageable pageable) {
        if (search == null || pageable == null) throw badRequest("Search condition and pageable are required.");
        String from = basicDate(search.contractFromDate(), "contractFromDate", false);
        String to = basicDate(search.contractToDate(), "contractToDate", false);
        validateDateRange(from, to, "contractFromDate", "contractToDate");

        // 검색 조건은 application에서 정규화해 어댑터마다 서로 다른 해석을 하지 않도록 합니다.
        return repository.findAll(new SimilarServicePerformanceSearch(
                keyword(search.keyword()), trimToNull(search.constructionType()), trimToNull(search.client()),
                from, to
        ), pageable);
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
        String contractFrom = basicDate(command.contractFromDate(), "contractFromDate", false);
        String contractTo = basicDate(command.contractToDate(), "contractToDate", false);
        String constructionFrom = basicDate(command.constructionFromDate(), "constructionFromDate", false);
        String constructionTo = basicDate(command.constructionToDate(), "constructionToDate", false);
        validateDateRange(contractFrom, contractTo, "contractFromDate", "contractToDate");
        validateDateRange(constructionFrom, constructionTo, "constructionFromDate", "constructionToDate");

        return new SimilarServicePerformanceCommand(
                limitedText(command.serviceName(), "serviceName"),
                limitedText(command.constructionType(), "constructionType"),
                limitedText(command.client(), "client"), contractFrom, contractTo,
                constructionFrom, constructionTo,
                nonNegative(command.contractPrice(), "contractPrice"),
                nonNegative(command.shareRatio(), "shareRatio"),
                nonNegative(command.weight(), "weight"), trimToNull(command.summary()), limitedRemark(command.remark())
        );
    }

    private String limitedText(String value, String fieldName) {
        String normalized = trimToNull(value);
        InputValues.validateMaxLength(normalized, TEXT_MAX_LENGTH, fieldName);
        return normalized;
    }

    private String limitedRemark(String value) {
        String normalized = trimToNull(value);
        InputValues.validateMaxLength(normalized, REMARK_MAX_LENGTH, "remark");
        return normalized;
    }

    private String keyword(String value) {
        String normalized = trimToNull(value);
        return normalized == null ? null : normalized.toLowerCase(java.util.Locale.ROOT);
    }

    private void validateDateRange(String from, String to, String fromField, String toField) {
        if (from != null && to != null && from.compareTo(to) > 0) {
            throw badRequest(fromField + " must be less than or equal to " + toField + ".");
        }
    }

}
