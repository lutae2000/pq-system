package com.cheil.cheil_be.adapter.in.web.auth;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.post;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessResponse;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import com.cheil.cheil_be.adapter.out.security.JdkJwtTokenProvider;
import com.cheil.cheil_be.application.auth.port.out.TokenIssueHistoryRecorder;
import com.cheil.cheil_be.application.auth.service.TokenIssueService;
import com.cheil.cheil_be.common.security.SecurityHeaders;
import com.cheil.cheil_be.config.security.SecurityConfig;
import com.cheil.cheil_be.config.security.LoginJwtAuthenticationFilter;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService;
import com.cheil.cheil_be.config.security.ServiceCredentialRegistry;
import com.cheil.cheil_be.config.security.ServiceHeaderAuthenticationFilter;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(AuthTokenController.class)
@ExtendWith(SpringExtension.class)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
@Import({
        SecurityConfig.class,
        ServiceHeaderAuthenticationFilter.class,
        LoginJwtAuthenticationFilter.class,
        ServiceCredentialRegistry.class,
        TokenIssueService.class,
        JdkJwtTokenProvider.class,
        AuthTokenControllerRestDocsTest.FixedClockConfig.class
})
@TestPropertySource(properties = {
        "app.security.token.issuer=cheil-be-test",
        "app.security.token.secret=0123456789abcdef0123456789abcdef",
        "app.security.token.ttl=PT30M",
        "app.security.integrations.application.service-id=application",
        "app.security.integrations.application.api-key=test-api-key"
})
class AuthTokenControllerRestDocsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LoginAccessTokenService loginAccessTokenService;

    @MockitoBean
    private ValidateLoginSessionUseCase validateLoginSessionUseCase;

    @Test
    void issueTokenSucceedsWithValidServiceHeaders() throws Exception {
        mockMvc.perform(post("/token")
                        .header(SecurityHeaders.SERVICE_ID, "application")
                        .header(SecurityHeaders.API_KEY, "test-api-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "scopes": ["read:common"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken", startsWith("ey")))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(1800))
                .andExpect(jsonPath("$.expiresAt").value("2026-06-18T00:30:00Z"))
                .andExpect(jsonPath("$.serviceId").value("application"))
                .andDo(document(
                        "auth-token-issue-success",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestHeaders(
                                headerWithName(SecurityHeaders.SERVICE_ID).description("Calling service id. Use `server` to bypass API key validation in development/test calls."),
                                headerWithName(SecurityHeaders.API_KEY).description("API key assigned to the calling service.")
                        ),
                        requestFields(
                                fieldWithPath("scopes[]").description("Optional token scopes requested by the service.")
                        ),
                        responseFields(
                                fieldWithPath("accessToken").description("Issued signed bearer token."),
                                fieldWithPath("tokenType").description("Token type. Fixed to `Bearer`."),
                                fieldWithPath("expiresIn").description("Token lifetime in seconds."),
                                fieldWithPath("expiresAt").description("Token expiry timestamp in UTC."),
                                fieldWithPath("serviceId").description("Authenticated service id.")
                        )
                ));
    }

    @Test
    void issueTokenSucceedsWithServerServiceIdWithoutApiKey() throws Exception {
        mockMvc.perform(post("/token")
                        .header(SecurityHeaders.SERVICE_ID, "server"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken", startsWith("ey")))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.serviceId").value("server"))
                .andDo(document(
                        "auth-token-issue-server-bypass",
                        preprocessResponse(prettyPrint()),
                        requestHeaders(
                                headerWithName(SecurityHeaders.SERVICE_ID).description("Set to `server` to bypass API key validation for fast development and tests.")
                        ),
                        responseFields(
                                fieldWithPath("accessToken").description("Issued signed bearer token."),
                                fieldWithPath("tokenType").description("Token type. Fixed to `Bearer`."),
                                fieldWithPath("expiresIn").description("Token lifetime in seconds."),
                                fieldWithPath("expiresAt").description("Token expiry timestamp in UTC."),
                                fieldWithPath("serviceId").description("Authenticated service id.")
                        )
                ));
    }

    @Test
    void corsPreflightAllowsFrontendServiceHeaders() throws Exception {
        mockMvc.perform(options("/token")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,x-service-id,x-api-key,x-login-id"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("POST")))
                .andExpect(header().string("Access-Control-Allow-Headers", containsString("x-service-id")))
                .andExpect(header().string("Access-Control-Allow-Headers", containsString("x-api-key")));
    }

    @Test
    void issueTokenFailsWithoutServiceHeaders() throws Exception {
        mockMvc.perform(post("/token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").exists())
                .andDo(document(
                        "auth-token-issue-missing-headers",
                        preprocessResponse(prettyPrint()),
                        responseFields(
                                fieldWithPath("timestamp").description("Failure timestamp."),
                                fieldWithPath("status").description("HTTP status code."),
                                fieldWithPath("error").description("HTTP status reason."),
                                fieldWithPath("message").description("Failure reason.")
                                        .optional(),
                                fieldWithPath("path").description("Request path.")
                        )
                ));
    }

    @Test
    void issueTokenFailsWithInvalidApiKey() throws Exception {
        mockMvc.perform(post("/token")
                .header(SecurityHeaders.SERVICE_ID, "application")
                .header(SecurityHeaders.API_KEY, "wrong-api-key"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andDo(document(
                        "auth-token-issue-invalid-api-key",
                        preprocessResponse(prettyPrint()),
                        requestHeaders(
                                headerWithName(SecurityHeaders.SERVICE_ID).description("Calling service id."),
                                headerWithName(SecurityHeaders.API_KEY).description("Invalid API key in this failure example.")
                        ),
                        responseFields(
                                fieldWithPath("timestamp").description("Failure timestamp."),
                                fieldWithPath("status").description("HTTP status code."),
                                fieldWithPath("error").description("HTTP status reason."),
                                fieldWithPath("message").description("Failure reason."),
                                fieldWithPath("path").description("Request path.")
                        )
                ));
    }

    @TestConfiguration
    static class FixedClockConfig {

        @Bean
        Clock clock() {
            return Clock.fixed(Instant.parse("2026-06-18T00:00:00Z"), ZoneOffset.UTC);
        }

        @Bean
        TokenIssueHistoryRecorder tokenIssueHistoryRecorder() {
            return (issuer, serviceId, scopes, issuedToken, issuedAt) -> {
            };
        }

        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }
}
