package com.cheil.cheil_be.application.workoverlap.contract.port.in;

import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineer;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCandidate;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerChangeCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCreateCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistory;

import java.util.List;

public interface WorkOverlapContractEngineerUseCase {
    List<WorkOverlapContractEngineerCandidate> findEngineerCandidates(String keyword, Integer limit);
    List<WorkOverlapContractEngineer> findByContractNo(String contractNo);
    List<WorkOverlapContractEngineerHistory> findHistoriesByContractNo(String contractNo);
    void deleteHistory(String contractNo, long historyId);
    WorkOverlapContractEngineer create(String contractNo, WorkOverlapContractEngineerCreateCommand command);
    WorkOverlapContractEngineer update(String contractNo, String engineerId, WorkOverlapContractEngineerChangeCommand command);
    void delete(String contractNo, String engineerId);
}
