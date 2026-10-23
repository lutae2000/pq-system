package com.cheil.cheil_be.application.userauth.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.common.service.PasswordHashService;
import com.cheil.cheil_be.application.userauth.model.UserAccountCommand;
import com.cheil.cheil_be.application.userauth.model.UserAccountSearch;
import com.cheil.cheil_be.application.userauth.model.UserMenuPermission;
import com.cheil.cheil_be.application.userauth.model.UserMenuPermissionCommand;
import com.cheil.cheil_be.application.userauth.port.in.UserAccountAdminUseCase;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.application.userauth.port.out.UserMenuPermissionRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.userauth.UserAccount;

@Service
@RequiredArgsConstructor
public class UserAccountAdminService implements UserAccountAdminUseCase {

    private final UserAccountRepository userAccountRepository;
    private final UserMenuPermissionRepository userMenuPermissionRepository;
    private final PasswordHashService passwordHashService;
    private final CurrentActorPort currentActorPort;
    private final Clock clock;

    private static final String DEFAULT_RESET_PASSWORD = "0000";
    private static final DateTimeFormatter PASSWORD_RESET_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Transactional(readOnly = true)
    @Override
    public Page<UserAccount> findAll(UserAccountSearch condition, Pageable pageable) {
        if (pageable == null) {
            throw ApplicationException.badRequest("페이지 정보는 필수입니다.");
        }
        String keyword = StringValues.normalize(condition.keyword()).toLowerCase(Locale.ROOT);
        String useYn = StringValues.normalize(condition.useYn());
        String groupCode = StringValues.normalize(condition.groupCode());
        String deptCode = StringValues.normalize(condition.deptCode());

        List<UserAccount> filteredUsers = userAccountRepository.findAll().stream()
                .filter(user -> matchesKeyword(user, keyword))
                .filter(user -> matchesUseYn(user, useYn))
                .filter(user -> matchesCode(groupCode, user.groupCode()))
                .filter(user -> matchesCode(deptCode, user.deptCode()))
                .toList();

        int fromIndex = Math.min(Math.toIntExact(pageable.getOffset()), filteredUsers.size());
        int toIndex = Math.min(fromIndex + pageable.getPageSize(), filteredUsers.size());
        return new PageImpl<>(filteredUsers.subList(fromIndex, toIndex), pageable, filteredUsers.size());
    }

