package com.cheil.cheil_be.adapter.in.web.userauth;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.userauth.port.in.LoginCommand;
import com.cheil.cheil_be.application.userauth.port.in.LoginUseCase;
import com.cheil.cheil_be.application.userauth.port.in.LogoutSessionCommand;
import com.cheil.cheil_be.application.userauth.port.in.LogoutSessionUseCase;
import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionQueryUseCase;
import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionResult;
import com.cheil.cheil_be.application.userauth.port.in.SignupUseCase;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionCommand;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService;
import com.cheil.cheil_be.application.userauth.service.UserAccountAdminService;
import com.cheil.cheil_be.common.security.SecurityHeaders;
import com.cheil.cheil_be.common.web.ClientIpResolver;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserAuthController {

    private final LoginUseCase loginUseCase;
    private final LogoutSessionUseCase logoutSessionUseCase;
    private final SignupUseCase signupUseCase;
    private final ValidateLoginSessionUseCase validateLoginSessionUseCase;
    private final MenuPermissionQueryUseCase menuPermissionQueryUseCase;
    private final UserAccountAdminService userAccountAdminService;
    private final LoginAccessTokenService loginAccessTokenService;

    /**
     * 로그인 요청을 처리하고 액세스 토큰을 발급한다.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpServletRequest
    ) {
        if (request == null || !StringUtils.hasText(request.loginId()) || !StringUtils.hasText(request.userPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "loginId와 userPassword는 필수입니다.");
        }
        var result = loginUseCase.login(
                new LoginCommand(request.loginId(), request.userPassword()),
                ClientIpResolver.resolve(httpServletRequest)
        );
        var token = loginAccessTokenService.issue(
                result.loginId(),
                result.session().id(),
                result.session().expiresAt()
        );
        return ResponseEntity.ok(LoginResponse.from(result, token));
    }

    /**
     * 회원가입 요청을 처리한다.
     */
    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@RequestBody SignupRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "회원가입 요청 본문은 필수입니다.");
        }

        var result = signupUseCase.signup(request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(SignupResponse.from(result));
    }

    /**
     * 세션 유효성을 검증한다.
     */
    @GetMapping("/session")
    public ResponseEntity<Void> validateSession(
            @RequestHeader(SecurityHeaders.AUTHORIZATION) String authorization
    ) {
        var token = validateAccessToken(authorization);
        return ResponseEntity.noContent().build();
    }

    /**
     * 현재 사용자 기준 메뉴 권한을 조회한다.
     */
    @GetMapping("/menu-permissions")
    public ResponseEntity<List<MenuPermissionResponse>> menuPermissions(
            @RequestHeader(SecurityHeaders.AUTHORIZATION) String authorization
    ) {
        var token = validateAccessToken(authorization);
        return ResponseEntity.ok(menuPermissionQueryUseCase.findEffectivePermissions(token.loginId()).stream()
                .map(MenuPermissionResponse::from)
                .toList());
    }

    /**
     * 비밀번호를 변경한다.
     */
    @PatchMapping("/password")
    public ResponseEntity<UserAccountResponse> changePassword(
            @RequestHeader(SecurityHeaders.AUTHORIZATION) String authorization,
            @RequestBody ChangePasswordRequest request
    ) {
        var token = validateAccessToken(authorization);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        return ResponseEntity.ok(UserAccountResponse.from(userAccountAdminService.changePassword(
                token.loginId(),
                request.currentPassword(),
                request.newPassword()
        )));
    }

    /**
     * 로그아웃하고 세션을 종료한다.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(SecurityHeaders.AUTHORIZATION) String authorization
    ) {
        var token = loginAccessTokenService.parse(authorization);
        logoutSessionUseCase.logout(new LogoutSessionCommand(token.loginId(), token.sessionId()));
        return ResponseEntity.noContent().build();
    }

    private LoginAccessTokenService.LoginAccessTokenClaims validateAccessToken(String authorization) {
        var token = loginAccessTokenService.parse(authorization);
        validateLoginSessionUseCase.validate(new ValidateLoginSessionCommand(token.loginId(), token.sessionId()));
        return token;
    }

    public record MenuPermissionResponse(
            String menuCode,
            String menuName,
            String parentMenuCode,
            String menuPath,
            String menuType,
            int sortSeq,
            boolean useYn,
            boolean visibleYn,
            boolean readYn,
            boolean createYn,
            boolean updateYn,
            boolean deleteYn
    ) {

        static MenuPermissionResponse from(MenuPermissionResult permission) {
            return new MenuPermissionResponse(
                    permission.menuCode(),
                    permission.menuName(),
                    permission.parentMenuCode(),
                    permission.menuPath(),
                    permission.menuType(),
                    permission.sortSeq(),
                    permission.useYn(),
                    permission.visibleYn(),
                    permission.readYn(),
                    permission.createYn(),
                    permission.updateYn(),
                    permission.deleteYn()
            );
        }
    }

    public record ChangePasswordRequest(
            String currentPassword,
            String newPassword
    ) {
    }
}
