package com.cheil.batch.g2bbidnotice.adapter.out.api;

import com.cheil.batch.g2bbidnotice.domain.G2bBidNotice;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticeSpecFile;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

/** 나라장터 API 응답 JSON을 애플리케이션 도메인 모델로 변환합니다. */
@Component
public class G2bBidNoticeApiMapper {

    public List<G2bBidNotice> toDomains(JsonNode items) {
        if (items == null || !items.isArray()) {
            return List.of();
        }

        List<G2bBidNotice> notices = new ArrayList<>();
        items.forEach(item -> notices.add(toDomain(item)));
        return List.copyOf(notices);
    }

    private G2bBidNotice toDomain(JsonNode item) {
        return G2bBidNotice.builder()
                .bidNoticeNumber(text(item, "bidNtceNo"))
                .bidNoticeOrder(text(item, "bidNtceOrd"))
                .previousBidNoticeNumber(text(item, "befBidBbancNo"))
                .noticeKindName(text(item, "ntceKindNm"))
                .bidNoticeName(text(item, "bidNtceNm"))
                .noticeInstitutionName(text(item, "ntceInsttNm"))
                .demandInstitutionName(text(item, "dminsttNm"))
                .demandInstitutionCode(text(item, "dminsttCd"))
                .contractConclusionMethodName(text(item, "cntrctCnclsMthdNm"))
                .serviceDivisionName(text(item, "srvceDivNm"))
                .participationLimitRegionCode(text(item, "prtcptLmtRgnCd"))
                .commonJointMethodName(text(item, "cmmnSpldmdMethdNm"))
                .successfulBidMethodName(text(item, "sucsfbidMthdNm"))
                .industryLimitYn(text(item, "indstrytyLmtYn"))
                .publicProcurementMidClassificationName(text(item, "pubPrcrmntMidClsfcNm"))
                .publicProcurementClassificationName(text(item, "pubPrcrmntClsfcNm"))
                .successfulBidMethodApplicationStandard(text(item, "sucsfbidMthdAppStd"))
                .assignedBudgetAmount(text(item, "asignBdgtAmt"))
                .bidDate(text(item, "bidClseDt"))
                .bidSubmissionDate(text(item, "opengDt"))
                .pqSubmissionDate(text(item, "cmmnSpldmdAgrmntClseDt"))
                .bidNoticeDate(firstText(item, "bidNtceDate", "bidNtceDt"))
                .bidClosingDate(text(item, "bidClseDt"))
                .openingDate(text(item, "opengDt"))
                .bidNoticeUrl(firstText(item, "bidNtceUrl", "bidNtceDtlUrl"))
                .specificationFiles(specificationFiles(item))
                .rawPayload(item.toString())
                .build();
    }

    private List<G2bBidNoticeSpecFile> specificationFiles(JsonNode item) {
        // 나라장터가 제공하는 최대 10개의 첨부 명세 파일만 도메인 객체로 보존합니다.
        return IntStream.rangeClosed(1, 10)
                .mapToObj(sequence -> new G2bBidNoticeSpecFile(
                        sequence,
                        text(item, "ntceSpecFileNm" + sequence),
                        text(item, "ntceSpecDocUrl" + sequence)
                ))
                .filter(file -> (file.fileName() != null && !file.fileName().isBlank())
                        || (file.documentUrl() != null && !file.documentUrl().isBlank()))
                .toList();
    }

    private String firstText(JsonNode item, String... names) {
        for (String name : names) {
            String value = text(item, name);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String text(JsonNode item, String name) {
        JsonNode value = item.get(name);
        return value == null || value.isNull() ? null : value.asText();
    }
}
