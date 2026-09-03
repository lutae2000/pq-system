package com.cheil.cheil_be.adapter.in.web.userauth;

import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessResponse;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.queryParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.Clock;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.data.domain.PageImpl;

import com.cheil.cheil_be.application.userauth.service.UserAccountAdminService;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.config.security.AppSecurityProperties;
import com.cheil.cheil_be.config.security.ServiceCredentialRegistry;
import com.cheil.cheil_be.domain.userauth.UserAccount;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@WebMvcTest(UserAccountController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
class UserAccountControllerRestDocsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserAccountAdminService userAccountAdminService;

    @MockitoBean
    private LoginAccessTokenService loginAccessTokenService;

    @MockitoBean
    private ValidateLoginSessionUseCase validateLoginSessionUseCase;

    @MockitoBean
    private AppSecurityProperties appSecurityProperties;

    @MockitoBean
    private Clock clock;

    @MockitoBean
    private ServiceCredentialRegistry serviceCredentialRegistry;

    @Test
    void listUsersDocumentsReferenceQuery() throws Exception {
        UserAccount user = new UserAccount(
                "150801", "SeongtaeLee", "stleekm", "encoded-password", true,
                "100", "10", Instant.parse("2026-06-18T00:00:00Z"), "203.0.113.10",
                "", false, true, 0, "stleekm@example.com",
                Instant.parse("2026-06-18T00:00:00Z"), "system");
        when(userAccountAdminService.findAll(any(), any())).thenReturn(new PageImpl<>(List.of(user)));

        mockMvc.perform(get("/auth/users")
                        .param("useYn", "Y")
                        .param("page", "0"))
                .andExpect(status().isOk())
                .andDo(document(
                        "auth-users-list",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        queryParameters(
                                parameterWithName("keyword").description("Optional name or login ID search.").optional(),
                                parameterWithName("useYn").description("Use status filter: `Y`, `N`, or omitted for all.").optional(),
                                parameterWithName("groupCode").description("Optional group code filter.").optional(),
                                parameterWithName("deptCode").description("Optional department code filter.").optional(),
                                parameterWithName("page").description("Zero-based page number.").optional()
                        ),
                        responseFields(
                                fieldWithPath("content").description("User accounts."),
                                fieldWithPath("content[].employeeNo").description("Employee number."),
                                fieldWithPath("content[].userName").description("User name."),
                                fieldWithPath("content[].loginId").description("Login ID."),
                                fieldWithPath("content[].useYn").description("Whether the account is active."),
                                fieldWithPath("content[].groupCode").description("Group code."),
                                fieldWithPath("content[].deptCode").description("Department code."),
                                fieldWithPath("content[].loginDt").description("Last login timestamp."),
                                fieldWithPath("content[].recentIpAddr").description("Last login IP address."),
                                fieldWithPath("content[].passwordResetDt").description("Password reset date."),
                                fieldWithPath("content[].passwordReset").description("Whether a password reset is required."),
                                fieldWithPath("content[].picYn").description("PIC flag."),
                                fieldWithPath("content[].wrongPasswordCount").description("Consecutive password failures."),
                                fieldWithPath("content[].email").description("Email address."),
                                fieldWithPath("content[].lastChangedAt").description("Last changed timestamp."),
                                fieldWithPath("content[].lastChangedId").description("Last changed user."),
                                fieldWithPath("page").description("Zero-based page number."),
                                fieldWithPath("size").description("Page size."),
                                fieldWithPath("totalElements").description("Total number of users."),
                                fieldWithPath("totalPages").description("Total number of pages.")
                        )
                ));
    }
}
