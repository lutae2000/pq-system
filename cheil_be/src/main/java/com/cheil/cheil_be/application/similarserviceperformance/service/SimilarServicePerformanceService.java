package com.cheil.cheil_be.application.similarserviceperformance.service;

import java.math.BigDecimal;
import java.util.Locale;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.similarserviceperformance.SimilarServicePerformanceRequest;
import com.cheil.cheil_be.adapter.in.web.similarserviceperformance.SimilarServicePerformanceResponse;
import com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance.SimilarServicePerformanceEntity;
import com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance.SimilarServicePerformanceJpaRepository;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class SimilarServicePerformanceService {

    private static final int TEXT_MAX_LENGTH = 500;
    private static final int REMARK_MAX_LENGTH = 1000;

    private final SimilarServicePerformanceJpaRepository repository;

    @Transactional(readOnly = true)
    public Page<SimilarServicePerformanceResponse> findAll(
            String keyword,
            String constructionType,
            String client,
            String contractFromDate,
            String contractToDate,
            Pageable pageable
    ) {
        String normalizedKeyword = keyword(keyword);
        String normalizedConstructionType = value(constructionType);
        String normalizedClient = value(client);
        String normalizedContractFromDate = date(contractFromDate, "contractFromDate");
        String normalizedContractToDate = date(contractToDate, "contractToDate");

        if (normalizedKeyword == null
                && normalizedConstructionType == null
                && normalizedClient == null
                && normalizedContractFromDate == null
                && normalizedContractToDate == null) {
            return repository.findAll(pageable).map(SimilarServicePerformanceEntity::toResponse);
        }

        return repository.findAll(
                        searchSpec(
                                normalizedKeyword,
                                normalizedConstructionType,
                                normalizedClient,
                                normalizedContractFromDate,
                                normalizedContractToDate
                        ),
                        pageable
                )
                .map(SimilarServicePerformanceEntity::toResponse);
    }

    @Transactional(readOnly = true)
    public SimilarServicePerformanceResponse findById(Long id) {
        return findEntity(id).toResponse();
    }

    @Transactional
    public SimilarServicePerformanceResponse create(SimilarServicePerformanceRequest request) {
        SimilarServicePerformanceRequest normalized = normalize(request);
        SimilarServicePerformanceEntity saved = repository.save(new SimilarServicePerformanceEntity(repository.nextId(), normalized));
        return saved.toResponse();
    }

    @Transactional
    public SimilarServicePerformanceResponse update(Long id, SimilarServicePerformanceRequest request) {
        SimilarServicePerformanceEntity entity = findEntity(id);
        entity.update(normalize(request));
        return entity.toResponse();
    }

    @Transactional
    public void delete(Long id) {
        SimilarServicePerformanceEntity entity = findEntity(id);
        repository.delete(entity);
    }

    private SimilarServicePerformanceEntity findEntity(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        }
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "유사용역 수행실적을 찾을 수 없습니다."));
    }

    private SimilarServicePerformanceRequest normalize(SimilarServicePerformanceRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        return new SimilarServicePerformanceRequest(
                limitedText(request.serviceName(), "serviceName"),
                limitedText(request.constructionType(), "constructionType"),
                limitedText(request.client(), "client"),
                date(request.contractFromDate(), "contractFromDate"),
                date(request.contractToDate(), "contractToDate"),
                date(request.constructionFromDate(), "constructionFromDate"),
                date(request.constructionToDate(), "constructionToDate"),
                nonNegative(request.contractPrice(), "contractPrice"),
                nonNegative(request.shareRatio(), "shareRatio"),
                nonNegative(request.weight(), "weight"),
                value(request.summary()),
                limitedRemark(request.remark())
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
        return normalized == null ? null : "%" + normalized.toLowerCase(Locale.ROOT) + "%";
    }

    private Specification<SimilarServicePerformanceEntity> searchSpec(
            String keyword,
            String constructionType,
            String client,
            String contractFromDate,
            String contractToDate
    ) {
        return (root, query, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();

            if (keyword != null) {
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("serviceName"), "")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("constructionType"), "")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("client"), "")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("summary"), "")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("remark"), "")), keyword)
                        )
                );
            }
            if (constructionType != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("constructionType"), "%" + constructionType + "%"));
            }
            if (client != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("client"), "%" + client + "%"));
            }
            if (contractFromDate != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("contractFromDate"), contractFromDate));
            }
            if (contractToDate != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("contractToDate"), contractToDate));
            }

            return predicate;
        };
    }

    private String value(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private String date(String value, String fieldName) {
        String normalized = value(value);
        if (normalized == null) {
            return null;
        }
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMMDD.");
        }
        return compact;
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
}
