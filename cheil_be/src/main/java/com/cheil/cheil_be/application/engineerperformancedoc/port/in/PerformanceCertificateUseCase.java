package com.cheil.cheil_be.application.engineerperformancedoc.port.in;

import com.cheil.cheil_be.application.engineerperformancedoc.model.CertificateDownload;
import com.cheil.cheil_be.application.engineerperformancedoc.model.PerformanceCertificateCommand;

public interface PerformanceCertificateUseCase {
    CertificateDownload generate(PerformanceCertificateCommand request);

    CertificateDownload generateBatch(PerformanceCertificateCommand request);

    byte[] generateWorkOverlapBatch(Long bidSeq, String workDutyId, boolean includeParticipantList);

    String findProjectName(Long bidSeq);
}
