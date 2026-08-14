package com.cheil.cheil_be.common.web;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIpResolver {

    private static final String UNKNOWN = "unknown";

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        String headerIp = firstHeaderIp(request, "X-Forwarded-For");
        if (hasIp(headerIp)) {
            return normalize(headerIp);
        }

        headerIp = firstHeaderIp(request, "X-Real-IP");
        if (hasIp(headerIp)) {
            return normalize(headerIp);
        }

        headerIp = firstForwardedFor(request.getHeader("Forwarded"));
        if (hasIp(headerIp)) {
            return normalize(headerIp);
        }

        return normalize(request.getRemoteAddr());
    }

    private static String firstHeaderIp(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (!hasIp(value)) {
            return null;
        }
        return value.split(",")[0].trim();
    }

    private static String firstForwardedFor(String forwarded) {
        if (!hasIp(forwarded)) {
            return null;
        }

        for (String part : forwarded.split(";")) {
            String trimmed = part.trim();
            if (trimmed.regionMatches(true, 0, "for=", 0, 4)) {
                return trimmed.substring(4).replace("\"", "").trim();
            }
        }
        return null;
    }

    private static boolean hasIp(String value) {
        return value != null && !value.isBlank() && !UNKNOWN.equalsIgnoreCase(value.trim());
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        if (normalized.startsWith("[") && normalized.endsWith("]")) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }
        int zoneIndex = normalized.indexOf('%');
        if (zoneIndex >= 0) {
            normalized = normalized.substring(0, zoneIndex);
        }
        if ("0:0:0:0:0:0:0:1".equals(normalized) || "::1".equals(normalized)) {
            return "127.0.0.1";
        }
        return normalized;
    }
}
