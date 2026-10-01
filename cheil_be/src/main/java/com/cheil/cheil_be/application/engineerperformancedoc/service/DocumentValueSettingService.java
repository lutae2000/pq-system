package com.cheil.cheil_be.application.engineerperformancedoc.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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
            throw new IllegalArgumentException("문서 값 설정 요청은 필수입니다.");
        }

        long bidSeq = requiredBidSeq(command.bidSeq());
        String engineerId = required(command.engineerId(), "engineerId");
        if (command.educationId() != null && !repository.existsEducation(command.educationId(), engineerId)) {
            throw new IllegalArgumentException("선택한 학력이 기술인 정보와 일치하지 않습니다.");
        }
        if (command.licenseId() != null && !repository.existsLicense(command.licenseId(), engineerId)) {
            throw new IllegalArgumentException("선택한 자격이 기술인 정보와 일치하지 않습니다.");
        }

        return repository.save(new SaveDocumentValueSettingCommand(
                bidSeq, engineerId, command.educationId(), command.licenseId()), AuditActorResolver.resolve());
    }

    private long requiredBidSeq(Long bidSeq) {
        if (bidSeq == null || bidSeq <= 0) {
            throw new IllegalArgumentException("bidSeq는 필수입니다.");
        }
        return bidSeq;
    }

    private String required(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(fieldName + "는 필수입니다.");
        }
        return value.trim();
    }
}
