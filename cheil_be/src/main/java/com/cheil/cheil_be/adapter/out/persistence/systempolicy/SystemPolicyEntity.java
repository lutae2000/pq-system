package com.cheil.cheil_be.adapter.out.persistence.systempolicy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "system_policies")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@SuperBuilder
public class SystemPolicyEntity extends AuditEntity {

    @Id
    @Column(name = "policy_key", nullable = false, length = 100)
    private String policyKey;

    @Column(name = "policy_name", nullable = false, length = 150)
    private String policyName;

    @Column(name = "policy_value", nullable = false, length = 500)
    private String policyValue;

    @Column(name = "value_type", nullable = false, length = 20)
    private String valueType;

    @Column(name = "sort_seq", nullable = false)
    private int sortSeq;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    @Column(name = "description", length = 500)
    private String description;
}
