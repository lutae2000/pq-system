package com.cheil.cheil_be.application.engineer;

import com.cheil.cheil_be.domain.companyperformance.ContractPeriodDates;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

public final class EngineerDtos {

    public static final int EMPLOYEE_NO_MAX_LENGTH = 20;

    private EngineerDtos() {
    }

    public record Basic(
            String engrId,
            String nameKor,
            String birthday,
            String deptName,
            String grade,
            String designGrade,
            String constructionManagementGrade,
            Boolean educationException,
            String retireYn,
            String dutyPart,
            String proPart,
            @Size(max = EMPLOYEE_NO_MAX_LENGTH, message = "사번은 20자 이하로 입력해야 합니다.") String employeeNo
    ) {
    }

    public record License(
            Long recordId,
            String engrId,
            String dateOfIssue,
            String licenseCode,
            String licenseNo
    ) {
    }

    public record Career(
            Long recordId,
            String engrId,
            String entryDt,
            String retireDt,
            String compName,
            String deptName,
            String grade,
            String duty
    ) {
    }

    public record Prize(
            Long recordId,
            String engrId,
            String prizeTag,
            String dt,
            String kind,
            String spec,
            String organName,
            String jobName,
            String remark
    ) {
    }

    public record Education(
            Long recordId,
            String engrId,
            String startDt,
            String endDt,
            String eduName,
            String organName
    ) {
    }

    public record CareerDetail(
            Long recordId,
            String engrId,
            String jobName,
            Integer seq,
            String startDt,
            String endDt,
            String jobClass,
            String jobTag,
            String jobPart,
            String proPart,
            String compName,
            String deptName,
            String grade,
            String duty,
            String returnYn,
            String joinYn,
            Integer joinDay,
            Integer partDay,
            Integer selectDay,
            String remark,
            String contractFromDate,
            String contractToDate,
            List<ContractPeriodDates> contractPeriods
    ) {
    }

    public record School(
            Long recordId,
            String engrId,
            String graduationDate,
            String schName,
            String major,
            Integer career,
            String validMajorYn,
            String lastYn
    ) {
    }

    public record Profile(
            @Valid Basic basic,
            List<License> licenses,
            List<Career> careers,
            List<Prize> prizes,
            List<Education> educations,
            List<CareerDetail> careerDetails,
            List<School> schools
    ) {
    }
}
