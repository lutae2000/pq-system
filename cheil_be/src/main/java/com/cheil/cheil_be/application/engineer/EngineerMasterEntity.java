package com.cheil.cheil_be.application.engineer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "pq_engineer_master")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
public class EngineerMasterEntity extends AuditEntity {
    @Id
    @Column(name = "engr_id")
    String engrId;
    @Column(name = "namekor")
    String nameKor;
    @Column(name = "birthday")
    String birthday;
    @Column(name = "deptname")
    String deptName;
    @Column(name = "grade")
    String grade;
    @Column(name = "design_grade")
    String designGrade;
    @Column(name = "construction_management_grade")
    String constructionManagementGrade;
    @Column(name = "education_exception")
    Boolean educationException;
    @Column(name = "retireyn")
    String retireYn;
    @Column(name = "dutypart")
    String dutyPart;
    @Column(name = "propart")
    String proPart;

    EngineerDtos.Basic toDto() {
        return new EngineerDtos.Basic(engrId, nameKor, birthday, deptName, grade, designGrade, constructionManagementGrade, educationException, retireYn, dutyPart, proPart);
    }

    static EngineerMasterEntity from(EngineerDtos.Basic dto, String engrId) {
        EngineerMasterEntity entity = new EngineerMasterEntity();
        entity.engrId = engrId;
        entity.nameKor = EngineerEntityUtils.clean(dto.nameKor());
        entity.birthday = EngineerEntityUtils.date(dto.birthday());
        entity.deptName = EngineerEntityUtils.clean(dto.deptName());
        entity.grade = EngineerEntityUtils.clean(dto.grade());
        entity.designGrade = EngineerEntityUtils.clean(dto.designGrade());
        entity.constructionManagementGrade = EngineerEntityUtils.clean(dto.constructionManagementGrade());
        entity.educationException = Boolean.TRUE.equals(dto.educationException());
        entity.retireYn = EngineerEntityUtils.yn(dto.retireYn());
        entity.dutyPart = EngineerEntityUtils.clean(dto.dutyPart());
        entity.proPart = EngineerEntityUtils.clean(dto.proPart());
        return entity;
    }

    void updateFrom(EngineerDtos.Basic dto) {
        nameKor = EngineerEntityUtils.clean(dto.nameKor());
        birthday = EngineerEntityUtils.date(dto.birthday());
        deptName = EngineerEntityUtils.clean(dto.deptName());
        grade = EngineerEntityUtils.clean(dto.grade());
        designGrade = EngineerEntityUtils.clean(dto.designGrade());
        constructionManagementGrade = EngineerEntityUtils.clean(dto.constructionManagementGrade());
        educationException = Boolean.TRUE.equals(dto.educationException());
        retireYn = EngineerEntityUtils.yn(dto.retireYn());
        dutyPart = EngineerEntityUtils.clean(dto.dutyPart());
        proPart = EngineerEntityUtils.clean(dto.proPart());
    }
}
