package com.cheil.cheil_be.adapter.out.persistence.constructiontype;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import jakarta.persistence.criteria.Predicate;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeSearchCondition;
import com.cheil.cheil_be.application.constructiontype.port.out.ConstructionTypeRepository;
import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

@Repository
@RequiredArgsConstructor
public class JpaConstructionTypeRepository implements ConstructionTypeRepository {

    private final ConstructionTypeJpaRepository constructionTypeJpaRepository;

    @Override
    public List<ConstructionType> findAll() {
        return constructionTypeJpaRepository.findAll(defaultSort())
                .stream()
                .map(ConstructionTypeEntity::toDomain)
                .toList();
    }

    @Override
    public List<ConstructionType> findAll(ConstructionTypeSearchCondition condition) {
        return constructionTypeJpaRepository.findAll(toSpecification(condition), defaultSort()).stream()
                .map(ConstructionTypeEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<ConstructionType> findByCodeId(Long codeId) {
        return constructionTypeJpaRepository.findByCodeId(codeId).map(ConstructionTypeEntity::toDomain);
    }

    @Override
    public boolean existsByCodeId(Long codeId) {
        return constructionTypeJpaRepository.existsById(codeId);
    }

    @Override
    public boolean existsByNaturalKey(Integer codeLevel, String level1Code, String level2Code, String level3Code) {
        return constructionTypeJpaRepository.existsByCodeLevelAndLevel1CodeAndLevel2CodeAndLevel3Code(
                codeLevel,
                level1Code,
                level2Code,
                level3Code
        );
    }

    @Override
    public boolean existsByNaturalKeyAndCodeIdNot(Integer codeLevel, String level1Code, String level2Code, String level3Code, Long codeId) {
        return constructionTypeJpaRepository.existsByCodeLevelAndLevel1CodeAndLevel2CodeAndLevel3CodeAndCodeIdNot(
                codeLevel,
                level1Code,
                level2Code,
                level3Code,
                codeId
        );
    }

    @Override
    public ConstructionType save(ConstructionType constructionType) {
        ConstructionTypeEntity entity;
        if (constructionType.codeId() == null) {
            entity = ConstructionTypeEntity.from(constructionType);
        } else {
            entity = constructionTypeJpaRepository.findById(constructionType.codeId())
                    .map(existing -> {
                        existing.updateFrom(constructionType);
                        return existing;
                    })
                    .orElseGet(() -> ConstructionTypeEntity.from(constructionType));
        }

        return constructionTypeJpaRepository.save(entity).toDomain();
    }

    @Override
    public void deleteByCodeId(Long codeId) {
        constructionTypeJpaRepository.deleteById(codeId);
    }

    private Specification<ConstructionTypeEntity> toSpecification(ConstructionTypeSearchCondition condition) {
        return (root, query, criteriaBuilder) -> {
            if (condition == null) {
                return criteriaBuilder.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(condition.keyword())) {
                String keyword = "%" + condition.keyword().trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("level1Code")), keyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("level2Code")), keyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("level3Code")), keyword),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("codeName")), keyword)
                ));
            }

            if (condition.useYn() != null) {
                predicates.add(criteriaBuilder.equal(root.get("useYn"), condition.useYn()));
            }

            if (condition.codeLevel() != null) {
                predicates.add(criteriaBuilder.equal(root.get("codeLevel"), condition.codeLevel()));
            }

            if (StringUtils.hasText(condition.level1Code())) {
                predicates.add(criteriaBuilder.equal(root.get("level1Code"), condition.level1Code().trim()));
            }

            if (StringUtils.hasText(condition.level2Code())) {
                predicates.add(criteriaBuilder.equal(root.get("level2Code"), condition.level2Code().trim()));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Sort defaultSort() {
        return Sort.by(
                Sort.Order.asc("codeLevel"),
                Sort.Order.asc("level1Code"),
                Sort.Order.asc("level2Code"),
                Sort.Order.asc("level3Code"),
                Sort.Order.asc("codeId")
        );
    }
}
