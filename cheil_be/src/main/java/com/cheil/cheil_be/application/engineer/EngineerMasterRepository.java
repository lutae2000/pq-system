package com.cheil.cheil_be.application.engineer;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EngineerMasterRepository extends JpaRepository<EngineerMasterEntity, String> {
    @Query("""
            select count(e) > 0
            from EngineerMasterEntity e
            where lower(e.nameKor) = lower(:nameKor)
              and e.birthday = :birthday
              and e.engrId <> :excludeEngrId
            """)
    boolean existsDuplicate(@Param("nameKor") String nameKor, @Param("birthday") String birthday, @Param("excludeEngrId") String excludeEngrId);

    @Query("""
            select new com.cheil.cheil_be.application.engineer.EngineerCandidate(
                e.engrId,
                e.nameKor,
                e.deptName,
                e.grade
            )
            from EngineerMasterEntity e
            where :keyword = ''
               or lower(e.engrId) like lower(concat('%', :keyword, '%'))
               or lower(e.nameKor) like lower(concat('%', :keyword, '%'))
               or lower(e.deptName) like lower(concat('%', :keyword, '%'))
               or lower(e.grade) like lower(concat('%', :keyword, '%'))
            order by e.nameKor, e.engrId
            """)
    List<EngineerCandidate> findCompanyPerformanceCandidates(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
            select e
            from EngineerMasterEntity e
            where (:retireYn = ''
                   or (:retireYn = 'N' and coalesce(e.retireYn, 'N') <> 'Y')
                   or (:retireYn = 'Y' and e.retireYn = 'Y'))
              and (:keyword = '' or lower(e.engrId) like lower(concat('%', :keyword, '%'))
                   or lower(e.nameKor) like lower(concat('%', :keyword, '%'))
                   )
              and (:certificationName = '' or exists (
                   select l.id from EngineerLicenseEntity l
                   where l.engrId = e.engrId
                     and (lower(l.licenseCode) like lower(concat('%', :certificationName, '%'))
                          or lower(l.licenseNo) like lower(concat('%', :certificationName, '%')))))
              and (:department = '' or e.deptName = :department)
              and (:designGrade = '' or e.designGrade = :designGrade)
              and (:constructionManagementGrade = '' or e.constructionManagementGrade = :constructionManagementGrade)
              and (:specialtyField = '' or e.proPart = :specialtyField)
              and (:jobField = '' or e.dutyPart = :jobField)
            order by e.engrId
            """)
    Page<EngineerMasterEntity> search(
            @Param("retireYn") String retireYn,
            @Param("keyword") String keyword,
            @Param("certificationName") String certificationName,
            @Param("department") String department,
            @Param("designGrade") String designGrade,
            @Param("constructionManagementGrade") String constructionManagementGrade,
            @Param("specialtyField") String specialtyField,
            @Param("jobField") String jobField,
            Pageable pageable
    );
}
