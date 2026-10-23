package com.cheil.cheil_be.application.engineerperformancedoc.service;

import com.cheil.cheil_be.application.common.validation.InputValues;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.engineerperformancedoc.model.DocumentValueSetting;
import com.cheil.cheil_be.application.engineerperformancedoc.port.in.DocumentValueSettingUseCase;
import com.cheil.cheil_be.application.engineerperformancedoc.port.in.SaveDocumentValueSettingCommand;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.DocumentValueSettingRepository;
import com.cheil.cheil_be.common.security.AuditActorResolver;

/**
 * 기술인실적 문서의 학력·자격 선택값 저장을 조정한다.
 *
 * <p>테이블명과 SQL은 JDBC adapter에 두고, 여기서는 입력 검증과 선택값의
 * 기술인 소유 여부 검증, 감사 주체 전달만 담당한다.</p>
 */
@Service
@RequiredArgsConstructor
public class DocumentValueSettingService implements DocumentValueSettingUseCase {

    private final DocumentValueSettingRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<DocumentValueSetting> findByBidSeq(Long bidSeq) {
        return bidSeq == null ? List.of() : repository.findByBidSeq(bidSeq);
    }

    @Override
    @Transactional
    public DocumentValueSetting save(SaveDocumentValueSettingCommand command) {
        if (command == null) {
            throw ApplicationException.badRequest("문서 값 설정 요청은 필수입니다.");
        }

        long bidSeq = requiredPositive(command.bidSeq(), "bidSeq");
        String engineerId = requiredText(command.engineerId(), "engineerId");
        if (command.educationId() != null && !repository.existsEducation(command.educationId(), engineerId)) {
            throw ApplicationException.badRequest("educationId에 해당하는 학력이 기술인 정보와 일치하지 않습니다.");
        }
        if (command.licenseId() != null && !repository.existsLicense(command.licenseId(), engineerId)) {
            throw ApplicationException.badRequest("licenseId에 해당하는 자격이 기술인 정보와 일치하지 않습니다.");
        }

        return repository.save(new SaveDocumentValueSettingCommand(
                bidSeq, engineerId, command.educationId(), command.licenseId()), AuditActorResolver.resolve());
    }

}
