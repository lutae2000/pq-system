package com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer;

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

import com.cheil.cheil_be.application.pqparticipatingengineer.service.PqParticipatingEngineerQueryService;

@WebMvcTest(PqParticipatingEngineerController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
class PqParticipatingEngineerControllerRestDocsTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private PqParticipatingEngineerQueryService queryService;
    @MockitoBean private com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService loginAccessTokenService;
    @MockitoBean private com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase validateLoginSessionUseCase;
    @MockitoBean private com.cheil.cheil_be.config.security.AppSecurityProperties appSecurityProperties;
    @MockitoBean private java.time.Clock clock;
    @MockitoBean private com.cheil.cheil_be.config.security.ServiceCredentialRegistry serviceCredentialRegistry;

    @Test
    void listCandidatesDocumentsQueryAndPageContract() throws Exception {
        when(queryService.findCandidates(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(new PageImpl<>(List.of()));
        mockMvc.perform(get("/pq/participating-engineers/candidates").param("bidSeq", "20261072").param("workDutyId", "01").param("page", "0").param("size", "20"))
                .andExpect(status().isOk()).andDo(document("pq-participating-engineers-candidates", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(parameterWithName("bidSeq").description("Bid notice sequence.").optional(), parameterWithName("workDutyId").description("Work duty identifier.").optional(), parameterWithName("keyword").description("Name or ID search.").optional(), parameterWithName("certificationName").description("Certification filter.").optional(), parameterWithName("constructionManagementGrade").description("Construction management grade filter.").optional(), parameterWithName("designGrade").description("Design grade filter.").optional(), parameterWithName("jobField").description("Job field filter.").optional(), parameterWithName("specialtyField").description("Specialty field filter.").optional(), parameterWithName("retireYn").description("Retirement filter.").optional(), parameterWithName("projectHistoryConditions").description("Project history conditions JSON.").optional(), parameterWithName("page").description("Zero-based page number.").optional(), parameterWithName("size").description("Page size.").optional()),
                        responseFields(fieldWithPath("content").description("Candidate engineers."), fieldWithPath("page").description("Page number."), fieldWithPath("size").description("Page size."), fieldWithPath("totalElements").description("Total candidates."), fieldWithPath("totalPages").description("Total pages."), fieldWithPath("first").description("Whether this is the first page."), fieldWithPath("last").description("Whether this is the last page."))));
    }

    @Test
    void listSelectedProfilesDocumentsQueryContract() throws Exception {
        when(queryService.findSelectedProfiles(20261072L, null, null)).thenReturn(List.of());
        mockMvc.perform(get("/pq/participating-engineers/profiles").param("bidSeq", "20261072"))
                .andExpect(status().isOk()).andDo(document("pq-participating-engineers-profiles", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), queryParameters(parameterWithName("bidSeq").description("Bid notice sequence."), parameterWithName("workDutyId").description("Optional work duty identifier.").optional(), parameterWithName("keyword").description("Optional name or ID search.").optional()), responseFields(fieldWithPath("[]").description("Selected engineer profiles."))));
    }

    @Test
    void listSelectedDocumentsQueryContract() throws Exception {
        when(queryService.findSelected(20261072L, null)).thenReturn(List.of());
        mockMvc.perform(get("/pq/participating-engineers").param("bidSeq", "20261072"))
                .andExpect(status().isOk()).andDo(document("pq-participating-engineers-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), queryParameters(parameterWithName("bidSeq").description("Bid notice sequence."), parameterWithName("workDutyId").description("Optional work duty identifier.").optional()), responseFields(fieldWithPath("[]").description("Selected engineers."))));
    }

    @Test
    void createSelectedEngineerDocumentsContract() throws Exception {
        when(queryService.create(any())).thenReturn(null);
        mockMvc.perform(post("/pq/participating-engineers").contentType(MediaType.APPLICATION_JSON).content("{\"bidSeq\":20261072,\"engrId\":\"E001\",\"workDutyId\":\"01\",\"priority\":1,\"role\":\"PM\",\"memo\":\"\"}"))
                .andExpect(status().isOk()).andDo(document("pq-participating-engineers-create", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), requestFields(fieldWithPath("bidSeq").description("Bid notice sequence."), fieldWithPath("engrId").description("Engineer identifier."), fieldWithPath("workDutyId").description("Work duty identifier."), fieldWithPath("priority").description("Display priority."), fieldWithPath("role").description("Assigned role."), fieldWithPath("memo").description("Memo."))));
    }

    @Test
    void updateSelectedEngineerDocumentsContract() throws Exception {
        when(queryService.update(any(), any(), any(), any())).thenReturn(null);
        mockMvc.perform(put("/pq/participating-engineers/{bidSeq}/{workDutyId}/{engrId}", 20261072, "01", "E001").contentType(MediaType.APPLICATION_JSON).content("{\"bidSeq\":20261072,\"engrId\":\"E001\",\"workDutyId\":\"01\",\"priority\":1,\"role\":\"PM\",\"memo\":\"\"}"))
                .andExpect(status().isOk()).andDo(document("pq-participating-engineers-update", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), pathParameters(parameterWithName("bidSeq").description("Bid notice sequence."), parameterWithName("workDutyId").description("Work duty identifier."), parameterWithName("engrId").description("Engineer identifier.")), requestFields(fieldWithPath("bidSeq").description("Bid notice sequence."), fieldWithPath("engrId").description("Engineer identifier."), fieldWithPath("workDutyId").description("Work duty identifier."), fieldWithPath("priority").description("Display priority."), fieldWithPath("role").description("Assigned role."), fieldWithPath("memo").description("Memo."))));
    }

    @Test
    void deleteSelectedEngineerDocumentsContract() throws Exception {
        doNothing().when(queryService).delete(20261072L, "01", "E001");
        mockMvc.perform(delete("/pq/participating-engineers/{bidSeq}/{workDutyId}/{engrId}", 20261072, "01", "E001"))
                .andExpect(status().isNoContent()).andDo(document("pq-participating-engineers-delete", preprocessRequest(prettyPrint()), pathParameters(parameterWithName("bidSeq").description("Bid notice sequence."), parameterWithName("workDutyId").description("Work duty identifier."), parameterWithName("engrId").description("Engineer identifier."))));
    }

    @Test
    void replaceSelectedEngineersDocumentsContract() throws Exception {
        when(queryService.replace(any())).thenReturn(List.of());
        mockMvc.perform(put("/pq/participating-engineers").contentType(MediaType.APPLICATION_JSON).content("{\"bidSeq\":20261072,\"workDutyId\":\"01\",\"engineers\":[{\"engrId\":\"E001\",\"priority\":1,\"role\":\"PM\",\"memo\":\"\"}]}"))
                .andExpect(status().isOk()).andDo(document("pq-participating-engineers-replace", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()), requestFields(fieldWithPath("bidSeq").description("Bid notice sequence."), fieldWithPath("workDutyId").description("Work duty identifier."), fieldWithPath("engineers").description("Replacement engineer list."), fieldWithPath("engineers[].engrId").description("Engineer identifier."), fieldWithPath("engineers[].priority").description("Display priority."), fieldWithPath("engineers[].role").description("Assigned role."), fieldWithPath("engineers[].memo").description("Memo.")), responseFields(fieldWithPath("[]").description("Selected engineers after replacement."))));
    }
}
