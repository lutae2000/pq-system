package com.cheil.cheil_be.application.systempolicy.model;

public final class BrandingPolicyKeys {

    public static final String LOGIN_BACKGROUND = "BRANDING_LOGIN_BACKGROUND_URL";
    public static final String COMPANY_LOGO = "BRANDING_COMPANY_LOGO_URL";
    public static final String FAVICON = "BRANDING_FAVICON_URL";

    private BrandingPolicyKeys() {
    }

    public static boolean contains(String policyKey) {
        return LOGIN_BACKGROUND.equals(policyKey)
                || COMPANY_LOGO.equals(policyKey)
                || FAVICON.equals(policyKey);
    }
}
