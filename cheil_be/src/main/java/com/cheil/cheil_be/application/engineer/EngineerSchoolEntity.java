package com.cheil.cheil_be.application.engineer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "pq_engineer_school")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
class EngineerSchoolEntity extends AuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(name = "engr_id")
    String engrId;
    @Column(name = "graduation_date")
    String graduationDate;
    @Column(name = "schname")
    String schName;
    @Column(name = "major")
    String major;
    @Column(name = "career")
    Integer career;
    @Column(name = "valid_major_yn")
    String validMajorYn;
    @Column(name = "last_yn")
    String lastYn;

    EngineerDtos.School toDto() {
        return new EngineerDtos.School(id, engrId, graduationDate, schName, major, career, validMajorYn, lastYn);
    }

    static EngineerSchoolEntity from(EngineerDtos.School dto, String engrId) {
        EngineerSchoolEntity entity = new EngineerSchoolEntity();
        entity.engrId = engrId;
        entity.graduationDate = EngineerEntityUtils.date(dto.graduationDate());
        entity.schName = EngineerEntityUtils.clean(dto.schName());
        entity.major = EngineerEntityUtils.clean(dto.major());
        entity.career = dto.career();
        entity.validMajorYn = EngineerEntityUtils.clean(dto.validMajorYn());
        entity.lastYn = EngineerEntityUtils.clean(dto.lastYn());
        return entity;
    }

    void updateFrom(EngineerDtos.School dto) {
        graduationDate = EngineerEntityUtils.date(dto.graduationDate());
        schName = EngineerEntityUtils.clean(dto.schName());
        major = EngineerEntityUtils.clean(dto.major());
        career = dto.career();
        validMajorYn = EngineerEntityUtils.clean(dto.validMajorYn());
        lastYn = EngineerEntityUtils.clean(dto.lastYn());
    }
}
