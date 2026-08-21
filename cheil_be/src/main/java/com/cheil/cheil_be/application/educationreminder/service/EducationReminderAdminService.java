package com.cheil.cheil_be.application.educationreminder.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderBasicInfoRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderBasicInfoResponse;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderTemplateRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderTemplateResponse;
import com.cheil.cheil_be.adapter.out.persistence.educationreminder.EducationReminderBasicInfoEntity;
import com.cheil.cheil_be.adapter.out.persistence.educationreminder.EducationReminderBasicInfoJpaRepository;
import com.cheil.cheil_be.adapter.out.persistence.educationreminder.EducationReminderTemplateEntity;
import com.cheil.cheil_be.adapter.out.persistence.educationreminder.EducationReminderTemplateJpaRepository;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class EducationReminderAdminService {

    private static final int CODE_MAX_LENGTH = 50;
    private static final int NAME_MAX_LENGTH = 300;
    private static final int DESCRIPTION_MAX_LENGTH = 4000;
    private static final int CHANNEL_MAX_LENGTH = 10;
    private static final int TITLE_MAX_LENGTH = 300;
    private static final int HOMEPAGE_URL_MAX_LENGTH = 500;
    private static final int CONTENT_MAX_LENGTH = 8000;

    private final EducationReminderBasicInfoJpaRepository basicInfoRepository;
    private final EducationReminderTemplateJpaRepository templateRepository;

    @Transactional(readOnly = true)
    public List<EducationReminderBasicInfoResponse> findAllBasicInfos() {
        return basicInfoRepository.findAllByOrderByCodeAsc().stream().map(EducationReminderBasicInfoEntity::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EducationReminderBasicInfoResponse findBasicInfoByCode(String code) {
        return basicInfoRepository.findById(requiredCode(code))
                .map(EducationReminderBasicInfoEntity::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "기초 정보를 찾을 수 없습니다."));
    }

    @Transactional
    public EducationReminderBasicInfoResponse createBasicInfo(EducationReminderBasicInfoRequest request) {
        EducationReminderBasicInfoEntity entity = new EducationReminderBasicInfoEntity(normalizeBasicInfo(request));
        return basicInfoRepository.save(entity).toResponse();
    }

    @Transactional
    public EducationReminderBasicInfoResponse updateBasicInfo(String code, EducationReminderBasicInfoRequest request) {
        EducationReminderBasicInfoEntity entity = basicInfoRepository.findById(requiredCode(code))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "기초 정보를 찾을 수 없습니다."));
        EducationReminderBasicInfoRequest normalized = normalizeBasicInfo(request);
        if (!entity.getCode().equals(normalized.code())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기초 정보 코드는 수정할 수 없습니다.");
        }
        entity.update(normalized);
        return basicInfoRepository.save(entity).toResponse();
    }

    @Transactional
    public void deleteBasicInfo(String code) {
        String normalizedCode = requiredCode(code);
        if (!basicInfoRepository.existsById(normalizedCode)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "기초 정보를 찾을 수 없습니다.");
        }
        basicInfoRepository.deleteById(normalizedCode);
    }

    @Transactional(readOnly = true)
    public List<EducationReminderTemplateResponse> findAllTemplates() {
        return templateRepository.findAllByOrderByNameAsc().stream().map(EducationReminderTemplateEntity::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EducationReminderTemplateResponse findTemplateById(Long id) {
        return templateRepository.findById(requiredId(id, "id"))
                .map(EducationReminderTemplateEntity::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "템플릿을 찾을 수 없습니다."));
    }

    @Transactional
    public EducationReminderTemplateResponse createTemplate(EducationReminderTemplateRequest request) {
        EducationReminderTemplateEntity entity = new EducationReminderTemplateEntity(normalizeTemplate(request));
        return templateRepository.save(entity).toResponse();
    }

    @Transactional
    public EducationReminderTemplateResponse updateTemplate(Long id, EducationReminderTemplateRequest request) {
        EducationReminderTemplateEntity entity = templateRepository.findById(requiredId(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "템플릿을 찾을 수 없습니다."));
        entity.update(normalizeTemplate(request));
        return templateRepository.save(entity).toResponse();
    }

    @Transactional
    public void deleteTemplate(Long id) {
        Long normalizedId = requiredId(id, "id");
        if (!templateRepository.existsById(normalizedId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "템플릿을 찾을 수 없습니다.");
        }
        templateRepository.deleteById(normalizedId);
    }

    private EducationReminderBasicInfoRequest normalizeBasicInfo(EducationReminderBasicInfoRequest request) {
        String code = StringValues.required(request.code(), "code");
        String name = StringValues.required(request.name(), "name");
        String cycleUnit = StringValues.required(request.cycleUnit(), "cycleUnit");
        Integer cycleValue = request.cycleValue();
        if (cycleValue == null || cycleValue < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cycleValue는 1 이상이어야 합니다.");
        }
        StringValues.validateMaxLength(code, CODE_MAX_LENGTH, "code");
        StringValues.validateMaxLength(name, NAME_MAX_LENGTH, "name");
        StringValues.validateMaxLength(request.description(), DESCRIPTION_MAX_LENGTH, "description");
        return new EducationReminderBasicInfoRequest(
                code,
                name,
                request.description(),
                cycleUnit,
                cycleValue,
                request.active() == null ? Boolean.TRUE : request.active()
        );
    }

    private EducationReminderTemplateRequest normalizeTemplate(EducationReminderTemplateRequest request) {
        String name = StringValues.required(request.name(), "name");
        String channel = StringValues.required(request.channel(), "channel");
        String title = StringValues.required(request.title(), "title");
        String content = StringValues.required(request.content(), "content");
        StringValues.validateMaxLength(name, NAME_MAX_LENGTH, "name");
        StringValues.validateMaxLength(channel, CHANNEL_MAX_LENGTH, "channel");
        StringValues.validateMaxLength(title, TITLE_MAX_LENGTH, "title");
        StringValues.validateMaxLength(request.description(), DESCRIPTION_MAX_LENGTH, "description");
        String homepageUrl = request.homepageUrl() == null ? "" : request.homepageUrl().trim();
        StringValues.validateMaxLength(homepageUrl, HOMEPAGE_URL_MAX_LENGTH, "homepageUrl");
        StringValues.validateMaxLength(content, CONTENT_MAX_LENGTH, "content");
        return new EducationReminderTemplateRequest(
                request.id(),
                name,
                channel,
                title,
                request.description(),
                homepageUrl,
                content,
                request.active() == null ? Boolean.TRUE : request.active()
        );
    }

    private Long requiredId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }
        return id;
    }

    private String requiredCode(String code) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code is required.");
        }
        return code.trim();
    }
}
