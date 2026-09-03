package com.cheil.cheil_be.adapter.in.web.servicetype;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessResponse;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.cheil.cheil_be.application.servicetype.service.ServiceTypeAdminService;
import com.cheil.cheil_be.domain.servicetype.ServiceType;

@WebMvcTest(ServiceTypeController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
class ServiceTypeControllerRestDocsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ServiceTypeAdminService serviceTypeAdminService;

    @MockitoBean
    private com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService loginAccessTokenService;

    @MockitoBean
    private com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase validateLoginSessionUseCase;

    @MockitoBean
    private com.cheil.cheil_be.config.security.AppSecurityProperties appSecurityProperties;

    @MockitoBean
    private java.time.Clock clock;

    @MockitoBean
    private com.cheil.cheil_be.config.security.ServiceCredentialRegistry serviceCredentialRegistry;

    @Test
    void listServiceTypesDocumentsResponse() throws Exception {
        when(serviceTypeAdminService.findAll()).thenReturn(List.of(serviceType()));

        mockMvc.perform(get("/pq/service-types"))
                .andExpect(status().isOk())
                .andDo(document("pq-service-types-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        responseFields(
                                fieldWithPath("[].serviceTypeCode").description("Service type code."),
                                fieldWithPath("[].serviceTypeName").description("Service type name."),
                                fieldWithPath("[].useYn").description("Whether the service type is active."),
                                fieldWithPath("[].createdAt").description("Created timestamp."),
                                fieldWithPath("[].createdId").description("Created user."),
                                fieldWithPath("[].lastChangedAt").description("Last changed timestamp."),
                                fieldWithPath("[].lastChangedId").description("Last changed user.")
                        )));
    }

    @Test
    void getServiceTypeDocumentsPathParameter() throws Exception {
        when(serviceTypeAdminService.findByServiceTypeCode("r")).thenReturn(serviceType());

        mockMvc.perform(get("/pq/service-types/{serviceTypeCode}", "r"))
                .andExpect(status().isOk())
                .andDo(document("pq-service-types-get", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        pathParameters(parameterWithName("serviceTypeCode").description("Service type code.")),
                        serviceTypeResponseFields()));
    }

    @Test
    void createServiceTypeDocumentsRequestAndResponse() throws Exception {
        when(serviceTypeAdminService.create(any())).thenReturn(serviceType());

        mockMvc.perform(post("/pq/service-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceTypeCode\":\"r\",\"serviceTypeName\":\"Road\",\"useYn\":true}"))
                .andExpect(status().isOk())
                .andDo(document("pq-service-types-create", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestFields(
                                fieldWithPath("serviceTypeCode").description("Service type code."),
                                fieldWithPath("serviceTypeName").description("Service type name."),
                                fieldWithPath("useYn").description("Whether the service type is active.")
                        ), serviceTypeResponseFields()));
    }

    @Test
    void updateServiceTypeDocumentsRequestAndResponse() throws Exception {
        when(serviceTypeAdminService.update(any(), any())).thenReturn(serviceType());

        mockMvc.perform(put("/pq/service-types/{serviceTypeCode}", "r")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceTypeCode\":\"r\",\"serviceTypeName\":\"Road\",\"useYn\":true}"))
                .andExpect(status().isOk())
                .andDo(document("pq-service-types-update", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        pathParameters(parameterWithName("serviceTypeCode").description("Service type code.")),
                        requestFields(
                                fieldWithPath("serviceTypeCode").description("Service type code."),
                                fieldWithPath("serviceTypeName").description("Service type name."),
                                fieldWithPath("useYn").description("Whether the service type is active.")
                        ), serviceTypeResponseFields()));
    }

    @Test
    void deleteServiceTypeDocumentsPathParameter() throws Exception {
        doNothing().when(serviceTypeAdminService).delete("r");

        mockMvc.perform(delete("/pq/service-types/{serviceTypeCode}", "r"))
                .andExpect(status().isNoContent())
                .andDo(document("pq-service-types-delete", preprocessRequest(prettyPrint()),
                        pathParameters(parameterWithName("serviceTypeCode").description("Service type code."))));
    }

    private static ServiceType serviceType() {
        Instant timestamp = Instant.parse("2026-08-26T00:00:00Z");
        return new ServiceType("r", "Road", true, timestamp, "system", timestamp, "system");
    }

    private static org.springframework.restdocs.payload.ResponseFieldsSnippet serviceTypeResponseFields() {
        return responseFields(
                fieldWithPath("serviceTypeCode").description("Service type code."),
                fieldWithPath("serviceTypeName").description("Service type name."),
                fieldWithPath("useYn").description("Whether the service type is active."),
                fieldWithPath("createdAt").description("Created timestamp."),
                fieldWithPath("createdId").description("Created user."),
                fieldWithPath("lastChangedAt").description("Last changed timestamp."),
                fieldWithPath("lastChangedId").description("Last changed user.")
        );
    }
}
