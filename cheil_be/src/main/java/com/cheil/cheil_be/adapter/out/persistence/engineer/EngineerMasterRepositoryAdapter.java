package com.cheil.cheil_be.adapter.out.persistence.engineer;

import com.cheil.cheil_be.application.engineer.EngineerCandidate;
import com.cheil.cheil_be.application.engineer.EngineerMasterEntity;
import com.cheil.cheil_be.application.engineer.port.out.EngineerMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class EngineerMasterRepositoryAdapter implements EngineerMasterRepository {

    private final EngineerMasterJpaRepository jpaRepository;

    @Override
    public Page<EngineerMasterEntity> search(
            String retireYn,
            String keyword,
            String certificationName,
            String department,
            String designGrade,
            String constructionManagementGrade,
            String specialtyField,
            String jobField,
            Pageable pageable
    ) {
        return jpaRepository.search(
                retireYn,
                keyword,
                certificationName,
                department,
                designGrade,
                constructionManagementGrade,
                specialtyField,
                jobField,
                pageable
        );
    }

    @Override
    public List<EngineerMasterEntity> findAll() {
        return jpaRepository.findAll();
    }

    @Override
    public Optional<EngineerMasterEntity> findById(String engineerId) {
        return jpaRepository.findById(engineerId);
    }

    @Override
    public List<EngineerMasterEntity> findByNameKorIgnoreCaseAndBirthdayOrderByEngrId(
            String nameKor,
            String birthday
    ) {
        return jpaRepository.findByNameKorIgnoreCaseAndBirthdayOrderByEngrId(nameKor, birthday);
    }

    @Override
    public List<EngineerCandidate> findCompanyPerformanceCandidates(String keyword, Pageable pageable) {
        return jpaRepository.findCompanyPerformanceCandidates(keyword, pageable);
    }

    @Override
    public boolean existsById(String engineerId) {
        return jpaRepository.existsById(engineerId);
    }

    @Override
    public boolean existsDuplicate(String nameKor, String birthday, String excludeEngineerId) {
        return jpaRepository.existsDuplicate(nameKor, birthday, excludeEngineerId);
    }

    @Override
    public EngineerMasterEntity save(EngineerMasterEntity engineer) {
        return jpaRepository.save(engineer);
    }

    @Override
    public void deleteById(String engineerId) {
        jpaRepository.deleteById(engineerId);
    }
}
