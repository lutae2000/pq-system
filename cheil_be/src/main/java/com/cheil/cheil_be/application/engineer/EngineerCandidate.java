package com.cheil.cheil_be.application.engineer;

public record EngineerCandidate(
        String engineerId,
        String name,
        String department,
        String position,
        String dutyPart,
        String proPart,
        String designGrade
) {
}