    @Transactional(readOnly = true)
    public UserAccount findByEmployeeNo(String employeeNo) {
        return userAccountRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> ApplicationException.notFound("사용자 계정을 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public List<UserMenuPermission> findUserMenuPermissions(String loginId) {
        String normalizedLoginId = findByLoginId(loginId).loginId();
        return userMenuPermissionRepository.findAll(normalizedLoginId);
    }

    @Transactional
    public List<UserMenuPermission> saveUserMenuPermissions(String loginId, List<UserMenuPermissionCommand> items) {
        String normalizedLoginId = findByLoginId(loginId).loginId();
        if (items == null) {
            throw ApplicationException.badRequest("permission items are required");
        }
        List<UserMenuPermissionCommand> normalized = items.stream()
                .filter(item -> item != null && StringUtils.hasText(item.menuCode()))
                .map(item -> new UserMenuPermissionCommand(item.menuCode().trim(), item.read(), item.create(), item.update(), item.delete()))
                .toList();
        userMenuPermissionRepository.replaceAll(normalizedLoginId, normalized);
        return userMenuPermissionRepository.findAll(normalizedLoginId);
    }

    @Transactional(readOnly = true)
    public UserAccount findByLoginId(String loginId) {
        return userAccountRepository.findByLoginId(loginId)
                .orElseThrow(() -> ApplicationException.notFound("사용자 계정을 찾을 수 없습니다."));
    }

    @Transactional
    public UserAccount upsert(UserAccountCommand command) {
        if (command == null) {
            throw ApplicationException.badRequest("user account is required");
        }
        String employeeNo = requiredText(command.employeeNo(), "employeeNo");
        String userName = requiredText(command.userName(), "userName");
        String loginId = requiredText(command.loginId(), "loginId");
        String groupCode = requiredText(command.groupCode(), "groupCode");
        String deptCode = requiredText(command.deptCode(), "deptCode");

        UserAccount existing = userAccountRepository.findByEmployeeNo(employeeNo).orElse(null);
        boolean createMode = existing == null;

        userAccountRepository.findByLoginId(loginId)
                .filter(item -> !item.employeeNo().equals(employeeNo))
                .ifPresent(item -> {
                    throw ApplicationException.conflict("이미 존재하는 로그인 ID입니다.");
                });

        String rawPassword = command.userPassword() == null ? "" : command.userPassword().trim();
        String passwordToSave;
        if (!rawPassword.isBlank()) {
            passwordToSave = passwordHashService.hash(rawPassword);
        } else if (!createMode) {
            passwordToSave = existing.userPassword();
        } else {
            throw ApplicationException.badRequest("신규 계정은 비밀번호가 필요합니다.");
        }

        Instant occurredAt = Instant.now(clock);
        UserAccount updated = new UserAccount(
                employeeNo,
                userName,
                loginId,
                passwordToSave,
                command.useYn() != null ? command.useYn() : true,
                groupCode,
                deptCode,
                parseInstant(command.loginDt()),
                StringValues.normalize(command.recentIpAddr()),
                StringValues.normalize(command.passwordResetDt()),
                command.passwordReset() != null && command.passwordReset(),
                normalizePicYn(command.picYn()),
                normalizeCount(command.wrongPasswordCount()),
                StringValues.normalize(command.email()),
                occurredAt,
                StringUtils.hasText(command.lastChangedId()) ? command.lastChangedId().trim() : currentActorPort.currentActor()
        );

        return userAccountRepository.save(updated);
    }

    @Transactional
    public UserAccount resetPassword(String employeeNo) {
        UserAccount userAccount = findByEmployeeNo(employeeNo);
        Instant occurredAt = Instant.now(clock);
        String actorId = currentActorPort.currentActor();
        return userAccountRepository.save(userAccount.resetPassword(
                passwordHashService.hash(DEFAULT_RESET_PASSWORD),
                passwordResetDate(occurredAt),
                occurredAt,
                actorId
        ));
    }

    private static Instant parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().replace('T', ' ');
        if (normalized.length() == 19 && normalized.charAt(10) == ' ') {
            return java.time.LocalDateTime.parse(normalized, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                    .atZone(java.time.ZoneId.systemDefault())
                    .toInstant();
        }

        return Instant.parse(value.trim());
    }

    private static boolean normalizePicYn(String value) {
        String normalized = StringValues.normalize(value);
        return "Y".equalsIgnoreCase(normalized) || "true".equalsIgnoreCase(normalized);
    }

    private static int normalizeCount(Integer value) {
        return value == null ? 0 : Math.max(0, value);
    }

    private static String passwordResetDate(Instant occurredAt) {
        return PASSWORD_RESET_DATE_FORMATTER.format(occurredAt.atZone(ZoneId.systemDefault()));
    }

    private static boolean matchesKeyword(UserAccount user, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        return StringValues.containsIgnoreCase(user.employeeNo(), keyword)
                || StringValues.containsIgnoreCase(user.userName(), keyword)
                || StringValues.containsIgnoreCase(user.loginId(), keyword)
                || StringValues.containsIgnoreCase(user.groupCode(), keyword)
                || StringValues.containsIgnoreCase(user.deptCode(), keyword)
                || StringValues.containsIgnoreCase(user.email(), keyword)
                || StringValues.containsIgnoreCase(user.recentIpAddr(), keyword)
                || StringValues.containsIgnoreCase(user.lastChangedId(), keyword)
                || StringValues.containsIgnoreCase(user.loginDt() == null ? "" : user.loginDt().toString(), keyword)
                || StringValues.containsIgnoreCase(user.lastChangedAt() == null ? "" : user.lastChangedAt().toString(), keyword);
    }

    private static boolean matchesUseYn(UserAccount user, String useYn) {
        if (useYn == null || useYn.isBlank() || "All".equalsIgnoreCase(useYn)) {
            return true;
        }
        return "Y".equalsIgnoreCase(useYn) ? user.useYn() : !user.useYn();
    }

    private static boolean matchesCode(String expected, String actual) {
        return expected == null || expected.isBlank() || "All".equalsIgnoreCase(expected) || expected.equals(actual);
    }

}
