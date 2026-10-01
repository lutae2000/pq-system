package com.cheil.cheil_be.application.engineer.port.in;

import java.util.List;

import org.springframework.data.domain.Page;

import com.cheil.cheil_be.application.engineer.EngineerDtos;

/**
 * 기술인 관리 화면에서 사용하는 inbound use case 경계다.
 *
 * 현재 응답 모델과 페이지 모델은 기존 API 호환을 위해 유지한다.
 * 다음 단계에서 웹 응답 DTO와 Spring Data 페이지 모델을 adapter 경계로 이동한다.
 */
public interface EngineerAdminUseCase {

    Page<EngineerDtos.Profile> findAll(Integer page, Integer size);

    Page<EngineerDtos.Profile> findAll(
            Integer page,
            Integer size,
            String retireYn,
            String status,
            String keyword,
            String certificationName,
            String department,
            String designGrade,
            String constructionManagementGrade,
            String specialtyField,
            String jobField
    );

    List<EngineerDtos.Profile> findAllProfiles();

    EngineerDtos.Profile findByEngrId(String engrId);

    List<EngineerDtos.Profile> findIdentityMatches(String nameKor, String birthday);

    EngineerDtos.Profile create(EngineerDtos.Profile request);

    EngineerDtos.Profile create(EngineerDtos.Profile request, boolean allowDuplicate);

    EngineerDtos.Profile update(String engrId, EngineerDtos.Profile request);

    void delete(String engrId);

    EngineerDtos.Profile saveBasic(String engrId, EngineerDtos.Basic basic);

    EngineerDtos.Profile saveLicenses(String engrId, List<EngineerDtos.License> rows);

    EngineerDtos.Profile saveCareers(String engrId, List<EngineerDtos.Career> rows);

    EngineerDtos.Profile savePrizes(String engrId, List<EngineerDtos.Prize> rows);

    EngineerDtos.Profile saveEducations(String engrId, List<EngineerDtos.Education> rows);

    EngineerDtos.Profile saveCareerDetails(String engrId, List<EngineerDtos.CareerDetail> rows);

    EngineerDtos.Profile saveSchools(String engrId, List<EngineerDtos.School> rows);

    EngineerDtos.Profile deleteLicense(String engrId, Long recordId);

    EngineerDtos.Profile deleteCareer(String engrId, Long recordId);

    EngineerDtos.Profile deletePrize(String engrId, Long recordId);

    EngineerDtos.Profile deleteEducation(String engrId, Long recordId);

    EngineerDtos.Profile deleteCareerDetail(String engrId, Long recordId);

    EngineerDtos.Profile deleteSchool(String engrId, Long recordId);
}
