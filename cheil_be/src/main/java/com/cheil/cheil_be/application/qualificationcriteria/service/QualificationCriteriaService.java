package com.cheil.cheil_be.application.qualificationcriteria.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationReviewAgencyRequest;
import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationReviewAgencyResponse;
import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationReviewCriterionRequest;
import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationReviewCriterionResponse;
import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationScoreBandRequest;
import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationScoreBandResponse;
import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationReviewAgencyEntity;
import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationReviewAgencyJpaRepository;
import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationReviewCriterionEntity;
import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationReviewCriterionJpaRepository;
import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationScoreBandEntity;
import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationScoreBandJpaRepository;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class QualificationCriteriaService {

    private static final int AGENCY_CODE_MAX_LENGTH = 20;
    private static final int AGENCY_NAME_MAX_LENGTH = 200;
    private static final int RULE_CODE_MAX_LENGTH = 30;
    private static final int REVISION_NO_MAX_LENGTH = 20;
    private static final int SHORT_TEXT_MAX_LENGTH = 200;
    private static final int BASIS_MAX_LENGTH = 300;
    private static final int LONG_TEXT_MAX_LENGTH = 500;

    private final QualificationReviewAgencyJpaRepository agencyRepository;
    private final QualificationReviewCriterionJpaRepository criterionRepository;
    private final QualificationScoreBandJpaRepository scoreBandRepository;

    @Transactional(readOnly = true)
    public List<QualificationReviewAgencyResponse> findAgencies(String keyword, Boolean useYn) {
        String normalizedKeyword = keyword(keyword);
        return agencyRepository.findByOrderByAgencyCodeAsc().stream()
                .filter(entity -> useYn == null || entity.isUseYn() == useYn)
                .filter(entity -> matches(normalizedKeyword, entity.getAgencyCode(), entity.getAgencyName(), entity.getRemark()))
                .map(QualificationReviewAgencyResponse::from)
                .toList();
    }

    @Transactional
    public QualificationReviewAgencyResponse createAgency(QualificationReviewAgencyRequest request) {
        QualificationReviewAgencyRequest normalized = normalizeAgency(request);
        if (agencyRepository.existsByAgencyCode(normalized.agencyCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 기관 코드입니다.");
        }
        return QualificationReviewAgencyResponse.from(agencyRepository.save(new QualificationReviewAgencyEntity(normalized)));
    }

    @Transactional
    public QualificationReviewAgencyResponse updateAgency(Long id, QualificationReviewAgencyRequest request) {
        QualificationReviewAgencyEntity entity = findAgency(id);
        QualificationReviewAgencyRequest normalized = normalizeAgency(request);
        if (agencyRepository.existsByAgencyCodeAndIdNot(normalized.agencyCode(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 기관 코드입니다.");
        }
        entity.update(normalized);
        return QualificationReviewAgencyResponse.from(entity);
    }

    @Transactional
    public void deleteAgency(Long id) {
        agencyRepository.delete(findAgency(id));
    }

    @Transactional(readOnly = true)
    public List<QualificationReviewCriterionResponse> findCriteria(Long agencyId, String keyword, Boolean useYn) {
        if (agencyId == null) {
            return List.of();
        }
        findAgency(agencyId);

        String normalizedKeyword = keyword(keyword);
        return criterionRepository.findByAgencyIdOrderByRuleCodeAscRevisionNoAsc(agencyId).stream()
                .filter(entity -> useYn == null || entity.isUseYn() == useYn)
                .filter(entity -> matches(
                        normalizedKeyword,
                        entity.getRuleCode(),
                        entity.getRevisionNo(),
                        entity.getEffectiveDate(),
                        entity.getLegalBasis(),
                        entity.getDecisionMethod()
                ))
                .map(QualificationReviewCriterionResponse::from)
                .toList();
    }

    @Transactional
    public QualificationReviewCriterionResponse createCriterion(QualificationReviewCriterionRequest request) {
        QualificationReviewCriterionRequest normalized = normalizeCriterion(request);
        findAgency(normalized.agencyId());
        if (criterionRepository.existsByAgencyIdAndRuleCodeAndRevisionNo(normalized.agencyId(), normalized.ruleCode(), normalized.revisionNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 시행기준입니다.");
        }
        return QualificationReviewCriterionResponse.from(criterionRepository.save(new QualificationReviewCriterionEntity(normalized)));
    }

    @Transactional
    public QualificationReviewCriterionResponse updateCriterion(Long id, QualificationReviewCriterionRequest request) {
        QualificationReviewCriterionEntity entity = findCriterion(id);
        QualificationReviewCriterionRequest normalized = normalizeCriterion(request);
        findAgency(normalized.agencyId());
        if (criterionRepository.existsByAgencyIdAndRuleCodeAndRevisionNoAndIdNot(normalized.agencyId(), normalized.ruleCode(), normalized.revisionNo(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 시행기준입니다.");
        }
        entity.update(normalized);
        return QualificationReviewCriterionResponse.from(entity);
    }

    @Transactional
    public void deleteCriterion(Long id) {
        criterionRepository.delete(findCriterion(id));
    }

    @Transactional(readOnly = true)
    public List<QualificationScoreBandResponse> findScoreBands(Long criterionId) {
        if (criterionId == null) {
            return List.of();
        }
        findCriterion(criterionId);

        return scoreBandRepository.findByCriterionIdOrderBySortOrderAsc(criterionId).stream()
                .map(QualificationScoreBandResponse::from)
                .toList();
    }

    @Transactional
    public QualificationScoreBandResponse createScoreBand(QualificationScoreBandRequest request) {
        QualificationScoreBandRequest normalized = normalizeScoreBand(request);
        findCriterion(normalized.criterionId());
        if (scoreBandRepository.existsByCriterionIdAndSortOrder(normalized.criterionId(), normalized.sortOrder())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 가격구간 순서입니다.");
        }
        return QualificationScoreBandResponse.from(scoreBandRepository.save(new QualificationScoreBandEntity(normalized)));
    }

    @Transactional
    public QualificationScoreBandResponse updateScoreBand(Long id, QualificationScoreBandRequest request) {
        QualificationScoreBandEntity entity = findScoreBand(id);
        QualificationScoreBandRequest normalized = normalizeScoreBand(request);
        findCriterion(normalized.criterionId());
        if (scoreBandRepository.existsByCriterionIdAndSortOrderAndIdNot(normalized.criterionId(), normalized.sortOrder(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 가격구간 순서입니다.");
        }
        entity.update(normalized);
        return QualificationScoreBandResponse.from(entity);
    }

    @Transactional
    public void deleteScoreBand(Long id) {
        scoreBandRepository.delete(findScoreBand(id));
    }

    private QualificationReviewAgencyEntity findAgency(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "agencyId is required.");
        }
        return agencyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "기관을 찾을 수 없습니다."));
    }

    private QualificationReviewCriterionEntity findCriterion(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "criterionId is required.");
        }
        return criterionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "시행기준을 찾을 수 없습니다."));
    }

    private QualificationScoreBandEntity findScoreBand(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "scoreBandId is required.");
        }
        return scoreBandRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "가격구간을 찾을 수 없습니다."));
    }

    private QualificationReviewAgencyRequest normalizeAgency(QualificationReviewAgencyRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        return new QualificationReviewAgencyRequest(
                requiredText(request.agencyCode(), AGENCY_CODE_MAX_LENGTH, "agencyCode"),
                requiredText(request.agencyName(), AGENCY_NAME_MAX_LENGTH, "agencyName"),
                limitedText(request.remark(), LONG_TEXT_MAX_LENGTH, "remark"),
                request.useYn()
        );
    }

    private QualificationReviewCriterionRequest normalizeCriterion(QualificationReviewCriterionRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        if (request.agencyId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "agencyId is required.");
        }

        return new QualificationReviewCriterionRequest(
                request.agencyId(),
                requiredText(request.ruleCode(), RULE_CODE_MAX_LENGTH, "ruleCode"),
                requiredText(request.revisionNo(), REVISION_NO_MAX_LENGTH, "revisionNo"),
                dateText(request.effectiveDate(), "effectiveDate"),
                limitedText(request.legalBasis(), BASIS_MAX_LENGTH, "legalBasis"),
                nonNegative(request.technicalWeight(), "technicalWeight"),
                nonNegative(request.priceWeight(), "priceWeight"),
                limitedText(request.decisionMethod(), LONG_TEXT_MAX_LENGTH, "decisionMethod"),
                nonNegative(request.thresholdRatio(), "thresholdRatio"),
                request.useYn()
        );
    }

    private QualificationScoreBandRequest normalizeScoreBand(QualificationScoreBandRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        if (request.criterionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "criterionId is required.");
        }
        if (request.sortOrder() == null || request.sortOrder() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sortOrder must be greater than or equal to 1.");
        }

        return new QualificationScoreBandRequest(
                request.criterionId(),
                request.sortOrder(),
                nonNegative(request.minPrice(), "minPrice"),
                nonNegative(request.maxPrice(), "maxPrice"),
                limitedText(request.priceText(), SHORT_TEXT_MAX_LENGTH, "priceText"),
                nonNegative(request.passScore(), "passScore"),
                nonNegative(request.technicalScore(), "technicalScore"),
                nonNegative(request.careerScore(), "careerScore"),
                nonNegative(request.regionScore(), "regionScore"),
                nonNegative(request.managementScore(), "managementScore"),
                nonNegative(request.priceScore(), "priceScore"),
                nonNegative(request.priceMultiplier(), "priceMultiplier"),
                limitedText(request.priceFormula(), LONG_TEXT_MAX_LENGTH, "priceFormula"),
                nonNegative(request.technicalAverageScore(), "technicalAverageScore"),
                nonNegative(request.totalAverageScore(), "totalAverageScore"),
                nonNegative(request.lowestBidPrice(), "lowestBidPrice"),
                nonNegative(request.pqAvailableScore(), "pqAvailableScore"),
                request.useYn(),
                limitedText(request.remark(), LONG_TEXT_MAX_LENGTH, "remark")
        );
    }

    private String requiredText(String value, int maxLength, String fieldName) {
        String normalized = StringValues.required(value, fieldName).trim();
        StringValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    private String limitedText(String value, int maxLength, String fieldName) {
        String normalized = value(value);
        StringValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    private String dateText(String value, String fieldName) {
        String normalized = value(value);
        if (normalized == null) {
            return null;
        }
        if (!normalized.matches("\\d{4}-\\d{2}-\\d{2}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYY-MM-DD.");
        }
        return normalized;
    }

    private BigDecimal nonNegative(BigDecimal value, String fieldName) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be greater than or equal to 0.");
        }
        return value;
    }

    private String keyword(String value) {
        String normalized = value(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private String value(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized.trim() : null;
    }

    private boolean matches(String keyword, String... values) {
        if (keyword == null) {
            return true;
        }
        for (String value : values) {
            if (value != null && value.toLowerCase(Locale.ROOT).contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
