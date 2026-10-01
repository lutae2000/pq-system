package com.cheil.cheil_be.application.engineerperformancedoc.port.out;

import java.util.List;

import com.cheil.cheil_be.application.engineerperformancedoc.model.DocumentValueSetting;
import com.cheil.cheil_be.application.engineerperformancedoc.port.in.SaveDocumentValueSettingCommand;

public interface DocumentValueSettingRepository {

    List<DocumentValueSetting> findByBidSeq(Long bidSeq);

    boolean existsEducation(Long educationId, String engineerId);

    boolean existsLicense(Long licenseId, String engineerId);

    DocumentValueSetting save(SaveDocumentValueSettingCommand command, String actor);
}
