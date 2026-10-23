package com.cheil.cheil_be.application.newtechnology.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.nonNegative;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import java.math.BigDecimal;
import java.math.RoundingMode;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestment;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentSearch;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentView;
import com.cheil.cheil_be.application.newtechnology.port.in.NewTechnologyInvestmentUseCase;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyInvestmentRepository;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class NewTechnologyInvestmentService implements NewTechnologyInvestmentUseCase {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final CurrentActorPort currentActorPort;
    private final NewTechnologyInvestmentRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Page<NewTechnologyInvestmentView> findAll(
            NewTechnologyInvestmentSearch search, Pageable pageable) {
        if (search == null || pageable == null) {
            throw ApplicationException.badRequest("검색 조건과 페이지 정보는 필수입니다.");
        }
        NewTechnologyInvestmentSearch normalized = new NewTechnologyInvestmentSearch(
                normalizeYear(search.yearFrom(), "yearFrom", false),
                normalizeYear(search.yearTo(), "yearTo", false)
        );
        return repository.findAll(normalized, pageable).map(this::toView);
    }

    @Override
    @Transactional(readOnly = true)
    public NewTechnologyInvestmentView findById(Long id) {
        requireId(id);
        return repository.findById(id)
                .map(this::toView)
                .orElseThrow(() -> ApplicationException.notFound("신기술 투자실적을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public NewTechnologyInvestmentView create(NewTechnologyInvestmentCommand command) {
        NewTechnologyInvestmentCommand normalized = normalize(command, null);
        Long id = repository.create(normalized, currentActorPort.currentActor());
        return findById(id);
    }

    @Override
    @Transactional
    public NewTechnologyInvestmentView update(Long id, NewTechnologyInvestmentCommand command) {
        requireId(id);
        NewTechnologyInvestmentCommand normalized = normalize(command, id);
        if (repository.update(id, normalized, currentActorPort.currentActor()) != 1) {
            throw ApplicationException.notFound("신기술 투자실적을 찾을 수 없습니다.");
        }
        return findById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        requireId(id);
        if (repository.delete(id) != 1) {
            throw ApplicationException.notFound("신기술 투자실적을 찾을 수 없습니다.");
        }
    }

    private NewTechnologyInvestmentCommand normalize(NewTechnologyInvestmentCommand command, Long currentId) {
        if (command == null) {
            throw ApplicationException.badRequest("요청 본문은 필수입니다.");
        }
        String investmentYear = normalizeYear(command.investmentYear(), "investmentYear", true);
        if (repository.existsByInvestmentYear(investmentYear, currentId)) {
            throw ApplicationException.conflict("이미 등록된 투자연도입니다.");
        }
        nonNegative(command.revenue(), "revenue");
        nonNegative(command.totalAssets(), "totalAssets");
        nonNegative(command.equityCapital(), "equityCapital");
        nonNegative(command.currentLiabilities(), "currentLiabilities");
        nonNegative(command.fixedLiabilities(), "fixedLiabilities");
        nonNegative(command.currentAssets(), "currentAssets");
        nonNegative(command.totalLiabilities(), "totalLiabilities");
        nonNegative(command.technologyDevelopmentInvestment(), "technologyDevelopmentInvestment");
        InputValues.validateMaxLength(StringValues.normalize(command.remark()), 1000, "remark");

        return new NewTechnologyInvestmentCommand(
                investmentYear,
                command.revenue(),
                command.totalAssets(),
                command.equityCapital(),
                command.currentLiabilities(),
                command.fixedLiabilities(),
                command.currentAssets(),
                command.netIncome(),
                command.totalLiabilities(),
                command.technologyDevelopmentInvestment(),
                trimToNull(command.remark())
        );
    }

    private NewTechnologyInvestmentView toView(NewTechnologyInvestment value) {
        return new NewTechnologyInvestmentView(
                value.id(),
                value.investmentYear(),
                value.revenue(),
                value.totalAssets(),
                value.equityCapital(),
                value.currentLiabilities(),
                value.fixedLiabilities(),
                value.currentAssets(),
                value.netIncome(),
                value.totalLiabilities(),
                value.technologyDevelopmentInvestment(),
                ratio(value.technologyDevelopmentInvestment(), value.revenue()),
                ratio(value.equityCapital(), value.totalAssets()),
                ratio(value.netIncome(), value.equityCapital()),
                ratio(value.currentAssets(), value.currentLiabilities()),
                ratio(value.totalLiabilities(), value.equityCapital()),
                value.remark(),
                value.createdAt(),
                value.createdId(),
                value.lastChangedAt(),
                value.lastChangedId()
        );
    }

    private BigDecimal ratio(BigDecimal numerator, BigDecimal denominator) {
        return numerator == null || denominator == null || denominator.signum() == 0
                ? null
                : numerator.multiply(HUNDRED).divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private String normalizeYear(String value, String fieldName, boolean required) {
        String normalized = StringValues.normalize(value);
        if (normalized == null || normalized.isBlank()) {
            if (required) {
                throw ApplicationException.badRequest(fieldName + " is required.");
            }
            return null;
        }
        if (!normalized.matches("\\d{4}")) {
            throw ApplicationException.badRequest(fieldName + " must be YYYY.");
        }
        return normalized;
    }

    private void requireId(Long id) {
        if (id == null || id <= 0) {
            throw ApplicationException.badRequest("id는 1 이상의 값이어야 합니다.");
        }
    }
}
