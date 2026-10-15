package com.cheil.cheil_be.adapter.in.web.g2bbidnotice;

import java.util.List;

import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidate;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidateAttachment;

public record G2bBidNoticeCandidateResponse(
        Long id,
        String bidNtceNo,
        String bidNtceOrd,
        String befBidBbancNo,
        String ntceKindNm,
        String bidMethdNm,
        String cmmnSpldmdAgrmntRcptdocMethd,
        String pqApplDocRcptMthdNm,
        String pqApplDocRcptDt,
        String cntrctCnclsMthdNm,
        String srvceDivNm,
        String prtcptLmtRgnCd,
        String cmmnSpldmdMethdNm,
        String sucsfbidMthdNm,
        String indstrytyLmtYn,
        String pubPrcrmntMidClsfcNm,
        String pubPrcrmntClsfcNm,
        String sucsfbidMthdAppStd,
        String asignBdgtAmt,
        String bidDate,
        String bidSubmissionDate,
        String pqSubmitDate,
        String bidNtceNm,
        String ntceInsttNm,
        String dminsttNm,
        String dminsttCd,
        String bidNtceDate,
        String bidBeginDt,
        String bidQlfctRgstDt,
        String bidClseDt,
        String opengDt,
        String bidNtceUrl,
        String importedAt,
        Long importedBidSeq,
        List<G2bBidNoticeCandidateAttachmentResponse> attachments
) {

    public static G2bBidNoticeCandidateResponse from(G2bBidNoticeCandidate candidate) {
        return new G2bBidNoticeCandidateResponse(
                candidate.id(),
                candidate.bidNoticeNumber(),
                candidate.bidNoticeOrder(),
                candidate.previousBidNoticeNumber(),
                candidate.noticeKindName(),
                candidate.bidMethodName(),
                candidate.commonJointAgreementReceiptDocumentMethodName(),
                candidate.pqApplicationDocumentReceiptMethodName(),
                candidate.pqApplicationDocumentReceiptDate(),
                candidate.contractConclusionMethodName(),
                candidate.serviceDivisionName(),
                candidate.participationLimitRegionCode(),
                candidate.commonJointMethodName(),
                candidate.successfulBidMethodName(),
                candidate.industryLimitYn(),
                candidate.publicProcurementMidClassificationName(),
                candidate.publicProcurementClassificationName(),
                candidate.successfulBidMethodApplicationStandard(),
                candidate.assignedBudgetAmount(),
                candidate.bidDate(),
                candidate.bidSubmissionDate(),
                candidate.pqSubmitDate(),
                candidate.bidNoticeName(),
                candidate.noticeInstitutionName(),
                candidate.demandInstitutionName(),
                candidate.demandInstitutionCode(),
                candidate.bidNoticeDate(),
                candidate.bidBeginDate(),
                candidate.bidQualificationRegistrationClosingDate(),
                candidate.bidClosingDate(),
                candidate.openingDate(),
                candidate.bidNoticeUrl(),
                candidate.importedAt(),
                candidate.importedBidSeq(),
                candidate.attachments().stream().map(G2bBidNoticeCandidateAttachmentResponse::from).toList()
        );
    }

    public record G2bBidNoticeCandidateAttachmentResponse(
            String fileName,
            String downloadUrl
    ) {
        public static G2bBidNoticeCandidateAttachmentResponse from(G2bBidNoticeCandidateAttachment attachment) {
            return new G2bBidNoticeCandidateAttachmentResponse(attachment.fileName(), attachment.downloadUrl());
        }
    }
}
