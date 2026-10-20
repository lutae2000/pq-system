package com.cheil.batch.g2bbidnotice.domain;

import lombok.Builder;

import java.util.List;

/**
 * 나라장터 기술용역 조달요청 중 애플리케이션에서 사용하는 핵심 응답값입니다.
 * 외부 API 응답 DTO가 애플리케이션 계층으로 노출되지 않도록 분리합니다.
 */
@Builder
public record G2bBidNotice(
        /** 나라장터 공고번호입니다. */
        String bidNoticeNumber,
        /** 나라장터 공고차수입니다. */
        String bidNoticeOrder,
        String previousBidNoticeNumber,
        /** 공고종류입니다. 취소공고·변경공고 여부를 포함합니다. */
        String noticeKindName,
        /** 입찰공고명입니다. */
        String bidNoticeName,
        /** 공고기관명입니다. */
        String noticeInstitutionName,
        String demandInstitutionName,
        String demandInstitutionCode,
        /** 계약구분명입니다. */
        String contractConclusionMethodName,
        /** 용역구분명입니다. */
        String serviceDivisionName,
        /** 참가제한지역코드입니다. 00은 전국, 11은 서울입니다. */
        String participationLimitRegionCode,
        String commonJointMethodName,
        String successfulBidMethodName,
        String industryLimitYn,
        String publicProcurementMidClassificationName,
        String publicProcurementClassificationName,
        String successfulBidMethodApplicationStandard,
        /** 설계금액에 매핑되는 나라장터 배정예산금액 원문입니다. */
        String assignedBudgetAmount,
        /** 입찰일자에 매핑되는 나라장터 입찰마감일시입니다. */
        String bidDate,
        /** 투찰 마감일에 매핑되는 나라장터 개찰일시입니다. */
        String bidSubmissionDate,
        /** PQ 제출일자에 매핑되는 나라장터 공동수급협정 마감일시입니다. */
        String pqSubmissionDate,
        /** 공고일시입니다. API 원문 문자열을 보존합니다. */
        String bidNoticeDate,
        /** 입찰마감일시입니다. API 원문 문자열을 보존합니다. */
        String bidClosingDate,
        /** 개찰일시입니다. API 원문 문자열을 보존합니다. */
        String openingDate,
        /** 입찰공고 상세 URL입니다. */
        String bidNoticeUrl,
        /** 공고문 파일명과 다운로드 URL 목록입니다. */
        List<G2bBidNoticeSpecFile> specificationFiles,
        /** API item 원본 JSON입니다. */
        String rawPayload
) {

    /** API 조회조건으로 사용한 참가제한지역을 후보 데이터에 보완합니다. */
    public G2bBidNotice withParticipationLimitRegionCode(String regionCode) {
        return new G2bBidNotice(
                bidNoticeNumber,
                bidNoticeOrder,
                previousBidNoticeNumber,
                noticeKindName,
                bidNoticeName,
                noticeInstitutionName,
                demandInstitutionName,
                demandInstitutionCode,
                contractConclusionMethodName,
                serviceDivisionName,
                firstNonBlank(participationLimitRegionCode, regionCode),
                commonJointMethodName,
                successfulBidMethodName,
                industryLimitYn,
                publicProcurementMidClassificationName,
                publicProcurementClassificationName,
                successfulBidMethodApplicationStandard,
                assignedBudgetAmount,
                bidDate,
                bidSubmissionDate,
                pqSubmissionDate,
                bidNoticeDate,
                bidClosingDate,
                openingDate,
                bidNoticeUrl,
                specificationFiles,
                rawPayload
        );
    }

    /** 전국·서울 조회에서 같은 공고가 발견되면 담당자에게 두 지역 조건을 함께 보여줍니다. */
    public G2bBidNotice merge(G2bBidNotice other) {
        if (!bidNoticeNumber.equals(other.bidNoticeNumber)
                || !java.util.Objects.equals(bidNoticeOrder, other.bidNoticeOrder)) {
            throw new IllegalArgumentException("서로 다른 나라장터 공고는 병합할 수 없습니다.");
        }

        return new G2bBidNotice(
                bidNoticeNumber,
                bidNoticeOrder,
                firstNonBlank(previousBidNoticeNumber, other.previousBidNoticeNumber),
                firstNonBlank(noticeKindName, other.noticeKindName),
                firstNonBlank(bidNoticeName, other.bidNoticeName),
                firstNonBlank(noticeInstitutionName, other.noticeInstitutionName),
                firstNonBlank(demandInstitutionName, other.demandInstitutionName),
                firstNonBlank(demandInstitutionCode, other.demandInstitutionCode),
                firstNonBlank(contractConclusionMethodName, other.contractConclusionMethodName),
                firstNonBlank(serviceDivisionName, other.serviceDivisionName),
                firstNonBlank(participationLimitRegionCode, other.participationLimitRegionCode),
                firstNonBlank(commonJointMethodName, other.commonJointMethodName),
                firstNonBlank(successfulBidMethodName, other.successfulBidMethodName),
                firstNonBlank(industryLimitYn, other.industryLimitYn),
                firstNonBlank(publicProcurementMidClassificationName, other.publicProcurementMidClassificationName),
                firstNonBlank(publicProcurementClassificationName, other.publicProcurementClassificationName),
                firstNonBlank(successfulBidMethodApplicationStandard, other.successfulBidMethodApplicationStandard),
                firstNonBlank(assignedBudgetAmount, other.assignedBudgetAmount),
                firstNonBlank(bidDate, other.bidDate),
                firstNonBlank(bidSubmissionDate, other.bidSubmissionDate),
                firstNonBlank(pqSubmissionDate, other.pqSubmissionDate),
                firstNonBlank(bidNoticeDate, other.bidNoticeDate),
                firstNonBlank(bidClosingDate, other.bidClosingDate),
                firstNonBlank(openingDate, other.openingDate),
                firstNonBlank(bidNoticeUrl, other.bidNoticeUrl),
                mergeFiles(specificationFiles, other.specificationFiles),
                mergeRawPayload(rawPayload, other.rawPayload)
        );
    }

    private static List<G2bBidNoticeSpecFile> mergeFiles(List<G2bBidNoticeSpecFile> first, List<G2bBidNoticeSpecFile> second) {
        java.util.Map<Integer, G2bBidNoticeSpecFile> files = new java.util.LinkedHashMap<>();
        (first == null ? List.<G2bBidNoticeSpecFile>of() : first).forEach(file -> files.put(file.sequence(), file));
        (second == null ? List.<G2bBidNoticeSpecFile>of() : second).forEach(file -> files.merge(
                file.sequence(), file, G2bBidNotice::mergeFile
        ));
        return List.copyOf(files.values());
    }

    private static G2bBidNoticeSpecFile mergeFile(G2bBidNoticeSpecFile first, G2bBidNoticeSpecFile second) {
        return new G2bBidNoticeSpecFile(
                first.sequence(),
                firstNonBlank(first.fileName(), second.fileName()),
                firstNonBlank(first.documentUrl(), second.documentUrl())
        );
    }

    private static String firstNonBlank(String first, String second) {
        return first == null || first.isBlank() ? second : first;
    }

    private static String mergeRawPayload(String first, String second) {
        if (first == null || first.isBlank()) {
            return second;
        }
        if (second == null || second.isBlank() || first.equals(second)) {
            return first;
        }
        return "[" + first + "," + second + "]";
    }
}
