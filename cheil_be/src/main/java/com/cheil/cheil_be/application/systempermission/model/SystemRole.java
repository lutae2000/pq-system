package com.cheil.cheil_be.application.systempermission.model;

public record SystemRole(
        String roleCode,
        String roleName,
        boolean useYn,
        int sortSeq,
        String description
) {
}
