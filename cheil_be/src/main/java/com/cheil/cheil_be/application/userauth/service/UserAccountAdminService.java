package com.cheil.cheil_be.application.userauth.service;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.common.service.PasswordHashService;
import com.cheil.cheil_be.application.common.service.PasswordVerificationService;
import com.cheil.cheil_be.application.userauth.port.in.UserAccountSearchCondition;
import com.cheil.cheil_be.application.userauth.port.in.UserAccountUpsertCommand;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.JpaSystemMenuRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.SystemMenuEntity;
import com.cheil.cheil_be.adapter.out.persistence.userauth.JpaUserMenuPermissionRepository;
import com.cheil.cheil_be.adapter.out.persistence.userauth.UserMenuPermissionEntity;
import com.cheil.cheil_be.adapter.out.persistence.userauth.UserMenuPermissionId;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.userauth.UserAccount;

@Service
@RequiredArgsConstructor
public class UserAccountAdminService {

    private final UserAccountRepository userAccountRepository;
    private final JpaSystemMenuRepository systemMenuRepository;
    private final JpaUserMenuPermissionRepository userMenuPermissionRepository;
    private final PasswordHashService passwordHashService;
    private final PasswordVerificationService passwordVerificationService;
    private final Clock clock;

    private static final String DEFAULT_RESET_PASSWORD = "0000";
    private static final DateTimeFormatter PASSWORD_RESET_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Transactional(readOnly = true)
    public Page<UserAccount> findAll(UserAccountSearchCondition condition, Integer page) {
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

        var pageable = PageRequests.of(page);
        int fromIndex = Math.min(pageable.getPageNumber() * pageable.getPageSize(), filteredUsers.size());
        int toIndex = Math.min(fromIndex + pageable.getPageSize(), filteredUsers.size());

        return new PageImpl<>(filteredUsers.subList(fromIndex, toIndex), pageable, filteredUsers.size());
    }

    @Transactional(readOnly = true)
    public UserAccount findByEmployeeNo(String employeeNo) {
        return userAccountRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 계정을 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public List<UserMenuPermissionView> findUserMenuPermissions(String loginId) {
        findByLoginId(loginId);

        List<SystemMenuEntity> menus = systemMenuRepository.findAllByOrderBySortSeqAscMenuCodeAsc();
        Map<String, UserMenuPermissionEntity> permissionByMenu = userMenuPermissionRepository
                .findAllByIdLoginIdOrderByIdMenuCodeAsc(loginId)
                .stream()
                .collect(Collectors.toMap(item -> item.getId().getMenuCode(), item -> item));

        List<UserMenuPermissionView> views = new ArrayList<>();
        for (SystemMenuEntity menu : menus) {
            UserMenuPermissionEntity permission = permissionByMenu.get(menu.getMenuCode());
            views.add(new UserMenuPermissionView(
                    loginId,
                    menu.getMenuCode(),
                    menu.getMenuName(),
                    menu.getParentMenuCode(),
                    menu.getMenuPath(),
                    menu.getMenuType(),
                    menu.getSortSeq(),
                    menu.isUseYn(),
                    menu.isVisibleYn(),
                    menu.getDescription(),
                    permission != null && permission.isReadYn(),
                    permission != null && permission.isCreateYn(),
                    permission != null && permission.isUpdateYn(),
                    permission != null && permission.isDeleteYn()
            ));
        }

        return views.stream()
                .sorted(Comparator.comparingInt(UserMenuPermissionView::sortSeq).thenComparing(UserMenuPermissionView::menuCode))
                .toList();
    }

    @Transactional
    public List<UserMenuPermissionView> saveUserMenuPermissions(String loginId, List<UserMenuPermissionUpsertItem> items) {
        findByLoginId(loginId);

        userMenuPermissionRepository.deleteByIdLoginId(loginId);
        for (UserMenuPermissionUpsertItem item : items) {
            if (!StringUtils.hasText(item.menuCode())) {
                continue;
            }
            if (!item.read() && !item.create() && !item.update() && !item.delete()) {
                continue;
            }
            userMenuPermissionRepository.save(UserMenuPermissionEntity.builder()
                    .id(new UserMenuPermissionId(loginId, item.menuCode().trim()))
                    .readYn(item.read())
                    .createYn(item.create())
                    .updateYn(item.update())
                    .deleteYn(item.delete())
                    .build());
        }

        return findUserMenuPermissions(loginId);
    }

    @Transactional(readOnly = true)
    public UserAccount findByLoginId(String loginId) {
        return userAccountRepository.findByLoginId(loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 계정을 찾을 수 없습니다."));
    }

    @Transactional
    public UserAccount upsert(UserAccountUpsertCommand command) {
        if (command.employeeNo() == null || command.employeeNo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeNo는 필수입니다.");
        }
        if (command.userName() == null || command.userName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userName은 필수입니다.");
        }
        if (command.loginId() == null || command.loginId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "loginId는 필수입니다.");
        }
        if (command.groupCode() == null || command.groupCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "groupCode는 필수입니다.");
        }
        if (command.deptCode() == null || command.deptCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "deptCode는 필수입니다.");
        }

