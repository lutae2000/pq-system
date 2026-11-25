package com.cheil.cheil_be.application.engineer;

import static com.cheil.cheil_be.common.text.StringValues.emptyIfNull;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.Objects;
import org.hibernate.annotations.DynamicUpdate;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;
import com.cheil.cheil_be.domain.companyperformance.ParticipationContractPeriod;

@Entity
@DynamicUpdate
@Table(name = "pq_engineer_project_history")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
class EngineerProjectHistoryEntity extends AuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(name = "engr_id")
    String engrId;
    @Column(name = "seq")
    Integer seq;
    @Column(name = "contract_period_id")
    Long contractPeriodId;
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

    EngineerDtos.CareerDetail toDto(CompanyPerformance project, ParticipationContractPeriod participationContractPeriod) {
        return new EngineerDtos.CareerDetail(
                id,
                engrId,
                project == null ? "" : emptyIfNull(project.jobName()),
                seq,
                startDt,
                endDt,
                jobClass,
                jobTag,
                jobPart,
                proPart,
                compName,
                deptName,
                grade,
                duty,
                returnYn,
                joinYn,
                null,
                null,
                null,
                remark,
                project == null ? null : project.contractFromDate(),
                project == null ? null : project.contractToDate(),
                participationContractPeriod
        );
    }

    static EngineerProjectHistoryEntity from(EngineerDtos.CareerDetail dto, String engrId) {
        EngineerProjectHistoryEntity entity = new EngineerProjectHistoryEntity();
        entity.engrId = engrId;
        entity.updateFrom(dto);
        return entity;
    }

    void updateFrom(EngineerDtos.CareerDetail dto) {
        if (!Objects.equals(seq, dto.seq())) {
            contractPeriodId = null;
        }
        seq = dto.seq();
        startDt = EngineerEntityUtils.date(dto.startDt());
        endDt = EngineerEntityUtils.date(dto.endDt());
        jobClass = EngineerEntityUtils.clean(dto.jobClass());
        jobTag = EngineerEntityUtils.clean(dto.jobTag());
        jobPart = EngineerEntityUtils.clean(dto.jobPart());
        proPart = EngineerEntityUtils.clean(dto.proPart());
        compName = EngineerEntityUtils.clean(dto.compName());
        deptName = EngineerEntityUtils.clean(dto.deptName());
        grade = EngineerEntityUtils.clean(dto.grade());
        duty = EngineerEntityUtils.clean(dto.duty());
        returnYn = EngineerEntityUtils.yn(dto.returnYn());
        joinYn = EngineerEntityUtils.yn(dto.joinYn());
        remark = EngineerEntityUtils.clean(dto.remark());
    }
}
