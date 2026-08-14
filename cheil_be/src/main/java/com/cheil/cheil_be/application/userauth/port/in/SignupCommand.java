package com.cheil.cheil_be.application.userauth.port.in;

import org.springframework.util.StringUtils;

public record SignupCommand(
        String employeeNo,
        String userName,
        String loginId,
        String userPassword,
        String deptCode,
        String groupCode
) {

    public SignupCommand {
        validateLoginId(loginId);
        validateNoWhitespace(userName, 100, "사용자명은 공백 없이 입력해야 합니다.");

        if (!StringUtils.hasText(userPassword)) {
            throw new IllegalArgumentException("비밀번호는 필수입니다.");
        }
        if (!StringUtils.hasText(deptCode)) {
            throw new IllegalArgumentException("부서는 필수입니다.");
        }
        if (!StringUtils.hasText(groupCode)) {
            throw new IllegalArgumentException("그룹코드는 필수입니다.");
        }

        employeeNo = resolveEmployeeNo(employeeNo, loginId);
    }

    private static String resolveEmployeeNo(String employeeNo, String loginId) {
        String normalizedEmployeeNo = StringUtils.hasText(employeeNo) ? employeeNo.trim() : loginId.trim();
        if (normalizedEmployeeNo.length() > 20) {
            throw new IllegalArgumentException("사번은 최대 20자리까지 입력할 수 있습니다.");
        }
        return normalizedEmployeeNo;
    }

    private static void validateNoWhitespace(String value, int maxLength, String message) {
        if (!StringUtils.hasText(value) || value.length() > maxLength || value.chars().anyMatch(Character::isWhitespace)) {
            throw new IllegalArgumentException(message);
        }
    }

    private static void validateLoginId(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("로그인 ID는 필수입니다.");
        }
        if (value.length() > 20 || value.chars().anyMatch(Character::isWhitespace)) {
            throw new IllegalArgumentException("로그인 ID는 공백 없이 최대 20자리까지 입력할 수 있습니다.");
        }
    }
}
