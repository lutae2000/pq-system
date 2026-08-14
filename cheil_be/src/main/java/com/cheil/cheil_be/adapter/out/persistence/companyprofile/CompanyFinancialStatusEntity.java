package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "company_financial_statuses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanyFinancialStatusEntity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "financial_id")
    private Long financialId;

    @Column(name = "profile_id", nullable = false)
    private Long profileId = 1L;

    @Column(name = "fiscal_year", nullable = false)
    private Integer fiscalYear;

    @Column(name = "capital_amount_million")
    private BigDecimal capitalAmountMillion;

    @Column(name = "sales_amount_million")
    private BigDecimal salesAmountMillion;

    @Column(name = "debt_ratio")
    private BigDecimal debtRatio;

    @Column(name = "current_ratio")
    private BigDecimal currentRatio;

    @Column(name = "credit_rating")
    private String creditRating;

    @Column(name = "registered_on")
    private LocalDate registeredOn;

    @Column(name = "note")
    private String note;

    public static CompanyFinancialStatusEntity create(Integer fiscalYear, BigDecimal capitalAmountMillion, BigDecimal salesAmountMillion,
            BigDecimal debtRatio, BigDecimal currentRatio, String creditRating, LocalDate registeredOn, String note) {
        CompanyFinancialStatusEntity entity = new CompanyFinancialStatusEntity();
        entity.profileId = 1L;
        entity.fiscalYear = fiscalYear;
        entity.capitalAmountMillion = capitalAmountMillion;
        entity.salesAmountMillion = salesAmountMillion;
        entity.debtRatio = debtRatio;
        entity.currentRatio = currentRatio;
        entity.creditRating = creditRating;
        entity.registeredOn = registeredOn;
        entity.note = note;
        return entity;
    }
}
