package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.Instant;
import java.time.LocalDate;

import com.cheil.cheil_be.adapter.out.persistence.companyprofile.CompanyProfileEntity;

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

    public static CompanyProfileResponse from(CompanyProfileEntity entity) {
        return new CompanyProfileResponse(
                entity.getProfileId(),
                entity.getCompanyName(),
                entity.getBusinessRegistrationNo(),
                entity.getCorporateRegistrationNo(),
                entity.getRepresentativeName(),
                entity.getEstablishedOn(),
                entity.getPostalCode(),
                entity.getAddress(),
                entity.getAddressDetail(),
                entity.getPhoneNo(),
                entity.getFaxNo(),
                entity.getHomepageUrl(),
                entity.getBusinessType(),
                entity.getBusinessItem(),
                entity.getMainBusiness(),
                entity.getMemo(),
                entity.getCreatedAt(),
                entity.getCreatedId(),
                entity.getLastChangedAt(),
                entity.getLastChangedId()
        );
    }
}
