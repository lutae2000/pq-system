package com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "work_overlap_document_engineers")
@Getter
@NoArgsConstructor
public class WorkOverlapDocumentTargetEngineerEntity extends AuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "bid_seq", nullable = false)
    private Long bidSeq;

    @Column(name = "work_duty_id", nullable = false, length = 100)
    private String workDutyId;

    @Column(name = "engr_id", nullable = false, length = 50)
    private String engrId;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "responsibility", length = 50)
    private String responsibility;

    public WorkOverlapDocumentTargetEngineerEntity(Long bidSeq, String workDutyId, String engrId, Integer displayOrder, String responsibility) {
        this.bidSeq = bidSeq;
        this.workDutyId = workDutyId;
        this.engrId = engrId;
        this.displayOrder = displayOrder;
        this.responsibility = responsibility;
    }

    public void update(Integer displayOrder, String responsibility) {
        this.displayOrder = displayOrder;
        this.responsibility = responsibility;
    }
}
