package com.cheil.cheil_be.adapter.in.web.qualificationcriteria;

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

import com.cheil.cheil_be.application.qualificationcriteria.service.QualificationCriteriaService;

@RestController
@RequestMapping("/bid/qualification-criteria")
@RequiredArgsConstructor
public class QualificationCriteriaController {

    private final QualificationCriteriaService qualificationCriteriaService;

    @GetMapping("/agencies")
    public ResponseEntity<List<QualificationReviewAgencyResponse>> listAgencies(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn
    ) {
        return ResponseEntity.ok(qualificationCriteriaService.findAgencies(keyword, useYn));
    }

    @PostMapping("/agencies")
    public ResponseEntity<QualificationReviewAgencyResponse> createAgency(@RequestBody QualificationReviewAgencyRequest request) {
        return ResponseEntity.ok(qualificationCriteriaService.createAgency(request));
    }

    @PutMapping("/agencies/{id}")
    public ResponseEntity<QualificationReviewAgencyResponse> updateAgency(
            @PathVariable Long id,
            @RequestBody QualificationReviewAgencyRequest request
    ) {
        return ResponseEntity.ok(qualificationCriteriaService.updateAgency(id, request));
    }

    @DeleteMapping("/agencies/{id}")
    public ResponseEntity<Void> deleteAgency(@PathVariable Long id) {
        qualificationCriteriaService.deleteAgency(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/criteria")
    public ResponseEntity<List<QualificationReviewCriterionResponse>> listCriteria(
            @RequestParam Long agencyId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn
    ) {
        return ResponseEntity.ok(qualificationCriteriaService.findCriteria(agencyId, keyword, useYn));
    }

    @PostMapping("/criteria")
    public ResponseEntity<QualificationReviewCriterionResponse> createCriterion(@RequestBody QualificationReviewCriterionRequest request) {
        return ResponseEntity.ok(qualificationCriteriaService.createCriterion(request));
    }

    @PutMapping("/criteria/{id}")
    public ResponseEntity<QualificationReviewCriterionResponse> updateCriterion(
            @PathVariable Long id,
            @RequestBody QualificationReviewCriterionRequest request
    ) {
        return ResponseEntity.ok(qualificationCriteriaService.updateCriterion(id, request));
    }

    @DeleteMapping("/criteria/{id}")
    public ResponseEntity<Void> deleteCriterion(@PathVariable Long id) {
        qualificationCriteriaService.deleteCriterion(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/score-bands")
    public ResponseEntity<List<QualificationScoreBandResponse>> listScoreBands(@RequestParam Long criterionId) {
        return ResponseEntity.ok(qualificationCriteriaService.findScoreBands(criterionId));
    }

    @PostMapping("/score-bands")
    public ResponseEntity<QualificationScoreBandResponse> createScoreBand(@RequestBody QualificationScoreBandRequest request) {
        return ResponseEntity.ok(qualificationCriteriaService.createScoreBand(request));
    }

    @PutMapping("/score-bands/{id}")
    public ResponseEntity<QualificationScoreBandResponse> updateScoreBand(
            @PathVariable Long id,
            @RequestBody QualificationScoreBandRequest request
    ) {
        return ResponseEntity.ok(qualificationCriteriaService.updateScoreBand(id, request));
    }

    @DeleteMapping("/score-bands/{id}")
    public ResponseEntity<Void> deleteScoreBand(@PathVariable Long id) {
        qualificationCriteriaService.deleteScoreBand(id);
        return ResponseEntity.noContent().build();
    }
}
