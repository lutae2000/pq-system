package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.LocalDate;

public record CompanyProfileRequest(
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
        String memo
) {
}
