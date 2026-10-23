package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import java.util.List;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.common.exception.ApplicationException;

/** 관련 프로젝트 이력 조건 JSON의 파싱과 정규화를 한 규칙으로 처리합니다. */
@Component
public class ProjectHistoryConditionJsonCodec {

    private static final java.lang.reflect.Type CONDITION_LIST_TYPE =
            new TypeToken<List<ProjectHistoryCondition>>() { }.getType();

    private final Gson gson = new Gson();

    public List<ProjectHistoryCondition> parse(String json) {
        if (!StringUtils.hasText(json)) {
            return List.of();
        }
        try {
            List<ProjectHistoryCondition> conditions = gson.fromJson(json, CONDITION_LIST_TYPE);
            return conditions == null ? List.of() : conditions;
        } catch (Exception exception) {
            throw ApplicationException.badRequest("관련 프로젝트 이력 조건 형식이 올바르지 않습니다.", exception);
        }
    }

    public String normalize(String json) {
        return gson.toJson(parse(json));
    }
}
