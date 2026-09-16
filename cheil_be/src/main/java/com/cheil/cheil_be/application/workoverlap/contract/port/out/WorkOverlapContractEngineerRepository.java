package com.cheil.cheil_be.application.workoverlap.contract.port.out;

import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineer;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCandidate;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistory;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerSaveCommand;

import java.util.List;

public interface WorkOverlapContractEngineerRepository {

    List<WorkOverlapContractEngineerCandidate> findCandidates(String keyword, int limit);

    List<WorkOverlapContractEngineer> findByContractNo(String contractNo);

    List<WorkOverlapContractEngineerHistory> findHistoriesByContractNo(String contractNo);

    void create(WorkOverlapContractEngineerSaveCommand command);

    boolean update(WorkOverlapContractEngineerSaveCommand command);

    boolean delete(String contractNo, String engineerId);

    boolean deleteHistory(String contractNo, long historyId);

    void createHistory(
            String contractNo,
            String beforeEngineerId,
            String afterEngineerId,
            String changeContent,
            String actor
    );
}
