package com.cheil.cheil_be.adapter.in.web.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.auth.port.in.IssueTokenCommand;
import com.cheil.cheil_be.application.auth.port.in.IssueTokenUseCase;
import com.cheil.cheil_be.common.security.ServicePrincipal;

/**
 * 서비스 인증이 완료된 호출자에게 최초 발급용 토큰을 발급하는 API 컨트롤러입니다.
 */
@RestController
@RequestMapping("/token")
@RequiredArgsConstructor
public class AuthTokenController {

    private final IssueTokenUseCase issueTokenUseCase;

    @PostMapping
    public ResponseEntity<TokenIssueResponse> issue(
            Authentication authentication,
            @RequestBody(required = false) TokenIssueRequest request
    ) {
        ServicePrincipal principal = switch (authentication.getPrincipal()) {
            case ServicePrincipal servicePrincipal -> servicePrincipal;
            default -> throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "서비스 인증이 필요합니다.");
        };

        var token = issueTokenUseCase.issue(new IssueTokenCommand(
                principal.serviceId(),
                request == null ? null : request.normalizedScopes()
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(TokenIssueResponse.from(token));
    }
}
