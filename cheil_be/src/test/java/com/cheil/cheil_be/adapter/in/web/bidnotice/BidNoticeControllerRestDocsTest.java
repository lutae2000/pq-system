package com.cheil.cheil_be.adapter.in.web.bidnotice;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessResponse;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Clock;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.cheil.cheil_be.application.bidnotice.service.BidNoticeAdminService;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService;
import com.cheil.cheil_be.config.security.AppSecurityProperties;
import com.cheil.cheil_be.config.security.ServiceCredentialRegistry;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@WebMvcTest(BidNoticeController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
class BidNoticeControllerRestDocsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BidNoticeAdminService bidNoticeAdminService;

    @MockitoBean
    private BidNoticeResponseMapper bidNoticeResponseMapper;

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
    void getBidNoticeDocumentsDashboardDetail() throws Exception {
        BidNotice bidNotice = new BidNotice(
                20261072L, "100906", "Sample project", "CLIENT", BigDecimal.valueOf(1000000),
                "T2A", "ZA", LocalDate.of(2026, 6, 18), LocalDateTime.of(2026, 6, 18, 9, 0),
                LocalDateTime.of(2026, 6, 20, 9, 0), "FAK", LocalDateTime.of(2026, 7, 1, 10, 0),
                "Y", "150801", LocalDate.of(2026, 6, 19), "150801", "Y", "CA",
                LocalDateTime.of(2026, 6, 20, 10, 0), "A", LocalDateTime.of(2026, 6, 30, 18, 0),
                "DA", "T2A", null, null, null, "Y", "Prime contractor", "Remark", "Y",
                java.time.Instant.parse("2026-06-18T00:00:00Z"), "system",
                java.time.Instant.parse("2026-06-18T00:00:00Z"), "system");
        when(bidNoticeAdminService.findByBidSeq(20261072L)).thenReturn(bidNotice);
        when(bidNoticeResponseMapper.toResponse(bidNotice)).thenReturn(response());

        mockMvc.perform(get("/pq/bid-notice/{bidSeq}", 20261072))
                .andExpect(status().isOk())
                .andDo(document(
                        "pq-bid-notice-detail",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        pathParameters(parameterWithName("bidSeq").description("Bid notice sequence.")),
                        responseFields(
                                fieldWithPath("bidSeq").description("Bid notice sequence."),
                                fieldWithPath("departmentCode").description("Department code."),
                                fieldWithPath("projectName").description("Project name."),
                                fieldWithPath("orderClient").description("Ordering client code."),
                                fieldWithPath("designAmt").description("Design amount."),
                                fieldWithPath("bidType").description("Bid type code."),
                                fieldWithPath("bidMethod").description("Bid method code."),
                                fieldWithPath("announceDate").description("Announcement date."),
                                fieldWithPath("pqRegistDate").description("PQ registration timestamp."),
                                fieldWithPath("pqSubmitDate").description("PQ submission timestamp."),
                                fieldWithPath("orderMethod").description("Ordering method code."),
                                fieldWithPath("orderMethodLabel").description("Ordering method label."),
                                fieldWithPath("bidDate").description("Bid date."),
                                fieldWithPath("bidSuccessYn").description("Bid success flag."),
                                fieldWithPath("bidSuccessYnLabel").description("Bid success label."),
                                fieldWithPath("pqDecideEmpno").description("PQ decision employee number."),
                                fieldWithPath("pqDecideDate").description("PQ decision date."),
                                fieldWithPath("superDecideEmpno").description("Supervisor decision employee number."),
                                fieldWithPath("participateYn").description("Participation flag."),
                                fieldWithPath("participateYnLabel").description("Participation label."),
                                fieldWithPath("businessType").description("Business type code."),
                                fieldWithPath("businessTypeLabel").description("Business type label."),
                                fieldWithPath("bidSubmissionDate").description("Bid submission timestamp."),
                                fieldWithPath("processTag").description("Process tag."),
                                fieldWithPath("bidClosingDate").description("Bid closing timestamp."),
                                fieldWithPath("fieldOfWorkCode").description("Field of work code."),
                                fieldWithPath("fieldOfWorkLabel").description("Field of work label."),
                                fieldWithPath("scopeOfWorkCode").description("Scope of work code."),
                                fieldWithPath("scopeOfWorkLabel").description("Scope of work label."),
                                fieldWithPath("reasonOfAbsenceCode").description("Reason of absence code."),
                                fieldWithPath("siteBriefingDate").description("Site briefing timestamp."),
                                fieldWithPath("tpSubmitDate").description("Technical proposal submission timestamp."),
                                fieldWithPath("tpPassYn").description("Technical proposal pass flag."),
                                fieldWithPath("primeContractor").description("Prime contractor."),
                                fieldWithPath("remark").description("Remark."),
                                fieldWithPath("refmatYn").description("Reference material flag."),
                                fieldWithPath("departmentName").description("Department name."),
                                fieldWithPath("orderClientName").description("Ordering client name."),
                                fieldWithPath("bidTypeLabel").description("Bid type label."),
                                fieldWithPath("bidMethodLabel").description("Bid method label."),
                                fieldWithPath("createdAt").description("Created timestamp."),
                                fieldWithPath("createdId").description("Created user."),
                                fieldWithPath("lastChangedAt").description("Last changed timestamp."),
                                fieldWithPath("lastChangedId").description("Last changed user.")
                        )
                ));
    }

    private static BidNoticeResponse response() {
        return new BidNoticeResponse(20261072L, "100906", "Sample project", "CLIENT", BigDecimal.valueOf(1000000),
                "T2A", "ZA", LocalDate.of(2026, 6, 18), LocalDateTime.of(2026, 6, 18, 9, 0),
                LocalDateTime.of(2026, 6, 20, 9, 0), "FAK", "Ordering", LocalDateTime.of(2026, 7, 1, 10, 0),
                "Y", "Success", "150801", LocalDate.of(2026, 6, 19), "150801", "Y", "Yes", "CA", "Construction",
                LocalDateTime.of(2026, 6, 20, 10, 0), "A", LocalDateTime.of(2026, 6, 30, 18, 0), "DA", "Road",
                "T2A", "Construction management", null, null, null, "Y", "Prime contractor", "Remark", "Y",
                "Department", "Client", "Bid type", "Bid method", null, "system", null, null);
    }
}
