package com.cheil.cheil_be.application.educationreminder.service;

import com.cheil.cheil_be.application.common.validation.InputValues;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;

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
        return basicInfoRepository.findById(requiredText(code, "code"))
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
        EducationReminderBasicInfoEntity entity = basicInfoRepository.findById(requiredText(code, "code"))
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
        String normalizedCode = requiredText(code, "code");
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
        return templateRepository.findById(requiredPositive(id, "id"))
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
        EducationReminderTemplateEntity entity = templateRepository.findById(requiredPositive(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "템플릿을 찾을 수 없습니다."));
        entity.update(normalizeTemplate(request));
        return templateRepository.save(entity).toResponse();
    }

    @Transactional
    public void deleteTemplate(Long id) {
        Long normalizedId = requiredPositive(id, "id");
        if (!templateRepository.existsById(normalizedId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "템플릿을 찾을 수 없습니다.");
        }
        templateRepository.deleteById(normalizedId);
    }

    private EducationReminderBasicInfoRequest normalizeBasicInfo(EducationReminderBasicInfoRequest request) {
        String code = InputValues.requiredText(request.code(), "code");
        String name = InputValues.requiredText(request.name(), "name");
        String cycleUnit = InputValues.requiredText(request.cycleUnit(), "cycleUnit");
        Integer cycleValue = request.cycleValue();
        requiredPositive(cycleValue, "cycleValue");
        InputValues.validateMaxLength(code, CODE_MAX_LENGTH, "code");
        InputValues.validateMaxLength(name, NAME_MAX_LENGTH, "name");
        InputValues.validateMaxLength(request.description(), DESCRIPTION_MAX_LENGTH, "description");
        if (request.templateId() != null && !templateRepository.existsById(request.templateId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "선택한 교육 알림 템플릿을 찾을 수 없습니다.");
        }
        return new EducationReminderBasicInfoRequest(
                code,
                name,
                request.description(),
                cycleUnit,
                cycleValue,
                request.active() == null ? Boolean.TRUE : request.active(),
                request.templateId()
        );
    }

    private EducationReminderTemplateRequest normalizeTemplate(EducationReminderTemplateRequest request) {
        String name = InputValues.requiredText(request.name(), "name");
        String channel = InputValues.requiredText(request.channel(), "channel");
        if (!"SMS".equalsIgnoreCase(channel) && !"LMS".equalsIgnoreCase(channel)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "channel must be SMS or LMS.");
        }
        channel = channel.toUpperCase();
        String content = InputValues.requiredText(request.content(), "content");
        InputValues.validateMaxLength(name, NAME_MAX_LENGTH, "name");
        InputValues.validateMaxLength(channel, CHANNEL_MAX_LENGTH, "channel");
        InputValues.validateMaxLength(request.description(), DESCRIPTION_MAX_LENGTH, "description");
        String homepageUrl = request.homepageUrl() == null ? "" : request.homepageUrl().trim();
        InputValues.validateMaxLength(homepageUrl, HOMEPAGE_URL_MAX_LENGTH, "homepageUrl");
        InputValues.validateMaxLength(content, CONTENT_MAX_LENGTH, "content");
        return new EducationReminderTemplateRequest(
                request.id(),
                name,
                channel,
                request.description(),
                homepageUrl,
                content,
                request.active() == null ? Boolean.TRUE : request.active()
        );
    }

}
