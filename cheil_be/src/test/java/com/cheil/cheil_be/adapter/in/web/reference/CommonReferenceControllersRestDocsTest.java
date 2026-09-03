package com.cheil.cheil_be.adapter.in.web.reference;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
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

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.cheil.cheil_be.adapter.in.web.certification.CertificationController;
import com.cheil.cheil_be.adapter.in.web.client.ClientController;
import com.cheil.cheil_be.adapter.in.web.commoncode.CommonCodeController;
import com.cheil.cheil_be.adapter.in.web.commondepartment.DepartmentController;
import com.cheil.cheil_be.adapter.in.web.constructiontype.ConstructionTypeController;
import com.cheil.cheil_be.application.certification.service.CertificationAdminService;
import com.cheil.cheil_be.application.client.service.ClientAdminService;
import com.cheil.cheil_be.application.commoncode.service.CommonCodeAdminService;
import com.cheil.cheil_be.application.commondepartment.service.DepartmentAdminService;
import com.cheil.cheil_be.application.constructiontype.service.ConstructionTypeAdminService;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService;
import com.cheil.cheil_be.config.security.AppSecurityProperties;
import com.cheil.cheil_be.config.security.ServiceCredentialRegistry;

@WebMvcTest(controllers = {
        CommonCodeController.class,
        ConstructionTypeController.class,
        CertificationController.class,
        DepartmentController.class,
        ClientController.class
})
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
class CommonReferenceControllersRestDocsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CommonCodeAdminService commonCodeAdminService;

    @MockitoBean
    private ConstructionTypeAdminService constructionTypeAdminService;

    @MockitoBean
    private CertificationAdminService certificationAdminService;

    @MockitoBean
    private DepartmentAdminService departmentAdminService;

    @MockitoBean
    private ClientAdminService clientAdminService;

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
    void listCommonCodesDocumentsQueryContract() throws Exception {
        when(commonCodeAdminService.findAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/code/common-codes")
                        .param("codeLevel", "2")
                        .param("level1Code", "ST")
                        .param("useYn", "true"))
                .andExpect(status().isOk())
                .andDo(document("code-common-codes-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(
                                parameterWithName("keyword").description("Optional code name search.").optional(),
                                parameterWithName("useYn").description("Use status filter.").optional(),
                                parameterWithName("codeLevel").description("Code level filter.").optional(),
                                parameterWithName("level1Code").description("Level 1 code filter.").optional(),
                                parameterWithName("level2Code").description("Level 2 code filter.").optional(),
                                parameterWithName("level2CodePrefix").description("Level 2 code prefix filter.").optional(),
                                parameterWithName("level3Code").description("Level 3 code filter.").optional(),
                                parameterWithName("refValue1Contains").description("Reference value search.").optional(),
                                parameterWithName("sort").description("Sort option.").optional(),
                                parameterWithName("bypassCache").description("Whether to bypass the code cache.").optional()
                        ), responseFields(fieldWithPath("[]").description("Common code records."))));
    }

    @Test
    void listConstructionTypesDocumentsQueryContract() throws Exception {
        when(constructionTypeAdminService.findAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/code/construction-types").param("codeLevel", "2").param("level1Code", "ST"))
                .andExpect(status().isOk())
                .andDo(document("code-construction-types-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(
                                parameterWithName("keyword").description("Optional code name search.").optional(),
                                parameterWithName("useYn").description("Use status filter.").optional(),
                                parameterWithName("codeLevel").description("Code level filter.").optional(),
                                parameterWithName("level1Code").description("Level 1 code filter.").optional(),
                                parameterWithName("level2Code").description("Level 2 code filter.").optional()
                        ), responseFields(fieldWithPath("[]").description("Construction type records."))));
    }

    @Test
    void listCertificationsDocumentsQueryContract() throws Exception {
        when(certificationAdminService.findAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/code/certifications").param("certKind", "1"))
                .andExpect(status().isOk())
                .andDo(document("code-certifications-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(parameterWithName("certKind").description("Certification kind filter.").optional()),
                        responseFields(fieldWithPath("[]").description("Certification records."))));
    }

    @Test
    void listDepartmentsDocumentsQueryContract() throws Exception {
        when(departmentAdminService.findAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/code/department").param("keyword", "head").param("useYn", "true"))
                .andExpect(status().isOk())
                .andDo(document("code-departments-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(
                                parameterWithName("keyword").description("Optional department name search.").optional(),
                                parameterWithName("useYn").description("Use status filter.").optional()
                        ), responseFields(fieldWithPath("[]").description("Department records."))));
    }

    @Test
    void listClientsDocumentsQueryAndPageContract() throws Exception {
        when(clientAdminService.findAll(any(), any())).thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/code/client-codes")
                        .param("businessName", "client")
                        .param("orderClass", "A")
                        .param("companyType", "1")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andDo(document("code-client-codes-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(
                                parameterWithName("businessName").description("Business or client name search.").optional(),
                                parameterWithName("orderClass").description("Order class filter.").optional(),
                                parameterWithName("companyType").description("Company type filter.").optional(),
                                parameterWithName("page").description("Zero-based page number.").optional(),
                                parameterWithName("size").description("Page size.").optional()
                        ), responseFields(
                                fieldWithPath("content").description("Client records."),
                                fieldWithPath("page").description("Zero-based page number."),
                                fieldWithPath("size").description("Page size."),
                                fieldWithPath("totalElements").description("Total number of clients."),
                                fieldWithPath("totalPages").description("Total number of pages."),
                                fieldWithPath("first").description("Whether this is the first page."),
                                fieldWithPath("last").description("Whether this is the last page.")
                        )));
    }
}
