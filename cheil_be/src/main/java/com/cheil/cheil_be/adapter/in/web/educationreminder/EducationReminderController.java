package com.cheil.cheil_be.adapter.in.web.educationreminder;

import java.util.List;

import lombok.RequiredArgsConstructor;
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

import com.cheil.cheil_be.application.educationreminder.service.EducationReminderAdminService;
import com.cheil.cheil_be.application.educationreminder.service.EducationReminderBasicInfoEngineerService;
import com.cheil.cheil_be.application.educationreminder.service.EducationReminderCompletionService;

@RestController
@RequestMapping("/education-reminders")
@RequiredArgsConstructor
public class EducationReminderController {

    private final EducationReminderAdminService educationReminderAdminService;
    private final EducationReminderBasicInfoEngineerService educationReminderBasicInfoEngineerService;
    private final EducationReminderCompletionService educationReminderCompletionService;

    @GetMapping("/basic-infos")
    public ResponseEntity<List<EducationReminderBasicInfoResponse>> listBasicInfos() {
        return ResponseEntity.ok(educationReminderAdminService.findAllBasicInfos());
    }

    @GetMapping("/basic-infos/{code}")
    public ResponseEntity<EducationReminderBasicInfoResponse> getBasicInfo(@PathVariable String code) {
        return ResponseEntity.ok(educationReminderAdminService.findBasicInfoByCode(code));
    }

    @PostMapping("/basic-infos")
    public ResponseEntity<EducationReminderBasicInfoResponse> createBasicInfo(@RequestBody EducationReminderBasicInfoRequest request) {
        return ResponseEntity.ok(educationReminderAdminService.createBasicInfo(request));
    }

    @PutMapping("/basic-infos/{code}")
    public ResponseEntity<EducationReminderBasicInfoResponse> updateBasicInfo(
            @PathVariable String code,
            @RequestBody EducationReminderBasicInfoRequest request
    ) {
        return ResponseEntity.ok(educationReminderAdminService.updateBasicInfo(code, request));
    }

    @DeleteMapping("/basic-infos/{code}")
    public ResponseEntity<Void> deleteBasicInfo(@PathVariable String code) {
        educationReminderAdminService.deleteBasicInfo(code);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/basic-infos/{code}/engineers")
    public ResponseEntity<List<EducationReminderBasicInfoEngineerResponse>> listBasicInfoEngineers(@PathVariable String code) {
        return ResponseEntity.ok(educationReminderBasicInfoEngineerService.findAssignedEngineers(code).stream()
                .map(EducationReminderBasicInfoEngineerResponse::from)
                .toList());
    }

    @PostMapping("/basic-infos/{code}/engineers")
    public ResponseEntity<List<EducationReminderBasicInfoEngineerResponse>> addBasicInfoEngineers(
            @PathVariable String code,
            @RequestBody EducationReminderBasicInfoEngineerAssignRequest request
    ) {
        return ResponseEntity.ok(educationReminderBasicInfoEngineerService.addAssignments(code, request).stream()
                .map(EducationReminderBasicInfoEngineerResponse::from)
                .toList());
    }

    @DeleteMapping("/basic-infos/{code}/engineers/{engrId}")
    public ResponseEntity<Void> deleteBasicInfoEngineer(@PathVariable String code, @PathVariable String engrId) {
        educationReminderBasicInfoEngineerService.deleteAssignment(code, engrId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/templates")
    public ResponseEntity<List<EducationReminderTemplateResponse>> listTemplates() {
        return ResponseEntity.ok(educationReminderAdminService.findAllTemplates());
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<EducationReminderTemplateResponse> getTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(educationReminderAdminService.findTemplateById(id));
    }

    @PostMapping("/templates")
    public ResponseEntity<EducationReminderTemplateResponse> createTemplate(@RequestBody EducationReminderTemplateRequest request) {
        return ResponseEntity.ok(educationReminderAdminService.createTemplate(request));
    }

    @PutMapping("/templates/{id}")
    public ResponseEntity<EducationReminderTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @RequestBody EducationReminderTemplateRequest request
    ) {
        return ResponseEntity.ok(educationReminderAdminService.updateTemplate(id, request));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        educationReminderAdminService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/completions")
    public ResponseEntity<List<EducationReminderCompletionResponse>> listCompletions(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean educationRegistered,
            @RequestParam(required = false) String retireYn,
            @RequestParam(required = false) String specialtyField,
            @RequestParam(required = false) String jobField,
            @RequestParam(required = false) String scheduledEducationYear,
            @RequestParam(required = false) Integer upcomingWithinDays,
            @RequestParam(required = false) List<String> educationCodes
    ) {
        return ResponseEntity.ok(
                educationReminderCompletionService.findCompletions(
                        name,
                        educationRegistered,
                        retireYn,
                        specialtyField,
                        jobField,
                        scheduledEducationYear,
                        upcomingWithinDays,
                        educationCodes
                )
        );
    }

    @PutMapping("/completions")
    public ResponseEntity<EducationReminderCompletionResponse> saveCompletion(@RequestBody EducationReminderCompletionRequest request) {
        return ResponseEntity.ok(educationReminderCompletionService.saveCompletion(request));
    }

    @GetMapping("/notification-targets")
    public ResponseEntity<List<EducationReminderNotificationTargetResponse>> listNotificationTargets(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String specialtyField,
            @RequestParam(required = false) String jobField
    ) {
        return ResponseEntity.ok(
                educationReminderCompletionService.findNotificationTargets(
                        name,
                        specialtyField,
                        jobField
                )
        );
    }

    @PutMapping("/notification-phones/{engrId}")
    public ResponseEntity<EducationReminderNotificationPhoneResponse> saveNotificationPhone(
            @PathVariable String engrId,
            @RequestBody EducationReminderNotificationPhoneRequest request
    ) {
        return ResponseEntity.ok(educationReminderCompletionService.saveNotificationPhone(engrId, request));
    }

    @DeleteMapping("/notification-phones/{engrId}")
    public ResponseEntity<Void> deleteNotificationPhone(@PathVariable String engrId) {
        educationReminderCompletionService.deleteNotificationPhone(engrId);
        return ResponseEntity.noContent().build();
    }
}
