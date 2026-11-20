package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserMenuPermissionId implements Serializable {

    @Column(name = "employee_no", nullable = false, length = 20)
    private String employeeNo;

    @Column(name = "menu_code", nullable = false, length = 50)
    private String menuCode;
}
