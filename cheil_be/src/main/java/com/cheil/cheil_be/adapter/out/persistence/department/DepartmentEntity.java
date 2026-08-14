package com.cheil.cheil_be.adapter.out.persistence.department;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.domain.commondepartment.Department;

/**
 * Entity mapping for the department table.
 */
@Entity
@Table(name = "department")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
class DepartmentEntity {

    @Id
    @Column(name = "dept_code", nullable = false, unique = true, length = 20)
    private String deptCode;

    @Column(name = "dept_name", nullable = false, length = 100)
    private String deptName;

    @Column(name = "dept_div", nullable = false, length = 10)
    private String deptDiv;

    @Column(name = "proj_div", nullable = false, length = 10)
    private String projDiv;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    @Column(name = "terminate_date")
    private LocalDate terminateDate;

    @Column(name = "headquater_code", nullable = false, length = 20)
    private String headquarterCode;

    @Column(name = "input_duty_id", length = 20)
    private String inputDutyId;

    @Column(name = "input_date")
    private Instant inputDate;

    @Column(name = "chg_duty_id", length = 20)
    private String chgDutyId;

    @Column(name = "chg_date")
    private Instant chgDate;

    @Column(name = "sort_seq", nullable = false, length = 10)
    private String sortSeq;

    @Column(name = "mh_yn", nullable = false)
    private boolean mhYn;

    @Column(name = "cost_dept", length = 20)
    private String costDept;

    static DepartmentEntity from(Department department) {
        return DepartmentEntity.builder()
                .deptCode(department.deptCode())
                .deptName(department.deptName())
                .deptDiv(department.deptDiv())
                .projDiv(department.projDiv())
                .useYn(department.useYn())
                .terminateDate(department.terminateDate())
                .headquarterCode(department.headquarterCode())
                .inputDutyId(department.inputDutyId())
                .inputDate(department.inputDate())
                .chgDutyId(department.chgDutyId())
                .chgDate(department.chgDate())
                .sortSeq(department.sortSeq())
                .mhYn(department.mhYn())
                .costDept(department.costDept())
                .build();
    }

    void updateFrom(Department department) {
        deptName = department.deptName();
        deptDiv = department.deptDiv();
        projDiv = department.projDiv();
        useYn = department.useYn();
        terminateDate = department.terminateDate();
        headquarterCode = department.headquarterCode();
        inputDutyId = department.inputDutyId();
        inputDate = department.inputDate();
        chgDutyId = department.chgDutyId();
        chgDate = department.chgDate();
        sortSeq = department.sortSeq();
        mhYn = department.mhYn();
        costDept = department.costDept();
    }

    Department toDomain() {
        return new Department(
                deptCode,
                deptName,
                deptDiv,
                projDiv,
                useYn,
                terminateDate,
                headquarterCode,
                inputDutyId,
                inputDate,
                chgDutyId,
                chgDate,
                sortSeq,
                mhYn,
                costDept
        );
    }
}
