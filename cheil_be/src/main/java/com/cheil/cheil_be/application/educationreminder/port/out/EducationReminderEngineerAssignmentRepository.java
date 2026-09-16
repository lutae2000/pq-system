package com.cheil.cheil_be.application.educationreminder.port.out;

import com.cheil.cheil_be.application.educationreminder.model.EducationReminderAssignedEngineer;

import java.util.List;

public interface EducationReminderEngineerAssignmentRepository {

    List<EducationReminderAssignedEngineer> findByBasicInfoCode(String basicInfoCode);

    void save(String basicInfoCode, String engineerId, String actor);

    boolean delete(String basicInfoCode, String engineerId);
}
