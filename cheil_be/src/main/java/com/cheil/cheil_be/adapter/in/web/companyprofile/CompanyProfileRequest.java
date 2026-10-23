package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

public record CompanyProfileRequest(
        @NotBlank String companyName,
        String businessRegistrationNo,
        String corporateRegistrationNo,
        String representativeName,
        LocalDate establishedOn,
        String postalCode,
        String address,
        String addressDetail,
        String phoneNo,
        String faxNo,
        String homepageUrl,
        String businessType,
        String businessItem,
        String mainBusiness,
        String memo
) {
    public CompanyProfileUseCase.ProfileCommand toCommand() {
        return new CompanyProfileUseCase.ProfileCommand(
                companyName, businessRegistrationNo, corporateRegistrationNo, representativeName,
                establishedOn, postalCode, address, addressDetail, phoneNo, faxNo, homepageUrl,
                businessType, businessItem, mainBusiness, memo
        );
    }
}
