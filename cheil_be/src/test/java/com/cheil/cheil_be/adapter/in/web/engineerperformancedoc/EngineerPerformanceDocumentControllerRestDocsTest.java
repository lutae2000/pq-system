package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

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
import static org.springframework.restdocs.request.RequestDocumentation.requestParts;
import static org.springframework.restdocs.request.RequestDocumentation.partWithName;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.multipart;
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
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.cheil.cheil_be.application.engineerperformancedoc.service.EngineerPerformanceDocumentService;
import com.cheil.cheil_be.application.engineerperformancedoc.service.HwpxDocumentGenerationService;

@WebMvcTest(EngineerPerformanceDocumentController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
class EngineerPerformanceDocumentControllerRestDocsTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private EngineerPerformanceDocumentService documentService;
    @MockitoBean private HwpxDocumentGenerationService hwpxService;
    @MockitoBean private com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService loginAccessTokenService;
    @MockitoBean private com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase validateLoginSessionUseCase;
    @MockitoBean private com.cheil.cheil_be.config.security.AppSecurityProperties appSecurityProperties;
    @MockitoBean private java.time.Clock clock;
    @MockitoBean private com.cheil.cheil_be.config.security.ServiceCredentialRegistry serviceCredentialRegistry;

    @Test
    void inspectHwpxDocumentsContract() throws Exception {
        when(hwpxService.inspect(any())).thenReturn(List.of(new HwpxTemplateFieldResponse("projectName", "Sample project")));
        mockMvc.perform(multipart("/pq/engineer-performance-docs/hwpx/inspect")
                        .file(new MockMultipartFile("template", "template.hwpx", "application/zip", new byte[]{1})))
                .andExpect(status().isOk())
                .andDo(document("pq-engineer-performance-docs-hwpx-inspect", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestParts(partWithName("template").description("HWPX template file.")),
                        responseFields(fieldWithPath("[].name").description("Template field name."), fieldWithPath("[].sampleValue").description("Sample value."))));
    }

    @Test
    void generateHwpxDocumentsContract() throws Exception {
        when(hwpxService.generate(any(), any())).thenReturn(new byte[]{1});
        mockMvc.perform(multipart("/pq/engineer-performance-docs/hwpx/generate")
                        .file(new MockMultipartFile("template", "template.hwpx", "application/zip", new byte[]{1}))
                        .file(new MockMultipartFile("request", "request.json", MediaType.APPLICATION_JSON_VALUE,
                                "{\"bidSeq\":20261072,\"engineerIds\":[\"E001\"],\"mappings\":{}}".getBytes())))
                .andExpect(status().isOk())
                .andDo(document("pq-engineer-performance-docs-hwpx-generate", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestParts(partWithName("template").description("HWPX template file."), partWithName("request").description("JSON generation request."))));
    }

    @Test
    void listProjectHistoriesDocumentsContract() throws Exception {
        when(documentService.findProjectHistories("E001", null)).thenReturn(List.of());
        mockMvc.perform(get("/pq/engineer-performance-docs/project-histories").param("engineerId", "E001"))
                .andExpect(status().isOk()).andDo(document("pq-engineer-performance-docs-project-histories", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(parameterWithName("engineerId").description("Engineer identifier."), parameterWithName("relatedProjectHistoryConditions").description("Optional conditions JSON.").optional()),
                        responseFields(fieldWithPath("[]").description("Project history records."))));
    }

    @Test
    void listDocumentValueSettingsDocumentsContract() throws Exception {
        when(documentService.findDocumentValueSettings(20261072L)).thenReturn(List.of());
        mockMvc.perform(get("/pq/engineer-performance-docs/document-value-settings").param("bidSeq", "20261072"))
                .andExpect(status().isOk()).andDo(document("pq-engineer-performance-docs-value-settings-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(parameterWithName("bidSeq").description("Bid notice sequence.")), responseFields(fieldWithPath("[]").description("Document value settings."))));
    }

    @Test
    void saveDocumentValueSettingDocumentsContract() throws Exception {
        when(documentService.saveDocumentValueSetting(any())).thenReturn(new EngineerDocumentValueSettingResponse(20261072L, "E001", 10L, 20L, null, "system", null, "system"));
        mockMvc.perform(put("/pq/engineer-performance-docs/document-value-settings").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bidSeq\":20261072,\"engineerId\":\"E001\",\"educationId\":10,\"licenseId\":20}"))
                .andExpect(status().isOk()).andDo(document("pq-engineer-performance-docs-value-settings-save", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestFields(fieldWithPath("bidSeq").description("Bid notice sequence."), fieldWithPath("engineerId").description("Engineer identifier."), fieldWithPath("educationId").description("Education record ID."), fieldWithPath("licenseId").description("License record ID.")),
                        responseFields(fieldWithPath("bidSeq").description("Bid notice sequence."), fieldWithPath("engineerId").description("Engineer identifier."), fieldWithPath("educationId").description("Education record ID."), fieldWithPath("licenseId").description("License record ID."), fieldWithPath("createdAt").description("Created timestamp."), fieldWithPath("createdId").description("Created user."), fieldWithPath("lastChangedAt").description("Last changed timestamp."), fieldWithPath("lastChangedId").description("Last changed user."))));
    }

    @Test
    void listReviewResultsDocumentsContract() throws Exception {
        when(documentService.findReviewResults(20261072L, "E001", null)).thenReturn(List.of());
        mockMvc.perform(get("/pq/engineer-performance-docs/review-results").param("bidSeq", "20261072").param("engineerId", "E001"))
                .andExpect(status().isOk()).andDo(document("pq-engineer-performance-docs-review-results-list", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        queryParameters(parameterWithName("bidSeq").description("Bid notice sequence."), parameterWithName("engineerId").description("Engineer identifier."), parameterWithName("relatedProjectHistoryConditions").description("Optional conditions JSON.").optional()), responseFields(fieldWithPath("[]").description("Review result records."))));
    }

    @Test
    void createReviewResultDocumentsContract() throws Exception {
        when(documentService.createReviewResult(any())).thenReturn(null);
        mockMvc.perform(post("/pq/engineer-performance-docs/review-results").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bidSeq\":20261072,\"engineerId\":\"E001\",\"sourceSeq\":1,\"displayOrder\":1,\"sourceRow\":{\"id\":\"P001\"}}"))
                .andExpect(status().isOk()).andDo(document("pq-engineer-performance-docs-review-result-create", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestFields(fieldWithPath("bidSeq").description("Bid notice sequence."), fieldWithPath("engineerId").description("Engineer identifier."), fieldWithPath("sourceSeq").description("Source sequence."), fieldWithPath("displayOrder").description("Display order."), fieldWithPath("sourceRow").description("Source project history row."), fieldWithPath("sourceRow.id").description("Source row identifier."))));
    }

    @Test
    void syncReviewResultsDocumentsContract() throws Exception {
        when(documentService.syncReviewResults(any())).thenReturn(List.of());
        mockMvc.perform(post("/pq/engineer-performance-docs/review-results/sync").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bidSeq\":20261072,\"engineerId\":\"E001\"}"))
                .andExpect(status().isOk()).andDo(document("pq-engineer-performance-docs-review-results-sync", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestFields(fieldWithPath("bidSeq").description("Bid notice sequence."), fieldWithPath("engineerId").description("Engineer identifier."))));
    }

    @Test
    void updateReviewResultDocumentsContract() throws Exception {
        when(documentService.updateReviewResult(any(), any())).thenReturn(null);
        mockMvc.perform(put("/pq/engineer-performance-docs/review-results/{reviewId}", 1).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bidSeq\":20261072,\"engineerId\":\"E001\",\"sourceSeq\":1,\"displayOrder\":1,\"sourceRow\":{}}"))
                .andExpect(status().isOk()).andDo(document("pq-engineer-performance-docs-review-result-update", preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        pathParameters(parameterWithName("reviewId").description("Review result ID.")), requestFields(fieldWithPath("bidSeq").description("Bid notice sequence."), fieldWithPath("engineerId").description("Engineer identifier."), fieldWithPath("sourceSeq").description("Source sequence."), fieldWithPath("displayOrder").description("Display order."), fieldWithPath("sourceRow").description("Source project history row."))));
    }

    @Test
    void deleteReviewResultDocumentsContract() throws Exception {
        doNothing().when(documentService).deleteReviewResult(20261072L, "E001", 1L);
        mockMvc.perform(delete("/pq/engineer-performance-docs/review-results/{bidSeq}/{engineerId}/{reviewId}", 20261072, "E001", 1))
                .andExpect(status().isNoContent()).andDo(document("pq-engineer-performance-docs-review-result-delete", preprocessRequest(prettyPrint()), pathParameters(parameterWithName("bidSeq").description("Bid notice sequence."), parameterWithName("engineerId").description("Engineer identifier."), parameterWithName("reviewId").description("Review result ID."))));
    }
}
