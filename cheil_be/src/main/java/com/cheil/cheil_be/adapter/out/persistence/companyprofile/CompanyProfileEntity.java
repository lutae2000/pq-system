package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "company_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanyProfileEntity extends AuditEntity {

    @Id
    @Column(name = "profile_id")
    private Long profileId;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "business_registration_no")
    private String businessRegistrationNo;

    @Column(name = "corporate_registration_no")
    private String corporateRegistrationNo;

    @Column(name = "representative_name")
    private String representativeName;

    @Column(name = "established_on")
    private LocalDate establishedOn;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "address")
    private String address;

    @Column(name = "address_detail")
    private String addressDetail;

    @Column(name = "phone_no")
    private String phoneNo;

    @Column(name = "fax_no")
    private String faxNo;

    @Column(name = "homepage_url")
    private String homepageUrl;

    @Column(name = "business_type")
    private String businessType;

    @Column(name = "business_item")
    private String businessItem;

    @Column(name = "main_business")
    private String mainBusiness;

    @Column(name = "memo")
    private String memo;

    public static CompanyProfileEntity empty() {
        CompanyProfileEntity entity = new CompanyProfileEntity();
        entity.profileId = 1L;
        entity.companyName = "";
        return entity;
    }

    public void update(
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
        this.companyName = companyName;
        this.businessRegistrationNo = businessRegistrationNo;
        this.corporateRegistrationNo = corporateRegistrationNo;
        this.representativeName = representativeName;
        this.establishedOn = establishedOn;
        this.postalCode = postalCode;
        this.address = address;
        this.addressDetail = addressDetail;
        this.phoneNo = phoneNo;
        this.faxNo = faxNo;
        this.homepageUrl = homepageUrl;
        this.businessType = businessType;
        this.businessItem = businessItem;
        this.mainBusiness = mainBusiness;
        this.memo = memo;
    }

    public Map<String, Object> snapshot() {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("profileId", profileId);
        values.put("companyName", companyName);
        values.put("businessRegistrationNo", businessRegistrationNo);
        values.put("corporateRegistrationNo", corporateRegistrationNo);
        values.put("representativeName", representativeName);
        values.put("establishedOn", establishedOn == null ? null : establishedOn.toString());
        values.put("postalCode", postalCode);
        values.put("address", address);
        values.put("addressDetail", addressDetail);
        values.put("phoneNo", phoneNo);
        values.put("faxNo", faxNo);
        values.put("homepageUrl", homepageUrl);
        values.put("businessType", businessType);
        values.put("businessItem", businessItem);
        values.put("mainBusiness", mainBusiness);
        values.put("memo", memo);
        values.put("createdAt", createdAt == null ? null : createdAt.toString());
        values.put("createdId", createdId);
        values.put("lastChangedAt", lastChangedAt == null ? null : lastChangedAt.toString());
        values.put("lastChangedId", lastChangedId);
        return values;
    }
}
