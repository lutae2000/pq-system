package com.cheil.cheil_be.adapter.out.persistence.workoverlapcontract;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.in.web.workoverlapcontract.WorkOverlapContractRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlapcontract.WorkOverlapContractResponse;
import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "work_overlap_contracts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkOverlapContractEntity extends AuditEntity {

    @Id
    @Column(name = "contract_no", nullable = false, length = 8)
    private String contractNo;

    @Column(name = "service_type", length = 100)
    private String serviceType;

    @Column(name = "client_name", length = 300)
    private String clientName;

    @Column(name = "supervising_department_code", length = 20)
    private String supervisingDepartmentCode;

    @Column(name = "service_name", nullable = false, length = 500)
    private String serviceName;

    @Column(name = "construction_start_date", length = 8)
    private String constructionStartDate;

    @Column(name = "construction_complete_date", length = 8)
    private String constructionCompleteDate;

    @Column(name = "management_service_complete_date", length = 8)
    private String managementServiceCompleteDate;

    @Column(name = "construction_stop_from_date", length = 8)
    private String constructionStopFromDate;

    @Column(name = "construction_stop_to_date", length = 8)
    private String constructionStopToDate;

    @Column(name = "restart_date", length = 8)
    private String restartDate;

    @Column(name = "contract_amount", precision = 18)
    private BigDecimal contractAmount;

    @Column(name = "share_amount", precision = 18)
    private BigDecimal shareAmount;

    @Column(name = "performance_certification", length = 30)
    private String performanceCertification;

    @Column(name = "participate_list_document", length = 30)
    private String participateListDocument;

    @Column(name = "cems_confirm", length = 30)
    private String cemsConfirm;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public WorkOverlapContractEntity(String contractNo, WorkOverlapContractRequest request) {
        this.contractNo = contractNo;
        update(request);
    }

    public void update(WorkOverlapContractRequest request) {
        serviceType = request.serviceType();
        clientName = request.clientName();
        supervisingDepartmentCode = request.supervisingDepartmentCode();
        serviceName = request.serviceName();
        constructionStartDate = request.constructionStartDate();
        constructionCompleteDate = request.constructionCompleteDate();
        managementServiceCompleteDate = request.managementServiceCompleteDate();
        constructionStopFromDate = request.constructionStopFromDate();
        constructionStopToDate = request.constructionStopToDate();
        restartDate = request.restartDate();
        contractAmount = request.contractAmount();
        shareAmount = request.shareAmount();
        performanceCertification = request.performanceCertification();
        participateListDocument = request.participateListDocument();
        cemsConfirm = request.cemsConfirm();
        remark = request.remark();
    }

    public WorkOverlapContractResponse toResponse() {
        return new WorkOverlapContractResponse(
                contractNo,
                serviceType,
                clientName,
                supervisingDepartmentCode,
                serviceName,
                constructionStartDate,
                constructionCompleteDate,
                managementServiceCompleteDate,
                constructionStopFromDate,
                constructionStopToDate,
                restartDate,
                contractAmount,
                shareAmount,
                performanceCertification,
                participateListDocument,
                cemsConfirm,
                remark,
                createdAt == null ? null : createdAt.toString(),
                createdId,
                lastChangedAt == null ? null : lastChangedAt.toString(),
                lastChangedId
        );
    }
}
