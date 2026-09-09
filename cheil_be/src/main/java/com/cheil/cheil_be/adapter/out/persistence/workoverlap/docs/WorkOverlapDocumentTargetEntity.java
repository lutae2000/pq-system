package com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "work_overlap_document_targets")
@Getter
@NoArgsConstructor
public class WorkOverlapDocumentTargetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "bid_seq", nullable = false)
    private Long bidSeq;

    @Column(name = "work_duty_id", nullable = false, length = 50)
    private String workDutyId;

    @Column(name = "engineer_id", nullable = false, length = 50)
    private String engineerId;

    @Column(name = "contract_no", nullable = false, length = 8)
    private String contractNo;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "responsibility", length = 50)
    private String responsibility;

    public WorkOverlapDocumentTargetEntity(Long bidSeq, String workDutyId, String engineerId, String contractNo, Integer displayOrder, String responsibility) {
        this.bidSeq = bidSeq;
        this.workDutyId = workDutyId;
        this.engineerId = engineerId;
        this.contractNo = contractNo;
        this.displayOrder = displayOrder;
        this.responsibility = responsibility;
    }

    public void update(Integer displayOrder, String responsibility) {
        this.displayOrder = displayOrder;
        this.responsibility = responsibility;
    }
}
