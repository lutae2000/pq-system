package com.cheil.cheil_be.common.jpa;

import java.time.Instant;

import jakarta.persistence.criteria.Expression;

import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

@UtilityClass
public class JpaSearchSpecifications {

    public static <T> Specification<T> alwaysTrue() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
    }

    public static <T> Specification<T> containsIgnoreCase(String fieldName, String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (!StringUtils.hasText(keyword)) {
                return criteriaBuilder.conjunction();
            }
            Expression<String> field = criteriaBuilder.lower(root.get(fieldName).as(String.class));
            return criteriaBuilder.like(field, "%" + escapeLike(keyword.trim().toLowerCase()) + "%", '\\');
        };
    }

    public static <T> Specification<T> equalsIfPresent(String fieldName, Object value) {
        return (root, query, criteriaBuilder) -> {
            if (value == null) {
                return criteriaBuilder.conjunction();
            }
            if (value instanceof String stringValue && !StringUtils.hasText(stringValue)) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get(fieldName), value);
        };
    }

    public static <T> Specification<T> betweenInstant(String fieldName, Instant from, Instant to) {
        return (root, query, criteriaBuilder) -> {
            if (from == null && to == null) {
                return criteriaBuilder.conjunction();
            }
            if (from != null && to != null) {
                return criteriaBuilder.between(root.get(fieldName), from, to);
            }
            if (from != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get(fieldName), from);
            }
            return criteriaBuilder.lessThanOrEqualTo(root.get(fieldName), to);
        };
    }

    public static <T> Specification<T> notDeleted() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isFalse(root.get("deleted"));
    }

    private static String escapeLike(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
