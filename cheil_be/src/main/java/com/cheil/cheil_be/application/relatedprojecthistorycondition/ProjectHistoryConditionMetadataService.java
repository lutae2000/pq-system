package com.cheil.cheil_be.application.relatedprojecthistorycondition;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.commoncode.port.out.CommonCodeRepository;
import com.cheil.cheil_be.application.commoncode.service.CommonCodeCacheService;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.out.SchemaMetadataRepository;

@Service
@RequiredArgsConstructor
public class ProjectHistoryConditionMetadataService {

    private static final String CONDITION_CODE_GROUP = "PQCT";
    private static final String IDENTIFIER_PATTERN = "[a-zA-Z_][a-zA-Z0-9_]*";

    private final SchemaMetadataRepository schemaMetadataRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeCacheService commonCodeCacheService;
    private final Gson gson = new Gson();

    public Map<String, ProjectHistoryConditionMetadata> findAll() {
        Map<String, ProjectHistoryConditionMetadata> result = new LinkedHashMap<>();
        Set<String> existingColumns = schemaMetadataRepository.findExistingColumns();
        commonCodeCacheService.getOrLoadByLevel1Code(
                        CONDITION_CODE_GROUP,
                        () -> commonCodeRepository.findAllByLevel1Code(CONDITION_CODE_GROUP, Boolean.TRUE)
                )
                .items()
                .stream()
                .filter(commonCode -> StringUtils.hasText(commonCode.level3Code()))
                .forEach(commonCode -> {
                    ProjectHistoryConditionMetadata metadata = parse(commonCode.refValue1());
                    if (metadata != null && existingColumns.contains(metadata.table().toLowerCase(Locale.ROOT)
                            + ":" + metadata.column().toLowerCase(Locale.ROOT))) {
                        result.putIfAbsent(
                                normalize(commonCode.level2Code()) + normalize(commonCode.level3Code()),
                                metadata
                        );
                    }
                });
        return result;
    }

    private ProjectHistoryConditionMetadata parse(String json) {
        if (!StringUtils.hasText(json)) {
            return null;
        }
        try {
            JsonObject object = gson.fromJson(json, JsonObject.class);
            String table = text(object, "table");
            String column = text(object, "column");
            String valueType = text(object, "valueType");
            if (!StringUtils.hasText(table) || !StringUtils.hasText(column)
                    || !table.matches(IDENTIFIER_PATTERN) || !column.matches(IDENTIFIER_PATTERN)) {
                return null;
            }
            return new ProjectHistoryConditionMetadata(table, column, valueType);
        } catch (Exception exception) {
            return null;
        }
    }

    private String text(JsonObject object, String property) {
        return object.has(property) && !object.get(property).isJsonNull()
                ? normalize(object.get(property).getAsString()) : null;
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }
}
