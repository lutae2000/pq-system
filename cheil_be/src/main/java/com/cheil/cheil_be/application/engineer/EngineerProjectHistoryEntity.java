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
@Table(name = "pq_engineer_project_history")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
class EngineerProjectHistoryEntity extends AuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(name = "engr_id")
    String engrId;
    @Column(name = "jobname")
    String jobName;
    @Column(name = "seq")
    Integer seq;
    @Column(name = "startdt")
    String startDt;
    @Column(name = "enddt")
    String endDt;
    @Column(name = "jobclass")
    String jobClass;
    @Column(name = "jobtag")
    String jobTag;
    @Column(name = "jobpart")
    String jobPart;
    @Column(name = "propart")
    String proPart;
    @Column(name = "englevel")
    String engLevel;
    @Column(name = "compname")
    String compName;
    @Column(name = "deptname")
    String deptName;
    @Column(name = "grade")
    String grade;
    @Column(name = "duty")
    String duty;
    @Column(name = "returnyn")
    String returnYn;
    @Column(name = "joinyn")
    String joinYn;
    @Column(name = "remark")
    String remark;

    EngineerDtos.CareerDetail toDto() {
        return new EngineerDtos.CareerDetail(
                id,
                engrId,
                jobName,
                seq,
                startDt,
                endDt,
                jobClass,
                jobTag,
                jobPart,
                proPart,
                engLevel,
                compName,
                deptName,
                grade,
                duty,
                returnYn,
                joinYn,
                null,
                null,
                null,
                remark
        );
    }

    static EngineerProjectHistoryEntity from(EngineerDtos.CareerDetail dto, String engrId) {
        EngineerProjectHistoryEntity entity = new EngineerProjectHistoryEntity();
        entity.engrId = engrId;
        entity.updateFrom(dto);
        return entity;
    }

    void updateFrom(EngineerDtos.CareerDetail dto) {
        jobName = EngineerEntityUtils.clean(dto.jobName());
        seq = dto.seq();
        startDt = EngineerEntityUtils.date(dto.startDt());
        endDt = EngineerEntityUtils.date(dto.endDt());
        jobClass = EngineerEntityUtils.clean(dto.jobClass());
        jobTag = EngineerEntityUtils.clean(dto.jobTag());
        jobPart = EngineerEntityUtils.clean(dto.jobPart());
        proPart = EngineerEntityUtils.clean(dto.proPart());
        engLevel = EngineerEntityUtils.clean(dto.engLevel());
        compName = EngineerEntityUtils.clean(dto.compName());
        deptName = EngineerEntityUtils.clean(dto.deptName());
        grade = EngineerEntityUtils.clean(dto.grade());
        duty = EngineerEntityUtils.clean(dto.duty());
        returnYn = EngineerEntityUtils.yn(dto.returnYn());
        joinYn = EngineerEntityUtils.yn(dto.joinYn());
        remark = EngineerEntityUtils.clean(dto.remark());
    }
}
