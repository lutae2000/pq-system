package com.cheil.cheil_be.application.relatedprojecthistorycondition;

import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ProjectHistoryConditionMetadataService {

    private static final String IDENTIFIER_PATTERN = "[a-zA-Z_][a-zA-Z0-9_]*";

    private final JdbcClient jdbcClient;
    private final Gson gson = new Gson();

    public Map<String, ProjectHistoryConditionMetadata> findAll() {
        Map<String, ProjectHistoryConditionMetadata> result = new LinkedHashMap<>();
        Set<String> existingColumns = jdbcClient.sql("""
                SELECT table_name, column_name
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                """)
                .query((rs, rowNum) -> rs.getString("table_name").toLowerCase(Locale.ROOT)
                        + ":" + rs.getString("column_name").toLowerCase(Locale.ROOT))
                .list()
                .stream()
                .collect(java.util.stream.Collectors.toCollection(HashSet::new));
        jdbcClient.sql("""
                SELECT level2_code, level3_code, ref_value1
                FROM common_codes
                WHERE level1_code = 'PQCT'
                  AND use_yn = TRUE
                  AND level3_code IS NOT NULL
                  AND level3_code <> ''
                """)
                .query((rs, rowNum) -> new String[]{
                        rs.getString("level2_code"), rs.getString("level3_code"), rs.getString("ref_value1")
                })
                .list()
                .forEach(row -> {
                    ProjectHistoryConditionMetadata metadata = parse(row[2]);
                    if (metadata != null && existingColumns.contains(metadata.table().toLowerCase(Locale.ROOT)
                            + ":" + metadata.column().toLowerCase(Locale.ROOT))) {
                        result.putIfAbsent(normalize(row[0]) + normalize(row[1]), metadata);
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
