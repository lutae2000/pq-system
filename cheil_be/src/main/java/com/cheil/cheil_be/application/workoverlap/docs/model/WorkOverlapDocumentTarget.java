package com.cheil.cheil_be.application.workoverlap.docs.model;

public record WorkOverlapDocumentTarget(Long targetId, Long bidSeq, String workDutyId, String engineerId,
                                        String contractNo, Integer displayOrder, String responsibility) {}
