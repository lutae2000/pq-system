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
@Table(name = "pq_engineer_education")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
class EngineerEducationEntity extends AuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(name = "engr_id")
    String engrId;
    @Column(name = "startdt")
    String startDt;
    @Column(name = "enddt")
    String endDt;
    @Column(name = "eduname")
    String eduName;
    @Column(name = "organname")
    String organName;

    EngineerDtos.Education toDto() {
        return new EngineerDtos.Education(id, engrId, startDt, endDt, eduName, organName);
    }

    static EngineerEducationEntity from(EngineerDtos.Education dto, String engrId) {
        EngineerEducationEntity entity = new EngineerEducationEntity();
        entity.engrId = engrId;
        entity.startDt = EngineerEntityUtils.date(dto.startDt());
        entity.endDt = EngineerEntityUtils.date(dto.endDt());
        entity.eduName = EngineerEntityUtils.clean(dto.eduName());
        entity.organName = EngineerEntityUtils.clean(dto.organName());
        return entity;
    }

    void updateFrom(EngineerDtos.Education dto) {
        startDt = EngineerEntityUtils.date(dto.startDt());
        endDt = EngineerEntityUtils.date(dto.endDt());
        eduName = EngineerEntityUtils.clean(dto.eduName());
        organName = EngineerEntityUtils.clean(dto.organName());
    }
}
