package com.cheil.cheil_be.adapter.in.web.userauth;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.error.GlobalExceptionHandler;
import com.cheil.cheil_be.application.userauth.port.in.LoginCommand;
import com.cheil.cheil_be.application.userauth.port.in.LoginResult;
import com.cheil.cheil_be.application.userauth.port.in.LoginSessionResult;
import com.cheil.cheil_be.application.userauth.port.in.LoginUseCase;
import com.cheil.cheil_be.application.userauth.port.in.LogoutSessionUseCase;
import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionQueryUseCase;
import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionResult;
import com.cheil.cheil_be.application.userauth.port.in.SignupResult;
import com.cheil.cheil_be.application.userauth.port.in.SignupUseCase;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService;
import com.cheil.cheil_be.application.userauth.service.UserAccountAdminService;
import com.cheil.cheil_be.config.security.LoginJwtAuthenticationFilter;
import com.cheil.cheil_be.config.security.ServiceHeaderAuthenticationFilter;

@WebMvcTest(
        controllers = UserAuthController.class,
        excludeFilters = {
                @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = ServiceHeaderAuthenticationFilter.class),
                @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = LoginJwtAuthenticationFilter.class)
        }
)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class UserAuthControllerTest {

    private static final Gson GSON = new Gson();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LoginUseCase loginUseCase;

    @MockitoBean
    private LogoutSessionUseCase logoutSessionUseCase;

    @MockitoBean
    private SignupUseCase signupUseCase;

    @MockitoBean
    private ValidateLoginSessionUseCase validateLoginSessionUseCase;

    @MockitoBean
    private MenuPermissionQueryUseCase menuPermissionQueryUseCase;

    @MockitoBean
    private UserAccountAdminService userAccountAdminService;

    @MockitoBean
    private LoginAccessTokenService loginAccessTokenService;

    @Test
    void loginReturnsUserProfile() throws Exception {
        when(loginAccessTokenService.issue(
                "stleekm",
                "session-123",
                Instant.parse("2026-06-19T00:00:00Z")
        )).thenReturn(new LoginAccessTokenService.LoginAccessToken(
                "jwt-token",
                "Bearer",
                Instant.parse("2026-06-19T00:00:00Z")
        ));
        when(loginUseCase.login(any(), any())).thenReturn(new LoginResult(
                "150801",
                "stleekm",
                "Seongtae Lee",
                "100",
                "0",
                true,
                Instant.parse("2026-06-18T00:00:00Z"),
                "203.0.113.10",
                false,
                new LoginSessionResult(
                        "session-123",
                        Instant.parse("2026-06-19T00:00:00Z"),
                        1440,
                        60
                )
        ));

        mockMvc.perform(post("/auth/login")
                        .header("X-Forwarded-For", "203.0.113.10, 10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(GSON.toJson(Map.of(
                                "loginId", "stleekm",
                                "userPassword", "kmlee0414"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeNo", is("150801")))
                .andExpect(jsonPath("$.loginId", is("stleekm")))
                .andExpect(jsonPath("$.userName", is("Seongtae Lee")))
                .andExpect(jsonPath("$.groupCode", is("100")))
                .andExpect(jsonPath("$.deptCode", is("0")))
                .andExpect(jsonPath("$.useYn", is(true)))
                .andExpect(jsonPath("$.loginDt", is("2026-06-18T00:00:00Z")))
                .andExpect(jsonPath("$.recentIpAddr", is("203.0.113.10")))
                .andExpect(jsonPath("$.passwordReset", is(false)))
                .andExpect(jsonPath("$.token.accessToken", is("jwt-token")))
                .andExpect(jsonPath("$.token.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.token.expiresAt", is("2026-06-19T00:00:00Z")))
                .andExpect(jsonPath("$.session.id", is("session-123")))
                .andExpect(jsonPath("$.session.expiresAt", is("2026-06-19T00:00:00Z")))
                .andExpect(jsonPath("$.session.timeoutMinutes", is(1440)))
                .andExpect(jsonPath("$.session.idleTimeoutMinutes", is(60)));

        var commandCaptor = org.mockito.ArgumentCaptor.forClass(LoginCommand.class);
        verify(loginUseCase).login(commandCaptor.capture(), eq("203.0.113.10"));
        assertEquals("stleekm", commandCaptor.getValue().loginId());
        assertEquals("kmlee0414", commandCaptor.getValue().userPassword());
    }

    @Test
    void validateSessionReturnsNoContent() throws Exception {
        when(loginAccessTokenService.parse("Bearer jwt-token")).thenReturn(new LoginAccessTokenService.LoginAccessTokenClaims(
                "stleekm",
                "session-123",
                Instant.parse("2026-06-19T00:00:00Z")
        ));

        mockMvc.perform(get("/auth/session")
                        .header("Authorization", "Bearer jwt-token"))
                .andExpect(status().isNoContent());
    }

    @Test
    void menuPermissionsReturnsEffectivePermissions() throws Exception {
        when(loginAccessTokenService.parse("Bearer jwt-token")).thenReturn(new LoginAccessTokenService.LoginAccessTokenClaims(
                "stleekm",
                "session-123",
                Instant.parse("2026-06-19T00:00:00Z")
        ));
        when(menuPermissionQueryUseCase.findEffectivePermissions("stleekm")).thenReturn(List.of(
                new MenuPermissionResult(
                        "department",
                        "Common Department",
                        "code-root",
                        "/code/departments",
                        "PAGE",
                        140,
                        true,
                        true,
                        true,
                        true,
                        false,
                        false
                )
        ));

        mockMvc.perform(get("/auth/menu-permissions")
                        .header("Authorization", "Bearer jwt-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].menuCode", is("department")))
                .andExpect(jsonPath("$[0].menuName", is("Common Department")))
                .andExpect(jsonPath("$[0].menuPath", is("/code/departments")))
                .andExpect(jsonPath("$[0].readYn", is(true)))
                .andExpect(jsonPath("$[0].createYn", is(true)))
                .andExpect(jsonPath("$[0].updateYn", is(false)))
                .andExpect(jsonPath("$[0].deleteYn", is(false)));

        verify(validateLoginSessionUseCase).validate(any());
    }

    @Test
    void logoutReturnsNoContent() throws Exception {
        when(loginAccessTokenService.parse("Bearer jwt-token")).thenReturn(new LoginAccessTokenService.LoginAccessTokenClaims(
                "stleekm",
                "session-123",
                Instant.parse("2026-06-19T00:00:00Z")
        ));

        mockMvc.perform(post("/auth/logout")
                        .header("Authorization", "Bearer jwt-token"))
                .andExpect(status().isNoContent());
    }

    @Test
    void signupReturnsCreatedUser() throws Exception {
        when(signupUseCase.signup(any())).thenReturn(new SignupResult(
                "250001",
                "stleekm",
                "SeongLee",
                "100",
                "10",
                true
        ));

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(GSON.toJson(Map.of(
                                "employeeNo", "250001",
                                "userName", "SeongLee",
                                "loginId", "stleekm",
                                "userPassword", "kmlee0414",
                                "deptCode", "10",
                                "groupCode", "100"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeNo", is("250001")))
                .andExpect(jsonPath("$.loginId", is("stleekm")))
                .andExpect(jsonPath("$.userName", is("SeongLee")))
                .andExpect(jsonPath("$.groupCode", is("100")))
                .andExpect(jsonPath("$.deptCode", is("10")))
                .andExpect(jsonPath("$.useYn", is(true)));
    }

    @Test
    void loginReturnsBackendMessageWhenRejected() throws Exception {
        when(loginUseCase.login(any(), any())).thenThrow(new ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED,
                "Invalid password."
        ));

        mockMvc.perform(post("/auth/login")
                        .header("X-Forwarded-For", "203.0.113.10, 10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(GSON.toJson(Map.of(
                                "loginId", "stleekm",
                                "userPassword", "wrong"
                        ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid password.")))
                .andExpect(jsonPath("$.path", is("/auth/login")));
    }
}
