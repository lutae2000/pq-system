package com.cheil.cheil_be.adapter.in.web.bidnotice;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Clock;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeAdminUseCase;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSubmissionStatusUseCase;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeListRow;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetail;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetailQuery;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService;
import com.cheil.cheil_be.config.security.AppSecurityProperties;
import com.cheil.cheil_be.config.security.ServiceCredentialRegistry;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@WebMvcTest({BidNoticeController.class, BidNoticeSubmissionStatusController.class})
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs(outputDir = "build/generated-snippets")
class BidNoticeControllerRestDocsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BidNoticeAdminUseCase bidNoticeAdminUseCase;

    @MockitoBean
    private BidNoticeSubmissionStatusUseCase bidNoticeSubmissionStatusUseCase;

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
    void listsMonthlyAndCumulativePqSubmissionsByDepartment() throws Exception {
        when(bidNoticeSubmissionStatusUseCase.findByDepartmentAndYear(2026, 12))
                .thenReturn(List.of(new BidNoticeSubmissionCount("D01", 2026, 12, 3, false),
                        new BidNoticeSubmissionCount(null, 2026, 2, 1, false),
                        new BidNoticeSubmissionCount(null, 2026, 14, 4, true)));

        mockMvc.perform(get("/pq/submit-stat").param("year", "2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].departmentCode").value("D01"))
                .andExpect(jsonPath("$[0].year").value(2026))
                .andExpect(jsonPath("$[0].count").value(12))
                .andExpect(jsonPath("$[0].monthlyCount").value(3))
                .andExpect(jsonPath("$[0].total").value(false))
                .andExpect(jsonPath("$[1].total").value(false))
                .andExpect(jsonPath("$[2].count").value(14))
                .andExpect(jsonPath("$[2].monthlyCount").value(4))
                .andExpect(jsonPath("$[2].total").value(true));
    }

    @Test
    void listsDetailRowsForTheRequestedSubmissionCell() throws Exception {
        var query = new BidNoticeSubmissionDetailQuery(2026, 2026, 6, 6, "D01", false);
        var pageable = PageRequest.of(1, 25);
        when(bidNoticeSubmissionStatusUseCase.findDetails(query, pageable)).thenReturn(new PageImpl<>(
                List.of(new BidNoticeSubmissionDetail(
                        19L, "도로 설계", "D01", "20260615", "R26-01", "Y", "N", "CAA",
                        "C01", "한국도로공사", "20260601", "202606121800", null, null, new BigDecimal("2300000"), "E01")),
                pageable, 26));

        mockMvc.perform(get("/pq/submit-stat/details")
                        .param("firstYear", "2026").param("lastYear", "2026")
                        .param("fromMonth", "6").param("throughMonth", "6")
                        .param("departmentCode", "D01").param("page", "1").param("size", "25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(26))
                .andExpect(jsonPath("$.content[0].bidSeq").value(19))
                .andExpect(jsonPath("$.content[0].projectName").value("도로 설계"))
                .andExpect(jsonPath("$.content[0].departmentCode").value("D01"))
                .andExpect(jsonPath("$.content[0].pqSubmitDate").value("20260615"))
                .andExpect(jsonPath("$.content[0].orderClientName").value("한국도로공사"))
                .andExpect(jsonPath("$.content[0].businessType").value("CAA"))
                .andExpect(jsonPath("$.content[0].designAmt").value(2300000))
                .andExpect(jsonPath("$.content[0].g2bBidNtceNo").value("R26-01"));
    }

    @Test
    void listPassesFiltersAndSortToUseCase() throws Exception {
        when(bidNoticeAdminUseCase.findAll(any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/pq/bid-notice")
                        .param("orderClient", "수자원")
                        .param("orderMethod", "FAK")
                        .param("remark", "재공고")
                        .param("keyword", "설계용역")
                        .param("departmentCode", "100906")
                        .param("superDecideEmpno", "150801")
                        .param("bidSuccessYn", "Y")
                        .param("businessType", "CAA")
                        .param("bidClosingDateFrom", "20261101")
                        .param("bidClosingDateTo", "20261130")
                        .param("bidDateFrom", "20261201")
                        .param("bidDateTo", "20261231")
                        .param("pqSubmitDateFrom", "20261115")
                        .param("pqSubmitDateTo", "20261122")
                        .param("participationStatuses", "Y", "N")
                        .param("sort", "pqSubmitDate,asc"))
                .andExpect(status().isOk());

        verify(bidNoticeAdminUseCase).findAll(argThat(condition ->
                        "수자원".equals(condition.orderClient()) && "FAK".equals(condition.orderMethod())
                                && "재공고".equals(condition.remark()) && "CAA".equals(condition.businessType())
                                && "설계용역".equals(condition.keyword()) && "100906".equals(condition.departmentCode())
                                && "150801".equals(condition.superDecideEmpno()) && "Y".equals(condition.bidSuccessYn())
                                && LocalDate.of(2026, 11, 1).equals(condition.bidClosingDateFrom())
                                && LocalDate.of(2026, 11, 30).equals(condition.bidClosingDateTo())
                                && LocalDate.of(2026, 12, 1).equals(condition.bidDateFrom())
                                && LocalDate.of(2026, 12, 31).equals(condition.bidDateTo())
                                && LocalDate.of(2026, 11, 15).equals(condition.pqSubmitDateFrom())
                                && LocalDate.of(2026, 11, 22).equals(condition.pqSubmitDateTo())
                                && List.of("Y", "N").equals(condition.participationStatuses())),
                argThat(pageable -> pageable.getSort().equals(Sort.by("pqSubmitDate"))));
    }

    @Test
    void getBidNoticeDocumentsDashboardDetail() throws Exception {
        BidNotice bidNotice = new BidNotice(
                20261072L, "100906", "Sample project", "CLIENT", BigDecimal.valueOf(1000000),
                "T2A", "ZA", LocalDate.of(2026, 6, 18), LocalDateTime.of(2026, 6, 18, 9, 0),
                LocalDateTime.of(2026, 6, 20, 9, 0), "FAK", LocalDateTime.of(2026, 7, 1, 10, 0), LocalDate.of(2026, 7, 2),
                "Y", "150801", LocalDate.of(2026, 6, 19), "150801", "Y", "CA",
                LocalDateTime.of(2026, 6, 20, 10, 0), LocalDateTime.of(2026, 6, 30, 18, 0),
                "DA", "T2A", null, null, null, "Y", "Prime contractor", "Remark", "Y", "G2B-123", "1",
                java.time.Instant.parse("2026-06-18T00:00:00Z"), "system",
                java.time.Instant.parse("2026-06-18T00:00:00Z"), "system");
        BidNoticeListRow row = new BidNoticeListRow(bidNotice, "Client name", "Department name");
        when(bidNoticeAdminUseCase.findDetailByBidSeq(20261072L)).thenReturn(row);
        when(bidNoticeResponseMapper.toResponse(row, null)).thenReturn(response());

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
                                fieldWithPath("interviewDate").description("Interview date."),
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
                                fieldWithPath("g2bBidNtceNo").description("G2B bid notice number."),
                                fieldWithPath("g2bBidNtceOrd").description("G2B bid notice order."),
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
                LocalDateTime.of(2026, 6, 20, 9, 0), "FAK", "Ordering", LocalDateTime.of(2026, 7, 1, 10, 0), LocalDate.of(2026, 7, 2),
                "Y", "Success", "150801", LocalDate.of(2026, 6, 19), "150801", "Y", "Yes", "CA", "Construction",
                LocalDateTime.of(2026, 6, 20, 10, 0), LocalDateTime.of(2026, 6, 30, 18, 0), "DA", "Road",
                "T2A", "Construction management", null, null, null, "Y", "Prime contractor", "Remark", "Y", "G2B-123", "1",
                "Department", "Client", "Bid type", "Bid method", null, "system", null, null);
    }
}
