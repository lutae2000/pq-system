package com.cheil.cheil_be.adapter.in.web.engineer;

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
import static org.springframework.restdocs.request.RequestDocumentation.queryParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.cheil.cheil_be.application.engineer.EngineerAdminService;
import com.cheil.cheil_be.application.engineer.EngineerDtos;

@WebMvcTest(EngineerController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
class EngineerControllerRestDocsTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private EngineerAdminService service;
    @MockitoBean private com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService loginAccessTokenService;
    @MockitoBean private com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase validateLoginSessionUseCase;
    @MockitoBean private com.cheil.cheil_be.config.security.AppSecurityProperties appSecurityProperties;
    @MockitoBean private java.time.Clock clock;
    @MockitoBean private com.cheil.cheil_be.config.security.ServiceCredentialRegistry serviceCredentialRegistry;

    @Test
    void listEngineersDocumentsQueryAndPageContract() throws Exception {
        when(service.findAll(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(new PageImpl<>(List.of()));
        mockMvc.perform(get("/pq/engineers").param("page", "0").param("size", "100").param("keyword", "Kim"))
                .andExpect(status().isOk()).andDo(document("pq-engineers-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(parameterWithName("page").description("Zero-based page number.").optional(), parameterWithName("size").description("Page size.").optional(), parameterWithName("retireYn").description("Retirement filter.").optional(), parameterWithName("status").description("Status filter.").optional(), parameterWithName("keyword").description("Engineer name or ID search.").optional(), parameterWithName("certificationName").description("Certification filter.").optional(), parameterWithName("department").description("Department filter.").optional(), parameterWithName("designGrade").description("Design grade filter.").optional(), parameterWithName("constructionManagementGrade").description("Construction management grade filter.").optional(), parameterWithName("specialtyField").description("Specialty field filter.").optional(), parameterWithName("jobField").description("Job field filter.").optional()),
                        responseFields(fieldWithPath("content").description("Engineer profiles."), fieldWithPath("page").description("Page number."), fieldWithPath("size").description("Page size."), fieldWithPath("totalElements").description("Total engineers."), fieldWithPath("totalPages").description("Total pages."), fieldWithPath("first").description("Whether this is the first page."), fieldWithPath("last").description("Whether this is the last page."))));
    }

    @Test
    void getEngineerDocumentsPathContract() throws Exception {
        when(service.findByEngrId("E001")).thenReturn(profile());
        mockMvc.perform(get("/pq/engineers/{engrId}", "E001")).andExpect(status().isOk())
                .andDo(document("pq-engineers-get", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), pathParameters(parameterWithName("engrId").description("Engineer identifier.")), profileFields()));
    }

    @Test
    void saveEngineerProfileSectionsDocumentsContracts() throws Exception {
        when(service.create(any())).thenReturn(profile());
        when(service.update(any(), any())).thenReturn(profile());
        when(service.saveBasic(any(), any())).thenReturn(profile());
        when(service.saveLicenses(any(), any())).thenReturn(profile());
        when(service.saveCareers(any(), any())).thenReturn(profile());
        when(service.savePrizes(any(), any())).thenReturn(profile());
        when(service.saveEducations(any(), any())).thenReturn(profile());
        when(service.saveCareerDetails(any(), any())).thenReturn(profile());
        when(service.saveSchools(any(), any())).thenReturn(profile());

        mockMvc.perform(post("/pq/engineers").contentType(MediaType.APPLICATION_JSON).content("{\"basic\":null,\"licenses\":[],\"careers\":[],\"prizes\":[],\"educations\":[],\"careerDetails\":[],\"schools\":[]}"))
                .andExpect(status().isOk()).andDo(document("pq-engineers-create", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), requestFields(profileRequestFields()), profileFields()));
        mockMvc.perform(put("/pq/engineers/{engrId}", "E001").contentType(MediaType.APPLICATION_JSON).content("{\"basic\":null,\"licenses\":[],\"careers\":[],\"prizes\":[],\"educations\":[],\"careerDetails\":[],\"schools\":[]}"))
                .andExpect(status().isOk()).andDo(document("pq-engineers-update", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), pathParameters(parameterWithName("engrId").description("Engineer identifier.")), requestFields(profileRequestFields()), profileFields()));
        saveSection("master", "/pq/engineers/{engrId}/master", "E001", "{\"engrId\":\"E001\"}", "pq-engineers-master-save");
        saveSection("licenses", "/pq/engineers/{engrId}/licenses", "E001", "[]", "pq-engineers-licenses-save");
        saveSection("careers", "/pq/engineers/{engrId}/careers", "E001", "[]", "pq-engineers-careers-save");
        saveSection("prizes", "/pq/engineers/{engrId}/prizes", "E001", "[]", "pq-engineers-prizes-save");
        saveSection("educations", "/pq/engineers/{engrId}/educations", "E001", "[]", "pq-engineers-educations-save");
        saveSection("career-details", "/pq/engineers/{engrId}/career-details", "E001", "[]", "pq-engineers-career-details-save");
        saveSection("schools", "/pq/engineers/{engrId}/schools", "E001", "[]", "pq-engineers-schools-save");
    }

    @Test
    void deleteEngineerProfileAndSectionsDocumentsContracts() throws Exception {
        when(service.deleteLicense(any(), any())).thenReturn(profile()); when(service.deleteCareer(any(), any())).thenReturn(profile());
        when(service.deletePrize(any(), any())).thenReturn(profile()); when(service.deleteEducation(any(), any())).thenReturn(profile());
        when(service.deleteCareerDetail(any(), any())).thenReturn(profile()); when(service.deleteSchool(any(), any())).thenReturn(profile());
        doNothing().when(service).delete("E001");
        mockMvc.perform(org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.delete("/pq/engineers/{engrId}", "E001")).andExpect(status().isNoContent()).andDo(document("pq-engineers-delete", preprocessRequest(prettyPrint()), pathParameters(parameterWithName("engrId").description("Engineer identifier."))));
        deleteSection("licenses", "1", "pq-engineers-licenses-delete"); deleteSection("careers", "1", "pq-engineers-careers-delete");
        deleteSection("prizes", "1", "pq-engineers-prizes-delete"); deleteSection("educations", "1", "pq-engineers-educations-delete");
        deleteSection("career-details", "1", "pq-engineers-career-details-delete"); deleteSection("schools", "1", "pq-engineers-schools-delete");
    }

    private void saveSection(String section, String path, String engineerId, String body, String id) throws Exception {
        var requestDescriptor = section.equals("master")
                ? fieldWithPath("engrId").description("Engineer identifier.")
                : fieldWithPath("[]").description(section + " section.");
        mockMvc.perform(put(path, engineerId).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk())
                .andDo(document(id, preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), pathParameters(parameterWithName("engrId").description("Engineer identifier.")), requestFields(requestDescriptor), profileFields()));
    }

    private void deleteSection(String section, String recordId, String id) throws Exception {
        mockMvc.perform(org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.delete("/pq/engineers/{engrId}/" + section + "/{recordId}", "E001", recordId)).andExpect(status().isOk())
                .andDo(document(id, preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), pathParameters(parameterWithName("engrId").description("Engineer identifier."), parameterWithName("recordId").description("Section record ID.")), profileFields()));
    }

    private static EngineerDtos.Profile profile() {
        return new EngineerDtos.Profile(null, List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
    }

    private static org.springframework.restdocs.payload.FieldDescriptor[] profileRequestFields() {
        return new org.springframework.restdocs.payload.FieldDescriptor[]{
                fieldWithPath("basic").description("Basic engineer information."), fieldWithPath("licenses").description("License records."),
                fieldWithPath("careers").description("Career records."), fieldWithPath("prizes").description("Prize records."),
                fieldWithPath("educations").description("Education records."), fieldWithPath("careerDetails").description("Detailed career records."),
                fieldWithPath("schools").description("School records.")
        };
    }

    private static org.springframework.restdocs.payload.ResponseFieldsSnippet profileFields() {
        return responseFields(fieldWithPath("basic").description("Basic engineer information."), fieldWithPath("licenses").description("License records."), fieldWithPath("careers").description("Career records."), fieldWithPath("prizes").description("Prize records."), fieldWithPath("educations").description("Education records."), fieldWithPath("careerDetails").description("Detailed career records."), fieldWithPath("schools").description("School records."));
    }
}
