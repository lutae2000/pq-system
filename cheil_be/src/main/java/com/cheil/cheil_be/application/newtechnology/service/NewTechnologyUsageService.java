package com.cheil.cheil_be.application.newtechnology.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import com.cheil.cheil_be.application.newtechnology.exception.NewTechnologyApplicationException;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageView;
import com.cheil.cheil_be.application.newtechnology.port.in.NewTechnologyUsageUseCase;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyUsageRepository;
import com.cheil.cheil_be.common.file.FileAttachmentService;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NewTechnologyUsageService implements NewTechnologyUsageUseCase {
    private static final int CODE_MAX_LENGTH = 100;
    private static final int TITLE_MAX_LENGTH = 500;
    private static final String ATTACHMENT_OWNER_TYPE = "NEW_TECHNOLOGY_USAGE";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final FileAttachmentService fileAttachmentService;
    private final NewTechnologyUsageRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Page<NewTechnologyUsageView> findAll(String keyword, String designationNo, String client,
                                                 String noticeDateFrom, String noticeDateTo, Pageable pageable) {
        return repository.findAll(keyword, designationNo, client,
                normalizeDate(noticeDateFrom, "noticeDateFrom", false),
                normalizeDate(noticeDateTo, "noticeDateTo", false), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public NewTechnologyUsageView findById(Long id) {
        if (id == null) throw invalid("id는 필수입니다.");
        NewTechnologyUsageView result = repository.findById(id);
        if (result == null) throw notFound();
        return result;
    }

    @Override
    @Transactional
    public NewTechnologyUsageView create(NewTechnologyUsageCommand command) {
        validate(command);
        Long id = repository.create(normalize(command), AuditActorResolver.resolve());
        return findById(id);
    }

    @Override
    @Transactional
    public NewTechnologyUsageView update(Long id, NewTechnologyUsageCommand command) {
        findById(id);
        validate(command);
        if (repository.update(id, normalize(command), AuditActorResolver.resolve()) != 1) throw notFound();
        return findById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        findById(id);
        // 본문을 삭제하기 전에 연결 파일을 함께 정리해 고아 첨부파일이 남지 않게 합니다.
        fileAttachmentService.deleteAll(ATTACHMENT_OWNER_TYPE, String.valueOf(id));
        if (repository.delete(id) != 1) throw notFound();
    }

    private NewTechnologyUsageCommand normalize(NewTechnologyUsageCommand command) {
        return new NewTechnologyUsageCommand(
                StringValues.required(command.designationNo(), "designationNo"),
                StringValues.required(command.title(), "title"),
                nullIfBlank(command.developers()), nullIfBlank(command.projectName()), nullIfBlank(command.client()),
                normalizeDate(command.noticeDate(), "noticeDate", false),
                normalizeDate(command.usageExpirationDate(), "usageExpirationDate", false),
                command.usageCount(), command.amountThousand(), command.score(), nullIfBlank(command.summary()),
                command.weight(), command.disasterPreventionScore(), nullIfBlank(command.remark())
        );
    }

    private void validate(NewTechnologyUsageCommand command) {
        if (command == null) throw invalid("요청 본문은 필수입니다.");
        StringValues.validateMaxLength(StringValues.required(command.designationNo(), "designationNo"), CODE_MAX_LENGTH, "designationNo");
        StringValues.validateMaxLength(StringValues.required(command.title(), "title"), TITLE_MAX_LENGTH, "title");
        StringValues.validateMaxLength(StringValues.normalize(command.client()), 300, "client");
        normalizeDate(command.noticeDate(), "noticeDate", false);
        normalizeDate(command.usageExpirationDate(), "usageExpirationDate", false);
        nonNegative(command.usageCount(), "usageCount");
        nonNegative(command.amountThousand(), "amountThousand");
        nonNegative(command.score(), "score");
        nonNegative(command.weight(), "weight");
        nonNegative(command.disasterPreventionScore(), "disasterPreventionScore");
    }

    private void nonNegative(Integer value, String field) {
        if (value != null && value < 0) throw invalid(field + "은(는) 0 이상이어야 합니다.");
    }

    private void nonNegative(BigDecimal value, String field) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) throw invalid(field + "은(는) 0 이상이어야 합니다.");
    }

    private String normalizeDate(String value, String field, boolean required) {
        String normalized = StringValues.normalize(value);
        if (normalized == null || normalized.isBlank()) {
            if (required) throw invalid(field + "은(는) 필수입니다.");
            return null;
        }
        // 화면에서 허용하는 YYYY-MM-DD 입력도 저장소에는 기존 규칙인 YYYYMMDD로 통일합니다.
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) throw invalid(field + "은(는) YYYYMMDD 형식이어야 합니다.");
        try {
            LocalDate.parse(compact, DATE_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw invalid(field + "은(는) YYYYMMDD 형식이어야 합니다.");
        }
        return compact;
    }

    private String nullIfBlank(String value) {
        String normalized = StringValues.normalize(value);
        return normalized == null || normalized.isBlank() ? null : normalized;
    }

    private NewTechnologyApplicationException invalid(String message) {
        return new NewTechnologyApplicationException(NewTechnologyApplicationException.Type.BAD_REQUEST, message);
    }

    private NewTechnologyApplicationException notFound() {
        return new NewTechnologyApplicationException(NewTechnologyApplicationException.Type.NOT_FOUND,
                "신기술 활용 실적을 찾을 수 없습니다.");
    }
}
