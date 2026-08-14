package com.cheil.cheil_be.application.commoncode.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.domain.commoncode.CommonCode;

public interface CommonCodeRepository {

    List<CommonCode> findAll();

    List<CommonCode> findAllByCodeLevel(Integer codeLevel, Boolean useYn);

    List<CommonCode> findAllByLevel1Code(String level1Code, Boolean useYn);

    Optional<CommonCode> findByCodeId(Long codeId);

    boolean existsByNaturalKey(Integer codeLevel, String level1Code, String level2Code, String level3Code);

    boolean existsByNaturalKeyAndCodeIdNot(Integer codeLevel, String level1Code, String level2Code, String level3Code, Long codeId);

    CommonCode save(CommonCode commonCode);

    void deleteByCodeId(Long codeId);
}
