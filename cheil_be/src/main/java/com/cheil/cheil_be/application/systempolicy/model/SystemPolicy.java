package com.cheil.cheil_be.application.systempolicy.model;

public record SystemPolicy(
        String policyKey,
        String policyName,
        String policyValue,
        String valueType,
        int sortSeq,
        boolean useYn,
        String description
) {
}
