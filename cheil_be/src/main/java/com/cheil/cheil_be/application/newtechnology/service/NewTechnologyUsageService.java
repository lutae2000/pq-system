package com.cheil.cheil_be.application.newtechnology.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.basicDate;
import static com.cheil.cheil_be.application.common.validation.InputValues.nonNegative;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageSearch;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageView;
import com.cheil.cheil_be.application.newtechnology.port.in.NewTechnologyUsageUseCase;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyUsageRepository;
import com.cheil.cheil_be.common.file.FileAttachmentService;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class NewTechnologyUsageService implements NewTechnologyUsageUseCase {

    private static final int CODE_MAX_LENGTH = 100;
    private static final int TITLE_MAX_LENGTH = 500;
    private static final String ATTACHMENT_OWNER_TYPE = "NEW_TECHNOLOGY_USAGE";

    private final CurrentActorPort currentActorPort;
    private final FileAttachmentService fileAttachmentService;
    private final NewTechnologyUsageRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Page<NewTechnologyUsageView> findAll(
            NewTechnologyUsageSearch search, Pageable pageable) {
        if (search == null || pageable == null) {
            throw ApplicationException.badRequest("검색 조건과 페이지 정보는 필수입니다.");
        }
        return repository.findAll(new NewTechnologyUsageSearch(
                trimToNull(search.keyword()),
                trimToNull(search.designationNo()),
                trimToNull(search.client()),
                basicDate(search.noticeDateFrom(), "noticeDateFrom", false),
                basicDate(search.noticeDateTo(), "noticeDateTo", false)
        ), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public NewTechnologyUsageView findById(Long id) {
        requireId(id);
        return repository.findById(id)
                .orElseThrow(() -> ApplicationException.notFound("신기술 활용실적을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public NewTechnologyUsageView create(NewTechnologyUsageCommand command) {
        NewTechnologyUsageCommand normalized = normalize(command);
        Long id = repository.create(normalized, currentActorPort.currentActor());
        return findById(id);
    }

    @Override
    @Transactional
    public NewTechnologyUsageView update(Long id, NewTechnologyUsageCommand command) {
        requireId(id);
        NewTechnologyUsageCommand normalized = normalize(command);
        if (repository.update(id, normalized, currentActorPort.currentActor()) != 1) {
            throw ApplicationException.notFound("신기술 활용실적을 찾을 수 없습니다.");
        }
        return findById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        requireId(id);
        if (repository.delete(id) != 1) {
            throw ApplicationException.notFound("신기술 활용실적을 찾을 수 없습니다.");
        }
        fileAttachmentService.deleteAll(ATTACHMENT_OWNER_TYPE, String.valueOf(id));
    }

    private NewTechnologyUsageCommand normalize(NewTechnologyUsageCommand command) {
        if (command == null) {
            throw ApplicationException.badRequest("요청 본문은 필수입니다.");
        }
        String designationNo = InputValues.requiredText(command.designationNo(), CODE_MAX_LENGTH, "designationNo");
        String title = InputValues.requiredText(command.title(), TITLE_MAX_LENGTH, "title");
        InputValues.validateMaxLength(StringValues.normalize(command.client()), 300, "client");
        nonNegative(command.usageCount(), "usageCount");
        nonNegative(command.amountThousand(), "amountThousand");
        nonNegative(command.score(), "score");
        nonNegative(command.weight(), "weight");
        nonNegative(command.disasterPreventionScore(), "disasterPreventionScore");

        return new NewTechnologyUsageCommand(
                designationNo,
                title,
                trimToNull(command.developers()),
                trimToNull(command.projectName()),
                trimToNull(command.client()),
                basicDate(command.noticeDate(), "noticeDate", false),
                basicDate(command.usageExpirationDate(), "usageExpirationDate", false),
                command.usageCount(),
                command.amountThousand(),
                command.score(),
                trimToNull(command.summary()),
                command.weight(),
                command.disasterPreventionScore(),
                trimToNull(command.remark())
        );
    }

    private void requireId(Long id) {
        if (id == null || id <= 0) {
            throw ApplicationException.badRequest("id는 1 이상의 값이어야 합니다.");
        }
    }
}
