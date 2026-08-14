package com.cheil.cheil_be.adapter.out.persistence.certification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;
import com.cheil.cheil_be.domain.certification.Certification;

@Entity
@Table(name = "certifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@SuperBuilder
class CertificationEntity extends AuditEntity {

    @Id
    @Column(name = "cert_code", nullable = false, unique = true, length = 20)
    private String certCode;

    @Column(name = "cert_name", nullable = false, length = 200)
    private String certName;

    @Column(name = "cert_kind", nullable = false)
    private int certKind;

    @Column(name = "satis_code", length = 20)
    private String satisCode;

    @Column(name = "satis_name", length = 200)
    private String satisName;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    static CertificationEntity from(Certification certification) {
        return CertificationEntity.builder()
                .certCode(certification.certCode())
                .certName(certification.certName())
                .certKind(certification.certKind())
                .satisCode(certification.satisCode())
                .satisName(certification.satisName())
                .useYn(certification.useYn())
                .createdAt(certification.createdAt())
                .createdId(certification.createdId())
                .lastChangedAt(certification.lastChangedAt())
                .lastChangedId(certification.lastChangedId())
                .build();
    }

    void updateFrom(Certification certification) {
        certName = certification.certName();
        certKind = certification.certKind();
        satisCode = certification.satisCode();
        satisName = certification.satisName();
        useYn = certification.useYn();
    }

    Certification toDomain() {
        return new Certification(
                certCode,
                certName,
                certKind,
                satisCode,
                satisName,
                useYn,
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }
}
