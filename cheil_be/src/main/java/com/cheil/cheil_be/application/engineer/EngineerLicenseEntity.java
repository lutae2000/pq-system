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
@Table(name = "pq_engineer_license")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
class EngineerLicenseEntity extends AuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(name = "engr_id")
    String engrId;
    @Column(name = "date_of_issue")
    String dateOfIssue;
    @Column(name = "license_code")
    String licenseCode;
    @Column(name = "license_no")
    String licenseNo;

    EngineerDtos.License toDto() {
        return new EngineerDtos.License(id, engrId, dateOfIssue, licenseCode, licenseNo);
    }

    static EngineerLicenseEntity from(EngineerDtos.License dto, String engrId) {
        EngineerLicenseEntity entity = new EngineerLicenseEntity();
        entity.engrId = engrId;
        entity.dateOfIssue = EngineerEntityUtils.date(dto.dateOfIssue());
        entity.licenseCode = EngineerEntityUtils.clean(dto.licenseCode());
        entity.licenseNo = EngineerEntityUtils.clean(dto.licenseNo());
        return entity;
    }

    void updateFrom(EngineerDtos.License dto) {
        dateOfIssue = EngineerEntityUtils.date(dto.dateOfIssue());
        licenseCode = EngineerEntityUtils.clean(dto.licenseCode());
        licenseNo = EngineerEntityUtils.clean(dto.licenseNo());
    }
}
