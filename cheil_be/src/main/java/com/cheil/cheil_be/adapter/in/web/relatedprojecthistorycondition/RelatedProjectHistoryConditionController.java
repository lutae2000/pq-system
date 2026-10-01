package com.cheil.cheil_be.adapter.in.web.relatedprojecthistorycondition;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.in.ProjectHistoryConditionOptionUseCase;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.in.RelatedProjectHistoryConditionUseCase;

@RestController
@RequestMapping("/pq/related-project-history-conditions")
@RequiredArgsConstructor
public class RelatedProjectHistoryConditionController {

    private final RelatedProjectHistoryConditionUseCase relatedProjectHistoryConditionUseCase;
    private final ProjectHistoryConditionOptionUseCase projectHistoryConditionOptionUseCase;

    @GetMapping("/options")
    public ResponseEntity<List<RelatedProjectHistoryConditionOptionResponse>> options() {
        return ResponseEntity.ok(projectHistoryConditionOptionUseCase.findAll().stream()
                .map(RelatedProjectHistoryConditionOptionResponse::from)
                .toList());
    }

    @GetMapping("/{bidSeq}")
    public ResponseEntity<RelatedProjectHistoryConditionResponse> get(@PathVariable Long bidSeq) {
        return ResponseEntity.ok(RelatedProjectHistoryConditionResponse.from(
                relatedProjectHistoryConditionUseCase.findByBidSeq(bidSeq)
        ));
    }

    @PutMapping("/{bidSeq}")
    public ResponseEntity<RelatedProjectHistoryConditionResponse> save(
            @PathVariable Long bidSeq,
            @RequestBody RelatedProjectHistoryConditionRequest request
    ) {
        return ResponseEntity.ok(RelatedProjectHistoryConditionResponse.from(
                relatedProjectHistoryConditionUseCase.save(bidSeq, request.conditionsJson())
        ));
    }
}
