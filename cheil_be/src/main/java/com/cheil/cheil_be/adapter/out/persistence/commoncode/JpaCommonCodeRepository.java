package com.cheil.cheil_be.adapter.out.persistence.commoncode;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.commoncode.port.out.CommonCodeRepository;
import com.cheil.cheil_be.domain.commoncode.CommonCode;

@Repository
@RequiredArgsConstructor
public class JpaCommonCodeRepository implements CommonCodeRepository {

    private final CommonCodeJpaRepository commonCodeJpaRepository;

    @Override
    public List<CommonCode> findAll() {
        return commonCodeJpaRepository.findAll(Sort.by(
                        Sort.Order.asc("codeLevel"),
                        Sort.Order.asc("level1Code"),
                        Sort.Order.asc("sortOrder"),
                        Sort.Order.asc("level2Code"),
                        Sort.Order.asc("level3Code"),
                        Sort.Order.asc("codeId")
                ))
                .stream()
                .map(CommonCodeEntity::toDomain)
                .toList();
    }

    @Override
    public List<CommonCode> findAllByCodeLevel(Integer codeLevel, Boolean useYn) {
        return commonCodeJpaRepository.findAllByCodeLevel(
                        codeLevel,
                        useYn,
                        Sort.by(
                                Sort.Order.asc("level1Code"),
                                Sort.Order.asc("sortOrder"),
                                Sort.Order.asc("level2Code"),
                                Sort.Order.asc("level3Code"),
                                Sort.Order.asc("codeId")
                        )
                )
                .stream()
                .map(CommonCodeEntity::toDomain)
                .toList();
    }

    @Override
    public List<CommonCode> findAllByLevel1Code(String level1Code, Boolean useYn) {
        return commonCodeJpaRepository.findAllByLevel1Code(
                        level1Code,
                        useYn,
                        Sort.by(
                                Sort.Order.asc("codeLevel"),
                                Sort.Order.asc("level1Code"),
                                Sort.Order.asc("sortOrder"),
                                Sort.Order.asc("level2Code"),
                                Sort.Order.asc("level3Code"),
                                Sort.Order.asc("codeId")
                        )
                )
                .stream()
                .map(CommonCodeEntity::toDomain)
                .toList();
    }

    @Override
    public List<CommonCode> findAllByLevel1CodeAndLevel2Code(String level1Code, String level2Code, Boolean useYn) {
        return commonCodeJpaRepository.findAllByLevel1CodeAndLevel2Code(
                        level1Code,
                        level2Code,
                        useYn,
                        Sort.by(
                                Sort.Order.asc("codeLevel"),
                                Sort.Order.asc("sortOrder"),
                                Sort.Order.asc("level3Code"),
                                Sort.Order.asc("codeId")
                        )
                )
                .stream()
                .map(CommonCodeEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<CommonCode> findByCodeId(Long codeId) {
        return commonCodeJpaRepository.findByCodeId(codeId).map(CommonCodeEntity::toDomain);
    }

    @Override
    public boolean existsByNaturalKey(Integer codeLevel, String level1Code, String level2Code, String level3Code) {
        return commonCodeJpaRepository.existsByCodeLevelAndLevel1CodeAndLevel2CodeAndLevel3Code(
                codeLevel,
                level1Code,
                level2Code,
                level3Code
        );
    }

    @Override
    public boolean existsByNaturalKeyAndCodeIdNot(Integer codeLevel, String level1Code, String level2Code, String level3Code, Long codeId) {
        return commonCodeJpaRepository.existsByCodeLevelAndLevel1CodeAndLevel2CodeAndLevel3CodeAndCodeIdNot(
                codeLevel,
                level1Code,
                level2Code,
                level3Code,
                codeId
        );
    }

    @Override
    public CommonCode save(CommonCode commonCode) {
        CommonCodeEntity entity;
        if (commonCode.codeId() == null) {
            entity = CommonCodeEntity.from(commonCode);
        } else {
            entity = commonCodeJpaRepository.findById(commonCode.codeId())
                    .map(existing -> {
                        existing.updateFrom(commonCode);
                        return existing;
                    })
                    .orElseGet(() -> CommonCodeEntity.from(commonCode));
        }

        return commonCodeJpaRepository.save(entity).toDomain();
    }

    @Override
    public void deleteByCodeId(Long codeId) {
        commonCodeJpaRepository.deleteById(codeId);
    }
}
