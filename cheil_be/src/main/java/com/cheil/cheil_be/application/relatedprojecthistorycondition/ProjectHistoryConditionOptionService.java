package com.cheil.cheil_be.application.relatedprojecthistorycondition;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.commoncode.port.out.CommonCodeRepository;
import com.cheil.cheil_be.application.commoncode.service.CommonCodeCacheService;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.in.ProjectHistoryConditionOptionUseCase;
import com.cheil.cheil_be.application.servicetype.port.out.ServiceTypeRepository;
import com.cheil.cheil_be.domain.commoncode.CommonCode;
import com.cheil.cheil_be.domain.servicetype.ServiceType;

@Service
@RequiredArgsConstructor
public class ProjectHistoryConditionOptionService implements ProjectHistoryConditionOptionUseCase {

    private static final String CONDITION_CODE_GROUP = "PQCT";
    private static final String TYPE_COMMON_CODE = "commonCode";
    private static final String TYPE_SERVICE_TYPE = "serviceType";
    private static final String TYPE_STATIC_YN = "staticYn";

    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeCacheService commonCodeCacheService;
    private final ServiceTypeRepository serviceTypeRepository;
    private final Gson gson = new Gson();

    @Override
    @Transactional(readOnly = true)
    public List<ProjectHistoryConditionOptionGroup> findAll() {
        return conditionCodes()
                .map(this::toGroup)
                .filter(Objects::nonNull)
                .toList();
    }

    private Stream<CommonCode> conditionCodes() {
        // 조건 정의는 공통코드에 있으므로 캐시를 거쳐 조회해 화면과 문서 생성의 기준을 맞춘다.
        return commonCodeCacheService.getOrLoadByLevel1Code(
                        CONDITION_CODE_GROUP,
                        () -> commonCodeRepository.findAllByLevel1Code(CONDITION_CODE_GROUP, Boolean.TRUE)
                )
                .items()
                .stream()
                .filter(code -> Integer.valueOf(3).equals(code.codeLevel()))
                .filter(code -> StringUtils.hasText(code.level2Code()) && code.level2Code().startsWith("C"))
                .filter(code -> "C1".equals(code.level3Code()));
    }

    private ProjectHistoryConditionOptionGroup toGroup(CommonCode conditionCode) {
        JsonObject metadata = parse(conditionCode.refValue1());
        if (metadata == null) {
            return null;
        }

        String valueType = text(metadata, "valueType", "text");
        JsonObject source = metadata.has("optionSource") && metadata.get("optionSource").isJsonObject()
                ? metadata.getAsJsonObject("optionSource") : null;
        if (source == null) {
            return new ProjectHistoryConditionOptionGroup(conditionCode.level2Code() + conditionCode.level3Code(), valueType, List.of());
        }

        String sourceType = text(source, "type", "");
        List<ProjectHistoryConditionOption> options = switch (sourceType) {
            case TYPE_COMMON_CODE -> commonCodeOptions(source);
            case TYPE_SERVICE_TYPE -> serviceTypeOptions();
            case TYPE_STATIC_YN -> staticYnOptions(source);
            default -> List.of();
        };
        return new ProjectHistoryConditionOptionGroup(
                conditionCode.level2Code() + conditionCode.level3Code(),
                valueType,
                options
        );
    }

    private List<ProjectHistoryConditionOption> commonCodeOptions(JsonObject source) {
        String level1Code = text(source, "level1Code", "");
        String level2Code = text(source, "level2Code", "");
        if (!StringUtils.hasText(level1Code) || !StringUtils.hasText(level2Code)) {
            return List.of();
        }
        return commonCodeCacheService.getOrLoadByLevel2Code(
                        level1Code,
                        level2Code,
                        () -> commonCodeRepository.findAllByLevel1CodeAndLevel2Code(level1Code, level2Code, Boolean.TRUE)
                )
                .items()
                .stream()
                .filter(code -> Integer.valueOf(3).equals(code.codeLevel()))
                .filter(code -> StringUtils.hasText(code.level3Code()))
                .sorted(Comparator.comparing(CommonCode::sortOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(CommonCode::level3Code, Comparator.nullsLast(String::compareTo)))
                .map(code -> new ProjectHistoryConditionOption(code.level3Code(), label(code.codeName(), code.codeDetailName())))
                .toList();
    }

    private List<ProjectHistoryConditionOption> serviceTypeOptions() {
        return serviceTypeRepository.findAll().stream()
                .filter(ServiceType::useYn)
                .sorted(Comparator.comparing(ServiceType::serviceTypeCode, Comparator.nullsLast(String::compareTo)))
                .map(type -> new ProjectHistoryConditionOption(type.serviceTypeCode(), type.serviceTypeName()))
                .toList();
    }

    private List<ProjectHistoryConditionOption> staticYnOptions(JsonObject source) {
        JsonObject labels = source.has("labels") && source.get("labels").isJsonObject()
                ? source.getAsJsonObject("labels") : null;
        if (labels == null) {
            return List.of();
        }
        return Stream.of("Y", "N")
                .map(value -> new ProjectHistoryConditionOption(value, text(labels, value, value)))
                .toList();
    }

    private JsonObject parse(String json) {
        if (!StringUtils.hasText(json)) {
            return null;
        }
        try {
            return gson.fromJson(json, JsonObject.class);
        } catch (RuntimeException exception) {
            // 개별 코드의 메타데이터 오류가 전체 선택지 조회를 중단시키지 않도록 해당 코드만 제외한다.
            return null;
        }
    }

    private String text(JsonObject object, String property, String fallback) {
        if (object == null || !object.has(property) || object.get(property).isJsonNull()) {
            return fallback;
        }
        String value = object.get(property).getAsString();
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String label(String codeName, String codeDetailName) {
        return StringUtils.hasText(codeDetailName) ? codeDetailName : codeName;
    }
}
