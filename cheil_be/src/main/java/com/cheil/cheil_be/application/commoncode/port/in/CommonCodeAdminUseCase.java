package com.cheil.cheil_be.application.commoncode.port.in;

import java.util.List;

import com.cheil.cheil_be.domain.commoncode.CommonCode;

/**
 * 공통코드 관리 유스케이스의 입력 경계입니다.
 *
 * <p>웹 컨트롤러는 구현 서비스가 아닌 이 포트에만 의존해야 합니다.
 * 이렇게 하면 공통코드 조회·저장 규칙과 HTTP 요청 처리 규칙을 분리할 수 있습니다.</p>
 */
public interface CommonCodeAdminUseCase {

    List<CommonCode> findAll(CommonCodeSearchCondition condition);

    List<List<CommonCode>> findAllBatch(List<CommonCodeSearchCondition> conditions);

    CommonCode findByCodeId(Long codeId);

    CommonCode create(CommonCodeUpsertCommand command);

    CommonCode update(Long codeId, CommonCodeUpsertCommand command);

    void delete(Long codeId);
}
