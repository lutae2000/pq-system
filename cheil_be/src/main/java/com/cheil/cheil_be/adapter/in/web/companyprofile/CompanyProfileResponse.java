package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.Instant;
import java.time.LocalDate;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

public record CompanyProfileResponse(
        Long profileId,
        String companyName,
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
        String memo,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {

    public static CompanyProfileResponse from(CompanyProfileUseCase.Profile entity) {
        return new CompanyProfileResponse(
                entity.profileId(), entity.companyName(), entity.businessRegistrationNo(),
                entity.corporateRegistrationNo(), entity.representativeName(), entity.establishedOn(),
                entity.postalCode(), entity.address(), entity.addressDetail(), entity.phoneNo(), entity.faxNo(),
                entity.homepageUrl(), entity.businessType(), entity.businessItem(), entity.mainBusiness(),
                entity.memo(), entity.createdAt(), entity.createdId(), entity.lastChangedAt(), entity.lastChangedId()
        );
    }
}
