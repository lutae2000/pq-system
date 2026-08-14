package com.cheil.cheil_be.adapter.in.web.engineer;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.engineer.EngineerAdminService;
import com.cheil.cheil_be.application.engineer.EngineerDtos;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/engineers")
@RequiredArgsConstructor
public class EngineerController {

    private final EngineerAdminService engineerAdminService;

    /**
     * 기술자 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<PageResponse<EngineerDtos.Profile>> list(
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "100") Integer size,
            @RequestParam(required = false) String retireYn,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String certificationName,
            @RequestParam(required = false) String designGrade,
            @RequestParam(required = false) String constructionManagementGrade,
            @RequestParam(required = false) String specialtyField,
            @RequestParam(required = false) String jobField
    ) {
        Page<EngineerDtos.Profile> result = engineerAdminService.findAll(
                page,
                size,
                retireYn,
                status,
                keyword,
                certificationName,
                designGrade,
                constructionManagementGrade,
                specialtyField,
                jobField
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    /**
     * 기술자 단건을 조회한다.
     */
    @GetMapping("/{engrId}")
    public ResponseEntity<EngineerDtos.Profile> get(@PathVariable String engrId) {
        return ResponseEntity.ok(engineerAdminService.findByEngrId(engrId));
    }

    /**
     * 기술자를 신규 등록한다.
     */
    @PostMapping
    public ResponseEntity<EngineerDtos.Profile> create(@RequestBody EngineerDtos.Profile request) {
        return ResponseEntity.ok(engineerAdminService.create(request));
    }

    /**
     * 기술자 기본정보를 수정한다.
     */
    @PutMapping("/{engrId}")
    public ResponseEntity<EngineerDtos.Profile> update(@PathVariable String engrId, @RequestBody EngineerDtos.Profile request) {
        return ResponseEntity.ok(engineerAdminService.update(engrId, request));
    }

    /**
     * 기술자를 삭제한다.
     */
    @DeleteMapping("/{engrId}")
    public ResponseEntity<Void> delete(@PathVariable String engrId) {
        engineerAdminService.delete(engrId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 기술자 기본정보 섹션을 저장한다.
     */
    @PutMapping("/{engrId}/master")
    public ResponseEntity<EngineerDtos.Profile> saveMaster(@PathVariable String engrId, @RequestBody EngineerDtos.Basic request) {
        return ResponseEntity.ok(engineerAdminService.saveBasic(engrId, request));
    }

    /**
     * 자격증 목록을 저장한다.
     */
    @PutMapping("/{engrId}/licenses")
    public ResponseEntity<EngineerDtos.Profile> saveLicenses(@PathVariable String engrId, @RequestBody List<EngineerDtos.License> request) {
        return ResponseEntity.ok(engineerAdminService.saveLicenses(engrId, request));
    }

    /**
     * 경력 목록을 저장한다.
     */
    @PutMapping("/{engrId}/careers")
    public ResponseEntity<EngineerDtos.Profile> saveCareers(@PathVariable String engrId, @RequestBody List<EngineerDtos.Career> request) {
        return ResponseEntity.ok(engineerAdminService.saveCareers(engrId, request));
    }

    /**
     * 수상 내역 목록을 저장한다.
     */
    @PutMapping("/{engrId}/prizes")
    public ResponseEntity<EngineerDtos.Profile> savePrizes(@PathVariable String engrId, @RequestBody List<EngineerDtos.Prize> request) {
        return ResponseEntity.ok(engineerAdminService.savePrizes(engrId, request));
    }

    /**
     * 학력 목록을 저장한다.
     */
    @PutMapping("/{engrId}/educations")
    public ResponseEntity<EngineerDtos.Profile> saveEducations(@PathVariable String engrId, @RequestBody List<EngineerDtos.Education> request) {
        return ResponseEntity.ok(engineerAdminService.saveEducations(engrId, request));
    }

    /**
     * 경력 상세 목록을 저장한다.
     */
    @PutMapping("/{engrId}/career-details")
    public ResponseEntity<EngineerDtos.Profile> saveCareerDetails(@PathVariable String engrId, @RequestBody List<EngineerDtos.CareerDetail> request) {
        return ResponseEntity.ok(engineerAdminService.saveCareerDetails(engrId, request));
    }

    /**
     * 학교 이력 목록을 저장한다.
     */
    @PutMapping("/{engrId}/schools")
    public ResponseEntity<EngineerDtos.Profile> saveSchools(@PathVariable String engrId, @RequestBody List<EngineerDtos.School> request) {
        return ResponseEntity.ok(engineerAdminService.saveSchools(engrId, request));
    }

    /**
     * 자격증 항목을 삭제한다.
     */
    @DeleteMapping("/{engrId}/licenses/{recordId}")
    public ResponseEntity<EngineerDtos.Profile> deleteLicense(@PathVariable String engrId, @PathVariable Long recordId) {
        return ResponseEntity.ok(engineerAdminService.deleteLicense(engrId, recordId));
    }

    /**
     * 경력 항목을 삭제한다.
     */
    @DeleteMapping("/{engrId}/careers/{recordId}")
    public ResponseEntity<EngineerDtos.Profile> deleteCareer(@PathVariable String engrId, @PathVariable Long recordId) {
        return ResponseEntity.ok(engineerAdminService.deleteCareer(engrId, recordId));
    }

    /**
     * 수상 항목을 삭제한다.
     */
    @DeleteMapping("/{engrId}/prizes/{recordId}")
    public ResponseEntity<EngineerDtos.Profile> deletePrize(@PathVariable String engrId, @PathVariable Long recordId) {
        return ResponseEntity.ok(engineerAdminService.deletePrize(engrId, recordId));
    }

    /**
     * 학력 항목을 삭제한다.
     */
    @DeleteMapping("/{engrId}/educations/{recordId}")
    public ResponseEntity<EngineerDtos.Profile> deleteEducation(@PathVariable String engrId, @PathVariable Long recordId) {
        return ResponseEntity.ok(engineerAdminService.deleteEducation(engrId, recordId));
    }

    /**
     * 경력 상세 항목을 삭제한다.
     */
    @DeleteMapping("/{engrId}/career-details/{recordId}")
    public ResponseEntity<EngineerDtos.Profile> deleteCareerDetail(@PathVariable String engrId, @PathVariable Long recordId) {
        return ResponseEntity.ok(engineerAdminService.deleteCareerDetail(engrId, recordId));
    }

    /**
     * 학교 이력 항목을 삭제한다.
     */
    @DeleteMapping("/{engrId}/schools/{recordId}")
    public ResponseEntity<EngineerDtos.Profile> deleteSchool(@PathVariable String engrId, @PathVariable Long recordId) {
        return ResponseEntity.ok(engineerAdminService.deleteSchool(engrId, recordId));
    }
}
