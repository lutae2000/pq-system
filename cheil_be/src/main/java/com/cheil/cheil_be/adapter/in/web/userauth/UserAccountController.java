package com.cheil.cheil_be.adapter.in.web.userauth;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.userauth.port.in.UserAccountSearchCondition;
import com.cheil.cheil_be.application.userauth.port.in.UserAccountUpsertCommand;
import com.cheil.cheil_be.application.userauth.service.UserAccountAdminService;

/**
 * 관리자용 사용자 계정 관리 API.
 * auth_users 테이블을 조회, 필터링, 상세 조회, 저장하는 화면 전용 엔드포인트입니다.
 */
@RestController
@RequestMapping("/auth/users")
@RequiredArgsConstructor
public class UserAccountController {

    private final UserAccountAdminService userAccountAdminService;

    /**
     * 사용자 계정 목록 조회.
     * 화면의 조회 버튼에서 전달한 검색 조건을 auth_users 기준으로 필터링해 반환합니다.
     */
    /**
     * 사용자 계정 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<UserAccountPageResponse> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String useYn,
            @RequestParam(required = false) String groupCode,
            @RequestParam(required = false) String deptCode,
            @RequestParam(required = false, defaultValue = "0") Integer page
    ) {
        Page<UserAccountResponse> result = userAccountAdminService.findAll(new UserAccountSearchCondition(
                keyword,
                useYn,
                groupCode,
                deptCode
        ), page).map(UserAccountResponse::from);

        return ResponseEntity.ok(new UserAccountPageResponse(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        ));
    }

    /**
     * 단일 사용자 계정 상세 조회.
     * 목록 선택 시 편집 패널에 표시할 데이터를 내려줍니다.
     */
    /**
     * 사용자 계정 단건을 조회한다.
     */
    @GetMapping("/{employeeNo}")
    public ResponseEntity<UserAccountResponse> get(@PathVariable String employeeNo) {
        if (!StringUtils.hasText(employeeNo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeNo는 필수입니다.");
        }

        return ResponseEntity.ok(UserAccountResponse.from(userAccountAdminService.findByEmployeeNo(employeeNo)));
    }

    /**
     * 사용자 계정 저장.
     * 신규 등록과 수정 모두 이 엔드포인트를 사용합니다.
     */
    /**
     * 사용자 계정을 신규 저장하거나 수정한다.
     */
    @PostMapping
    public ResponseEntity<UserAccountResponse> upsert(@RequestBody UserAccountUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        var saved = userAccountAdminService.upsert(new UserAccountUpsertCommand(
                request.employeeNo(),
                request.userName(),
                request.loginId(),
                request.userPassword(),
                request.useYn(),
                request.groupCode(),
                request.deptCode(),
                request.loginDt(),
                request.recentIpAddr(),
                request.passwordResetDt(),
                request.passwordReset() != null && request.passwordReset(),
                request.picYn(),
                request.wrongPasswordCount(),
                request.email(),
                request.lastChangedId()
        ));
        return ResponseEntity.ok(UserAccountResponse.from(saved));
    }

    /**
     * 비밀번호 초기화를 수행한다.
     */
    @PostMapping("/{employeeNo}/password-reset")
    public ResponseEntity<UserAccountResponse> resetPassword(@PathVariable String employeeNo) {
        if (!StringUtils.hasText(employeeNo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeNo is required.");
        }

        return ResponseEntity.ok(UserAccountResponse.from(userAccountAdminService.resetPassword(employeeNo)));
    }

    /**
     * 특정 로그인 계정의 메뉴 권한을 조회한다.
     */
    @GetMapping("/{loginId}/menu-permissions")
    public ResponseEntity<List<UserMenuPermissionResponse>> listUserMenuPermissions(@PathVariable String loginId) {
        return ResponseEntity.ok(userAccountAdminService.findUserMenuPermissions(loginId).stream()
                .map(UserMenuPermissionResponse::from)
                .toList());
    }

    /**
     * 특정 로그인 계정의 메뉴 권한을 저장한다.
     */
    @PutMapping("/{loginId}/menu-permissions")
    public ResponseEntity<List<UserMenuPermissionResponse>> saveUserMenuPermissions(
            @PathVariable String loginId,
            @RequestBody UserMenuPermissionUpsertRequest request
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        return ResponseEntity.ok(userAccountAdminService.saveUserMenuPermissions(loginId, request.items()).stream()
                .map(UserMenuPermissionResponse::from)
                .toList());
    }

    public record UserAccountUpsertRequest(
            String employeeNo,
            String userName,
            String loginId,
            String userPassword,
            Boolean useYn,
            String groupCode,
            String deptCode,
            String loginDt,
            String recentIpAddr,
            String passwordResetDt,
            Boolean passwordReset,
            String picYn,
            Integer wrongPasswordCount,
            String email,
            String lastChangedId
    ) {
    }

    public record UserMenuPermissionUpsertRequest(List<UserAccountAdminService.UserMenuPermissionUpsertItem> items) {
    }

    public record UserAccountPageResponse(
            List<UserAccountResponse> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
    }

    public record UserMenuPermissionResponse(
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
        static UserMenuPermissionResponse from(UserAccountAdminService.UserMenuPermissionView view) {
            return new UserMenuPermissionResponse(
                    view.loginId(),
                    view.menuCode(),
                    view.menuName(),
                    view.parentMenuCode(),
                    view.menuPath(),
                    view.menuType(),
                    view.sortSeq(),
                    view.useYn(),
                    view.visibleYn(),
                    view.description(),
                    view.read(),
                    view.create(),
                    view.update(),
                    view.delete()
            );
        }
    }
}
