package com.cheil.cheil_be.application.engineer;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

interface EngineerProjectHistoryRepository extends JpaRepository<EngineerProjectHistoryEntity, Long> {
    List<EngineerProjectHistoryEntity> findByEngrIdOrderByStartDtDescIdDesc(String engrId);

    @Query(value = """
            SELECT ph.id AS id, cp.job_name AS "jobName"
            FROM pq_engineer_project_history ph
            LEFT JOIN company_performances cp ON cp.seq = ph.seq
            WHERE ph.engr_id = :engrId
            """, nativeQuery = true)
    List<ProjectHistoryNameProjection> findProjectHistoryNames(@Param("engrId") String engrId);

    interface ProjectHistoryNameProjection {
        Long getId();
        String getJobName();
    }
}
