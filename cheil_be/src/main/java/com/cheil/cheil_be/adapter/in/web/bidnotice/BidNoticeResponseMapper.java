package com.cheil.cheil_be.adapter.in.web.bidnotice;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.client.port.out.ClientRepository;
import com.cheil.cheil_be.application.commoncode.port.out.CommonCodeRepository;
import com.cheil.cheil_be.application.commoncode.service.CommonCodeCacheService;
import com.cheil.cheil_be.application.commondepartment.port.out.CommonDepartmentRepository;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;
import com.cheil.cheil_be.domain.client.Client;
import com.cheil.cheil_be.domain.commoncode.CommonCode;
import com.cheil.cheil_be.domain.commondepartment.Department;

@Component
@RequiredArgsConstructor
public class BidNoticeResponseMapper {

    private static final String BID_METHOD_GROUP = "ZA";
    private static final String BUSINESS_FIELD_GROUP = "DA";
    private static final String ORDER_METHOD_GROUP = "FA";
    private static final String BID_TYPE_GROUP = "MB";
    private static final String BUSINESS_TYPE_GROUP = "CA";
    private static final String BUSINESS_SCOPE_GROUP = "T2";
    private static final String FINAL_PARTICIPATION_GROUP = "YA";
    private static final List<String> BID_NOTICE_CODE_GROUPS = List.of(
            BID_METHOD_GROUP,
            BUSINESS_FIELD_GROUP,
            ORDER_METHOD_GROUP,
            BID_TYPE_GROUP,
            BUSINESS_TYPE_GROUP,
            BUSINESS_SCOPE_GROUP,
            FINAL_PARTICIPATION_GROUP
    );

    private final CommonDepartmentRepository commonDepartmentRepository;
    private final ClientRepository clientRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeCacheService commonCodeCacheService;

    public BidNoticeResponseLookup snapshot() {
        return new BidNoticeResponseLookup(
                toLabelMap(commonDepartmentRepository.findAll(), Department::deptCode, Department::deptName),
                toLabelMap(clientRepository.findAll(), Client::clientCode, Client::orderName),
                BID_NOTICE_CODE_GROUPS.stream()
                        .flatMap(level1Code -> commonCodeCacheService.getOrLoadByLevel1Code(
                                level1Code,
                                null,
                                () -> commonCodeRepository.findAllByLevel1Code(level1Code, null)
                        ).stream())
                        .filter(code -> code.codeLevel() != null && code.codeLevel() == 2)
                        .filter(code -> StringUtils.hasText(code.level1Code()))
                        .collect(Collectors.groupingBy(
                                code -> normalizeKey(code.level1Code()),
                                LinkedHashMap::new,
                                Collectors.toMap(
                                        code -> normalizeKey(code.level2Code()),
                                        CommonCode::codeName,
                                        (left, right) -> left,
                                        LinkedHashMap::new
                                )
                        ))
        );
    }

    public BidNoticeResponse toResponse(BidNotice bidNotice) {
        return toResponse(bidNotice, snapshot());
    }

    public BidNoticeResponse toResponse(BidNotice bidNotice, BidNoticeResponseLookup lookup) {
        return BidNoticeResponse.from(bidNotice, new BidNoticeLabels(
                labelOf(lookup.departmentLabels(), bidNotice.departmentCode()),
                labelOf(lookup.clientLabels(), bidNotice.orderClient()),
                labelOf(lookup.commonCodeLabels(), BID_TYPE_GROUP, bidNotice.bidType()),
                labelOf(lookup.commonCodeLabels(), BID_METHOD_GROUP, bidNotice.bidMethod()),
                labelOf(lookup.commonCodeLabels(), ORDER_METHOD_GROUP, bidNotice.orderMethod()),
                labelOf(lookup.commonCodeLabels(), BUSINESS_TYPE_GROUP, bidNotice.businessType()),
                labelOf(lookup.commonCodeLabels(), BUSINESS_FIELD_GROUP, bidNotice.fieldOfWorkCode()),
                labelOf(lookup.commonCodeLabels(), BUSINESS_SCOPE_GROUP, bidNotice.scopeOfWorkCode()),
                bidNotice.bidSuccessYn(),
                labelOf(lookup.commonCodeLabels(), FINAL_PARTICIPATION_GROUP, bidNotice.participateYn())
        ));
    }

    private static <T> Map<String, String> toLabelMap(List<T> items, Function<T, String> keyExtractor, Function<T, String> labelExtractor) {
        return items.stream()
                .filter(item -> StringUtils.hasText(keyExtractor.apply(item)))
                .collect(Collectors.toMap(
                        item -> normalizeKey(keyExtractor.apply(item)),
                        item -> defaultString(labelExtractor.apply(item)),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    private static String labelOf(Map<String, String> labels, String key) {
        if (!StringUtils.hasText(key)) {
            return key;
        }
        return labels.getOrDefault(normalizeKey(key), key);
    }

    private static String labelOf(Map<String, Map<String, String>> labels, String groupKey, String valueKey) {
        if (!StringUtils.hasText(groupKey) || !StringUtils.hasText(valueKey)) {
            return valueKey;
        }
        Map<String, String> groupLabels = labels.get(normalizeKey(groupKey));
        if (groupLabels == null) {
            return valueKey;
        }
        return groupLabels.getOrDefault(normalizeKey(valueKey), valueKey);
    }

    private static String normalizeKey(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private static String defaultString(String value) {
        return value == null ? "" : value;
    }

    public record BidNoticeResponseLookup(
            Map<String, String> departmentLabels,
            Map<String, String> clientLabels,
            Map<String, Map<String, String>> commonCodeLabels
    ) {
    }
}
