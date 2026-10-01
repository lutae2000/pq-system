package com.cheil.cheil_be.application.relatedprojecthistorycondition.port.in;

import java.util.List;

import com.cheil.cheil_be.application.relatedprojecthistorycondition.ProjectHistoryConditionOptionGroup;

/** 관련 프로젝트 이력 조건 화면의 선택지 조회 유스케이스. */
public interface ProjectHistoryConditionOptionUseCase {

    List<ProjectHistoryConditionOptionGroup> findAll();
}
