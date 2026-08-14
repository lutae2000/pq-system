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
@Table(name = "pq_engineer_award")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
class EngineerPrizeEntity extends AuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(name = "engr_id")
    String engrId;
    @Column(name = "prizetag")
    String prizeTag;
    @Column(name = "dt")
    String dt;
    @Column(name = "kind")
    String kind;
    @Column(name = "spec")
    String spec;
    @Column(name = "organname")
    String organName;
    @Column(name = "jobname")
    String jobName;
    @Column(name = "remark")
    String remark;

    EngineerDtos.Prize toDto() {
        return new EngineerDtos.Prize(id, engrId, prizeTag, dt, kind, spec, organName, jobName, remark);
    }

    static EngineerPrizeEntity from(EngineerDtos.Prize dto, String engrId) {
        EngineerPrizeEntity entity = new EngineerPrizeEntity();
        entity.engrId = engrId;
        entity.prizeTag = EngineerEntityUtils.clean(dto.prizeTag());
        entity.dt = EngineerEntityUtils.date(dto.dt());
        entity.kind = EngineerEntityUtils.clean(dto.kind());
        entity.spec = EngineerEntityUtils.clean(dto.spec());
        entity.organName = EngineerEntityUtils.clean(dto.organName());
        entity.jobName = EngineerEntityUtils.clean(dto.jobName());
        entity.remark = EngineerEntityUtils.clean(dto.remark());
        return entity;
    }

    void updateFrom(EngineerDtos.Prize dto) {
        prizeTag = EngineerEntityUtils.clean(dto.prizeTag());
        dt = EngineerEntityUtils.date(dto.dt());
        kind = EngineerEntityUtils.clean(dto.kind());
        spec = EngineerEntityUtils.clean(dto.spec());
        organName = EngineerEntityUtils.clean(dto.organName());
        jobName = EngineerEntityUtils.clean(dto.jobName());
        remark = EngineerEntityUtils.clean(dto.remark());
    }
}
