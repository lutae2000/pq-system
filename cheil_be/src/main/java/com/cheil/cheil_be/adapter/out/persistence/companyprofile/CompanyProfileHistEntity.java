package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "company_profile_hist")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanyProfileHistEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hist_id")
    private Long histId;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    @Column(name = "changed_by")
    private String changedBy;

    @Column(name = "change_type", nullable = false)
    private String changeType;

    @Column(name = "change_summary")
    private String changeSummary;

    @Column(name = "snapshot_json", nullable = false)
    private String snapshotJson;

    public static CompanyProfileHistEntity create(Long profileId, String changedBy, String changeType, String changeSummary, String snapshotJson) {
        CompanyProfileHistEntity entity = new CompanyProfileHistEntity();
        entity.profileId = profileId;
        entity.changedAt = Instant.now();
        entity.changedBy = changedBy;
        entity.changeType = changeType;
        entity.changeSummary = changeSummary;
        entity.snapshotJson = snapshotJson;
        return entity;
    }
}
