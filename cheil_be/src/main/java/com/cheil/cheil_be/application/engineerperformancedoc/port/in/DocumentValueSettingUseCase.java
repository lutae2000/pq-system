package com.cheil.cheil_be.application.engineerperformancedoc.port.in;

import java.util.List;

import com.cheil.cheil_be.application.engineerperformancedoc.model.DocumentValueSetting;

public interface DocumentValueSettingUseCase {

    List<DocumentValueSetting> findByBidSeq(Long bidSeq);

    DocumentValueSetting save(SaveDocumentValueSettingCommand command);
}
