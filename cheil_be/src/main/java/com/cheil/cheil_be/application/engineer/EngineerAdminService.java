package com.cheil.cheil_be.application.engineer;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class EngineerAdminService {

    private final EngineerMasterRepository masterRepository;
    private final EngineerLicenseRepository licenseRepository;
    private final EngineerCareerRepository careerRepository;
    private final EngineerPrizeRepository prizeRepository;
    private final EngineerEducationRepository educationRepository;
    private final EngineerProjectHistoryRepository projectHistoryRepository;
    private final EngineerSchoolRepository schoolRepository;

    @Transactional(readOnly = true)
    public Page<EngineerDtos.Profile> findAll(Integer page, Integer size) {
        return findAll(page, size, null, null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<EngineerDtos.Profile> findAll(
            Integer page,
            Integer size,
            String retireYn,
            String status,
            String keyword,
            String certificationName,
            String department,
            String designGrade,
            String constructionManagementGrade,
            String specialtyField,
            String jobField
    ) {
        PageRequest pageable = PageRequest.of(Math.max(page == null ? 0 : page, 0), Math.max(Math.min(size == null ? 1000 : size, 1000), 1));
        return masterRepository.search(
                retireYnParam(retireYn, status),
                blankToEmpty(keyword),
                blankToEmpty(certificationName),
                blankToEmpty(department),
                blankToEmpty(designGrade),
                blankToEmpty(constructionManagementGrade),
                blankToEmpty(specialtyField),
                blankToEmpty(jobField),
                pageable
        ).map(this::toListProfile);
    }

    @Transactional(readOnly = true)
    public List<EngineerDtos.Profile> findAllProfiles() {
        return masterRepository.findAll().stream().map(this::toProfile).toList();
    }

    @Transactional(readOnly = true)
    public EngineerDtos.Profile findByEngrId(String engrId) {
        return toProfile(findMaster(engrId));
    }

    @Transactional
    public EngineerDtos.Profile create(EngineerDtos.Profile request) {
        EngineerDtos.Basic basic = requireBasic(request);
        String engrId = requireEngrId(basic.engrId());
        if (masterRepository.existsById(engrId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Engineer already exists.");
        }
        validateDuplicate(basic, engrId);
        masterRepository.save(EngineerMasterEntity.from(basic, engrId));
        return findByEngrId(engrId);
    }

    @Transactional
    public EngineerDtos.Profile update(String engrId, EngineerDtos.Profile request) {
        return saveBasic(engrId, requireBasic(request));
    }

    @Transactional
    public void delete(String engrId) {
        String id = requireExistingEngrId(engrId);
        licenseRepository.deleteByEngrId(id);
        careerRepository.deleteByEngrId(id);
        prizeRepository.deleteByEngrId(id);
        educationRepository.deleteByEngrId(id);
        schoolRepository.deleteByEngrId(id);
        masterRepository.deleteById(id);
    }

    @Transactional
    public EngineerDtos.Profile saveBasic(String engrId, EngineerDtos.Basic basic) {
        String id = requireExistingEngrId(engrId);
        validateDuplicate(basic, id);
        EngineerMasterEntity entity = findMaster(id);
        entity.updateFrom(basic);
        masterRepository.save(entity);
        return findByEngrId(id);
    }

    private void validateDuplicate(EngineerDtos.Basic basic, String engrId) {
        String nameKor = EngineerEntityUtils.clean(basic.nameKor());
        String birthday = EngineerEntityUtils.date(basic.birthday());
        if (nameKor == null || birthday == null) {
            return;
        }

        if (masterRepository.existsDuplicate(nameKor, birthday, engrId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "중복된 기술인이 있습니다.");
        }
    }

    @Transactional
    public EngineerDtos.Profile saveLicenses(String engrId, List<EngineerDtos.License> rows) {
        String id = requireExistingEngrId(engrId);
        syncChildRows(
                id,
                rows,
                licenseRepository::findByEngrIdOrderById,
                licenseRepository,
                entity -> entity.id,
                EngineerDtos.License::recordId,
                EngineerLicenseEntity::from,
                EngineerLicenseEntity::updateFrom
        );
        return findByEngrId(id);
    }

    @Transactional
    public EngineerDtos.Profile saveCareers(String engrId, List<EngineerDtos.Career> rows) {
        String id = requireExistingEngrId(engrId);
        syncChildRows(
                id,
                rows,
                careerRepository::findByEngrIdOrderByEntryDtAsc,
                careerRepository,
                entity -> entity.id,
                EngineerDtos.Career::recordId,
                EngineerCareerEntity::from,
                EngineerCareerEntity::updateFrom
        );
        return findByEngrId(id);
    }

    @Transactional
    public EngineerDtos.Profile savePrizes(String engrId, List<EngineerDtos.Prize> rows) {
        String id = requireExistingEngrId(engrId);
        syncChildRows(
                id,
                rows,
                prizeRepository::findByEngrIdOrderById,
                prizeRepository,
                entity -> entity.id,
                EngineerDtos.Prize::recordId,
                EngineerPrizeEntity::from,
                EngineerPrizeEntity::updateFrom
        );
        return findByEngrId(id);
    }

    @Transactional
    public EngineerDtos.Profile saveEducations(String engrId, List<EngineerDtos.Education> rows) {
        String id = requireExistingEngrId(engrId);
        syncChildRows(
                id,
                rows,
                educationRepository::findByEngrIdOrderById,
                educationRepository,
                entity -> entity.id,
                EngineerDtos.Education::recordId,
                EngineerEducationEntity::from,
                EngineerEducationEntity::updateFrom
        );
        return findByEngrId(id);
    }

    @Transactional
    public EngineerDtos.Profile saveCareerDetails(String engrId, List<EngineerDtos.CareerDetail> rows) {
        return findByEngrId(requireExistingEngrId(engrId));
    }

    @Transactional
    public EngineerDtos.Profile saveSchools(String engrId, List<EngineerDtos.School> rows) {
        String id = requireExistingEngrId(engrId);
        syncChildRows(
                id,
                rows,
                schoolRepository::findByEngrIdOrderById,
                schoolRepository,
                entity -> entity.id,
                EngineerDtos.School::recordId,
                EngineerSchoolEntity::from,
                EngineerSchoolEntity::updateFrom
        );
        return findByEngrId(id);
    }

    @Transactional
    public EngineerDtos.Profile deleteLicense(String engrId, Long recordId) {
        deleteChild(engrId, recordId, licenseRepository);
        return findByEngrId(engrId);
    }

    @Transactional
    public EngineerDtos.Profile deleteCareer(String engrId, Long recordId) {
        deleteChild(engrId, recordId, careerRepository);
        return findByEngrId(engrId);
    }

    @Transactional
    public EngineerDtos.Profile deletePrize(String engrId, Long recordId) {
        deleteChild(engrId, recordId, prizeRepository);
        return findByEngrId(engrId);
    }

    @Transactional
    public EngineerDtos.Profile deleteEducation(String engrId, Long recordId) {
        deleteChild(engrId, recordId, educationRepository);
        return findByEngrId(engrId);
    }

    @Transactional
    public EngineerDtos.Profile deleteCareerDetail(String engrId, Long recordId) {
        return findByEngrId(requireExistingEngrId(engrId));
    }

    @Transactional
    public EngineerDtos.Profile deleteSchool(String engrId, Long recordId) {
        deleteChild(engrId, recordId, schoolRepository);
        return findByEngrId(engrId);
    }

    private EngineerDtos.Profile toProfile(EngineerMasterEntity master) {
        String engrId = master.engrId;
        return new EngineerDtos.Profile(
                master.toDto(),
                licenseRepository.findByEngrIdOrderById(engrId).stream().map(EngineerLicenseEntity::toDto).toList(),
                careerRepository.findByEngrIdOrderByEntryDtAsc(engrId).stream().map(EngineerCareerEntity::toDto).toList(),
                prizeRepository.findByEngrIdOrderById(engrId).stream().map(EngineerPrizeEntity::toDto).toList(),
                educationRepository.findByEngrIdOrderById(engrId).stream().map(EngineerEducationEntity::toDto).toList(),
                projectHistoryRepository.findByEngrIdOrderByStartDtDescIdDesc(engrId).stream()
                        .map(EngineerProjectHistoryEntity::toDto)
                        .toList(),
                schoolRepository.findByEngrIdOrderById(engrId).stream().map(EngineerSchoolEntity::toDto).toList()
        );
    }

    private EngineerDtos.Profile toListProfile(EngineerMasterEntity master) {
        return new EngineerDtos.Profile(
                master.toDto(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
    }

    private EngineerMasterEntity findMaster(String engrId) {
        return masterRepository.findById(requireEngrId(engrId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Engineer not found."));
    }

    private String requireExistingEngrId(String engrId) {
        return findMaster(engrId).engrId;
    }

    private EngineerDtos.Basic requireBasic(EngineerDtos.Profile request) {
        if (request == null || request.basic() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "basic is required.");
        }
        return request.basic();
    }

    private String requireEngrId(String engrId) {
        String text = blankToNull(engrId);
        if (text == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ENGR_ID is required.");
        }
        return text;
    }

    private <T> List<T> nullToEmpty(List<T> rows) {
        return rows == null ? List.of() : rows;
    }

    private <E, R> void syncChildRows(
            String engrId,
            List<R> rows,
            Function<String, List<E>> existingFinder,
            org.springframework.data.jpa.repository.JpaRepository<E, Long> repository,
            Function<E, Long> entityIdExtractor,
            Function<R, Long> rowIdExtractor,
            BiFunctionWithEngrId<R, E> creator,
            BiConsumer<E, R> updater
    ) {
        List<E> existingRows = existingFinder.apply(engrId);
        Map<Long, E> existingById = new HashMap<>();
        for (E entity : existingRows) {
            Long entityId = entityIdExtractor.apply(entity);
            if (entityId != null) {
                existingById.put(entityId, entity);
            }
        }

        List<E> desiredRows = new ArrayList<>();
        for (R row : nullToEmpty(rows)) {
            Long rowId = rowIdExtractor.apply(row);
            E entity = rowId == null ? null : existingById.remove(rowId);
            if (entity != null) {
                updater.accept(entity, row);
            } else {
                entity = creator.create(row, engrId);
            }
            desiredRows.add(entity);
        }

        if (!existingById.isEmpty()) {
            repository.deleteAllById(existingById.keySet());
        }
        repository.saveAll(desiredRows);
    }

    @FunctionalInterface
    private interface BiFunctionWithEngrId<R, E> {
        E create(R row, String engrId);
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }

    private String blankToEmpty(String value) {
        return value == null || value.trim().isBlank() ? "" : value.trim();
    }

    private String retireYnParam(String retireYn, String status) {
        String retireYnText = blankToEmpty(retireYn);
        if ("Y".equalsIgnoreCase(retireYnText) || "N".equalsIgnoreCase(retireYnText)) {
            return retireYnText.toUpperCase();
        }

        String text = blankToEmpty(status);
        if (text.isBlank() || "전체".equals(text) || "ALL".equalsIgnoreCase(text)) {
            return "";
        }
        if ("퇴직".equals(text) || "RETIRE".equalsIgnoreCase(text) || "Y".equalsIgnoreCase(text)) {
            return "Y";
        }
        if ("재직".equals(text) || "휴직".equals(text) || "ACTIVE".equalsIgnoreCase(text) || "N".equalsIgnoreCase(text)) {
            return "N";
        }
        return text;
    }

    private <T> void deleteChild(String engrId, Long recordId, org.springframework.data.jpa.repository.JpaRepository<T, Long> repository) {
        requireExistingEngrId(engrId);
        if (recordId == null || !repository.existsById(recordId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found.");
        }
        repository.deleteById(recordId);
    }
}
