package com.cheil.cheil_be.adapter.out.persistence.constructiontype;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

@Entity
@Table(name = "construction_type")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
class ConstructionTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "code_id", nullable = false)
    private Long codeId;

    @Column(name = "code_level", nullable = false)
    private Integer codeLevel;

    @Column(name = "level1_code", nullable = false, length = 10)
    private String level1Code;

    @Column(name = "level2_code", nullable = false, length = 10)
    private String level2Code;

    @Column(name = "level3_code", nullable = false, length = 10)
    private String level3Code;

    @Column(name = "code_name", nullable = false, length = 100)
    private String codeName;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "created_id", length = 100)
    private String createdId;

    @Column(name = "last_changed_at")
    private Instant lastChangedAt;

    @Column(name = "last_changed_id", length = 100)
    private String lastChangedId;

    static ConstructionTypeEntity from(ConstructionType constructionType) {
        return ConstructionTypeEntity.builder()
                .codeId(constructionType.codeId())
                .codeLevel(constructionType.codeLevel())
                .level1Code(constructionType.level1Code())
                .level2Code(constructionType.level2Code())
                .level3Code(constructionType.level3Code())
                .codeName(constructionType.codeName())
                .useYn(constructionType.useYn())
                .createdAt(constructionType.createdAt())
                .createdId(constructionType.createdId())
                .lastChangedAt(constructionType.lastChangedAt())
                .lastChangedId(constructionType.lastChangedId())
                .build();
    }

    void updateFrom(ConstructionType constructionType) {
        codeLevel = constructionType.codeLevel();
        level1Code = constructionType.level1Code();
        level2Code = constructionType.level2Code();
        level3Code = constructionType.level3Code();
        codeName = constructionType.codeName();
        useYn = constructionType.useYn();
        createdAt = constructionType.createdAt();
        createdId = constructionType.createdId();
        lastChangedAt = constructionType.lastChangedAt();
        lastChangedId = constructionType.lastChangedId();
    }

    ConstructionType toDomain() {
        return new ConstructionType(
                codeId,
                codeLevel,
                level1Code,
                level2Code,
                level3Code,
                codeName,
                useYn,
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }
}
