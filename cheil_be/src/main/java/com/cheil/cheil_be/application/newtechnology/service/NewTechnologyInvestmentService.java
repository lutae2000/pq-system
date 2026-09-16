package com.cheil.cheil_be.application.newtechnology.service;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyInvestmentRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyInvestmentResponse;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyInvestmentRepository;
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

@Service
@RequiredArgsConstructor
public class NewTechnologyInvestmentService {
    private final NewTechnologyInvestmentRepository repository;

    @Transactional(readOnly = true)
    public Page<NewTechnologyInvestmentResponse> findAll(String yearFrom, String yearTo, Pageable pageable) {
        return repository.findAll(normalizeYear(yearFrom, "yearFrom", false), normalizeYear(yearTo, "yearTo", false), pageable);
    }

    @Transactional(readOnly = true)
    public NewTechnologyInvestmentResponse findById(Long id) {
        if (id == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        NewTechnologyInvestmentResponse response = repository.findById(id);
        if (response == null) throw notFound();
        return response;
    }

    @Transactional
    public NewTechnologyInvestmentResponse create(NewTechnologyInvestmentRequest request) {
        validate(request, null);
        Long id = repository.create(normalize(request), AuditActorResolver.resolve());
        return findById(id);
    }

    @Transactional
    public NewTechnologyInvestmentResponse update(Long id, NewTechnologyInvestmentRequest request) {
        findById(id);
        validate(request, id);
        if (repository.update(id, normalize(request), AuditActorResolver.resolve()) != 1) throw notFound();
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        if (repository.delete(id) != 1) throw notFound();
    }

    private NewTechnologyInvestmentRequest normalize(NewTechnologyInvestmentRequest request) {
        return new NewTechnologyInvestmentRequest(normalizeYear(request.investmentYear(), "investmentYear", true), request.revenue(), request.totalAssets(), request.equityCapital(), request.currentLiabilities(), request.fixedLiabilities(), request.currentAssets(), request.netIncome(), request.totalLiabilities(), request.technologyDevelopmentInvestment(), nullIfBlank(request.remark()));
    }

    private void validate(NewTechnologyInvestmentRequest request, Long currentId) {
        if (request == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        String investmentYear = normalizeYear(request.investmentYear(), "investmentYear", true);
        if (repository.existsByInvestmentYear(investmentYear, currentId)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Investment year already exists.");
        validateNonNegative(request.revenue(), "revenue"); validateNonNegative(request.totalAssets(), "totalAssets");
        validateNonNegative(request.equityCapital(), "equityCapital"); validateNonNegative(request.currentLiabilities(), "currentLiabilities");
        validateNonNegative(request.fixedLiabilities(), "fixedLiabilities"); validateNonNegative(request.currentAssets(), "currentAssets");
        validateNonNegative(request.totalLiabilities(), "totalLiabilities"); validateNonNegative(request.technologyDevelopmentInvestment(), "technologyDevelopmentInvestment");
        StringValues.validateMaxLength(StringValues.normalize(request.remark()), 1000, "remark");
    }

    private void validateNonNegative(BigDecimal value, String fieldName) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be greater than or equal to 0.");
    }
    private String normalizeYear(String value, String fieldName, boolean required) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) { if (required) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required."); return null; }
        if (!normalized.matches("\\d{4}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYY.");
        return normalized;
    }
    private String nullIfBlank(String value) { String normalized = StringValues.normalize(value); return StringUtils.hasText(normalized) ? normalized : null; }
    private ResponseStatusException notFound() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "Investment record was not found."); }
}