        UserAccount existing = userAccountRepository.findByEmployeeNo(command.employeeNo()).orElse(null);
        boolean createMode = existing == null;

        userAccountRepository.findByLoginId(command.loginId())
                .filter(item -> !item.employeeNo().equals(command.employeeNo()))
                .ifPresent(item -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 로그인 ID입니다.");
                });

        String rawPassword = command.userPassword() == null ? "" : command.userPassword().trim();
        String passwordToSave;
        if (!rawPassword.isBlank()) {
            passwordToSave = passwordHashService.hash(rawPassword);
        } else if (!createMode) {
            passwordToSave = existing.userPassword();
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "신규 계정은 비밀번호가 필요합니다.");
        }

        Instant occurredAt = Instant.now(clock);
        UserAccount updated = new UserAccount(
                command.employeeNo().trim(),
                command.userName().trim(),
                command.loginId().trim(),
                passwordToSave,
                command.useYn() != null ? command.useYn() : true,
                command.groupCode().trim(),
                command.deptCode().trim(),
                parseInstant(command.loginDt()),
                StringValues.normalize(command.recentIpAddr()),
                StringValues.normalize(command.passwordResetDt()),
                command.passwordReset() != null && command.passwordReset(),
                normalizePicYn(command.picYn()),
                normalizeCount(command.wrongPasswordCount()),
                StringValues.normalize(command.email()),
                occurredAt,
                AuditActorResolver.resolve(
                        command.lastChangedId() != null && !command.lastChangedId().isBlank()
                                ? command.lastChangedId().trim()
                                : command.loginId().trim()
                )
        );

        return userAccountRepository.save(updated);
    }

    @Transactional
    public UserAccount resetPassword(String employeeNo) {
        UserAccount userAccount = findByEmployeeNo(employeeNo);
        Instant occurredAt = Instant.now(clock);
        String actorId = AuditActorResolver.resolve("system");
        return userAccountRepository.save(userAccount.resetPassword(
                passwordHashService.hash(DEFAULT_RESET_PASSWORD),
                passwordResetDate(occurredAt),
                occurredAt,
                actorId
        ));
    }

    @Transactional
    public UserAccount changePassword(String loginId, String currentPassword, String newPassword) {
        if (!StringUtils.hasText(loginId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "loginId is required.");
        }
        if (!StringUtils.hasText(currentPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currentPassword is required.");
        }
        if (!StringUtils.hasText(newPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "newPassword is required.");
        }

        UserAccount userAccount = findByLoginId(loginId);
        if (!passwordVerificationService.matches(currentPassword, userAccount.userPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is not valid.");
        }

        Instant occurredAt = Instant.now(clock);
        return userAccountRepository.save(userAccount.changePassword(
                passwordHashService.hash(newPassword.trim()),
                passwordResetDate(occurredAt),
                occurredAt,
                AuditActorResolver.resolve(loginId)
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

        return contains(user.employeeNo(), keyword)
                || contains(user.userName(), keyword)
                || contains(user.loginId(), keyword)
                || contains(user.groupCode(), keyword)
                || contains(user.deptCode(), keyword)
                || contains(user.email(), keyword)
                || contains(user.recentIpAddr(), keyword)
                || contains(user.lastChangedId(), keyword)
                || contains(user.loginDt() == null ? "" : user.loginDt().toString(), keyword)
                || contains(user.lastChangedAt() == null ? "" : user.lastChangedAt().toString(), keyword);
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

    private static boolean contains(String value, String keyword) {
        return value != null && StringValues.containsIgnoreCase(value, keyword);
    }

    public record UserMenuPermissionUpsertItem(
            String menuCode,
            boolean read,
            boolean create,
            boolean update,
            boolean delete
    ) {
    }

    public record UserMenuPermissionView(
            String loginId,
            String menuCode,
            String menuName,
            String parentMenuCode,
            String menuPath,
            String menuType,
            int sortSeq,
            boolean useYn,
            boolean visibleYn,
            String description,
            boolean read,
            boolean create,
            boolean update,
            boolean delete
    ) {
    }
}
