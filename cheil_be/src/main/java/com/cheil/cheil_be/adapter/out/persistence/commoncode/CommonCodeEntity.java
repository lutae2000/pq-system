package com.cheil.cheil_be.adapter.out.persistence.commoncode;

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

import com.cheil.cheil_be.domain.commoncode.CommonCode;

@Entity
@Table(name = "common_codes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
class CommonCodeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "code_id", nullable = false)
    private Long codeId;

    @Column(name = "code_level", nullable = false)
    private Integer codeLevel;

    @Column(name = "level1_code", nullable = false, length = 20)
    private String level1Code;

    @Column(name = "level2_code", nullable = false, length = 20)
    private String level2Code;

    @Column(name = "level3_code", nullable = false, length = 20)
    private String level3Code;

    @Column(name = "code_name", nullable = false, length = 200)
    private String codeName;

    @Column(name = "code_detail_name", length = 200)
    private String codeDetailName;

    @Column(name = "ref_value1", length = 500)
    private String refValue1;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "remark", length = 500)
    private String remark;

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

    static CommonCodeEntity from(CommonCode commonCode) {
        return CommonCodeEntity.builder()
                .codeId(commonCode.codeId())
                .codeLevel(commonCode.codeLevel())
                .level1Code(commonCode.level1Code())
                .level2Code(commonCode.level2Code())
                .level3Code(commonCode.level3Code())
                .codeName(commonCode.codeName())
                .codeDetailName(commonCode.codeDetailName())
                .refValue1(commonCode.refValue1())
                .sortOrder(commonCode.sortOrder())
                .remark(commonCode.remark())
                .useYn(commonCode.useYn())
                .createdAt(commonCode.createdAt())
                .createdId(commonCode.createdId())
                .lastChangedAt(commonCode.lastChangedAt())
                .lastChangedId(commonCode.lastChangedId())
                .build();
    }

    void updateFrom(CommonCode commonCode) {
        codeLevel = commonCode.codeLevel();
        level1Code = commonCode.level1Code();
        level2Code = commonCode.level2Code();
        level3Code = commonCode.level3Code();
        codeName = commonCode.codeName();
        codeDetailName = commonCode.codeDetailName();
        refValue1 = commonCode.refValue1();
        sortOrder = commonCode.sortOrder();
        remark = commonCode.remark();
        useYn = commonCode.useYn();
        createdAt = commonCode.createdAt();
        createdId = commonCode.createdId();
        lastChangedAt = commonCode.lastChangedAt();
        lastChangedId = commonCode.lastChangedId();
    }

    CommonCode toDomain() {
        return new CommonCode(
                codeId,
                codeLevel,
                level1Code,
                level2Code,
                level3Code,
                codeName,
                codeDetailName,
                refValue1,
                sortOrder,
                remark,
                useYn,
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }
}
