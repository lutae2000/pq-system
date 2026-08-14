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
@Table(name = "pq_engineer_career")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
class EngineerCareerEntity extends AuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(name = "engr_id")
    String engrId;
    @Column(name = "entrydt")
    String entryDt;
    @Column(name = "retiredt")
    String retireDt;
    @Column(name = "compname")
    String compName;
    @Column(name = "deptname")
    String deptName;
    @Column(name = "grade")
    String grade;
    @Column(name = "duty")
    String duty;

    EngineerDtos.Career toDto() {
        return new EngineerDtos.Career(id, engrId, entryDt, retireDt, compName, deptName, grade, duty);
    }

    static EngineerCareerEntity from(EngineerDtos.Career dto, String engrId) {
        EngineerCareerEntity entity = new EngineerCareerEntity();
        entity.engrId = engrId;
        entity.entryDt = EngineerEntityUtils.date(dto.entryDt());
        entity.retireDt = EngineerEntityUtils.date(dto.retireDt());
        entity.compName = EngineerEntityUtils.clean(dto.compName());
        entity.deptName = EngineerEntityUtils.clean(dto.deptName());
        entity.grade = EngineerEntityUtils.clean(dto.grade());
        entity.duty = EngineerEntityUtils.clean(dto.duty());
        return entity;
    }

    void updateFrom(EngineerDtos.Career dto) {
        entryDt = EngineerEntityUtils.date(dto.entryDt());
        retireDt = EngineerEntityUtils.date(dto.retireDt());
        compName = EngineerEntityUtils.clean(dto.compName());
        deptName = EngineerEntityUtils.clean(dto.deptName());
        grade = EngineerEntityUtils.clean(dto.grade());
        duty = EngineerEntityUtils.clean(dto.duty());
    }
}
