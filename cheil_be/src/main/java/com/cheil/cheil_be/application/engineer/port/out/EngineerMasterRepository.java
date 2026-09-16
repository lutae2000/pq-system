package com.cheil.cheil_be.application.engineer.port.out;

import com.cheil.cheil_be.application.engineer.EngineerCandidate;
import com.cheil.cheil_be.application.engineer.EngineerMasterEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface EngineerMasterRepository {

    Page<EngineerMasterEntity> search(
            String retireYn,
            String keyword,
            String certificationName,
            String department,
            String designGrade,
            String constructionManagementGrade,
            String specialtyField,
            String jobField,
            Pageable pageable
    );

    List<EngineerMasterEntity> findAll();

    Optional<EngineerMasterEntity> findById(String engineerId);

    List<EngineerMasterEntity> findByNameKorIgnoreCaseAndBirthdayOrderByEngrId(
            String nameKor,
            String birthday
    );

    List<EngineerCandidate> findCompanyPerformanceCandidates(String keyword, Pageable pageable);

    boolean existsById(String engineerId);

    boolean existsDuplicate(String nameKor, String birthday, String excludeEngineerId);

    EngineerMasterEntity save(EngineerMasterEntity engineer);

    void deleteById(String engineerId);
}
