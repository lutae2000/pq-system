package com.cheil.cheil_be.adapter.in.web.relatedprojecthistorycondition;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.relatedprojecthistorycondition.RelatedProjectHistoryConditionService;

@RestController
@RequestMapping("/pq/related-project-history-conditions")
@RequiredArgsConstructor
public class RelatedProjectHistoryConditionController {

    private final RelatedProjectHistoryConditionService service;

    @GetMapping("/{bidSeq}")
    public ResponseEntity<RelatedProjectHistoryConditionResponse> get(@PathVariable Long bidSeq) {
        return ResponseEntity.ok(service.findByBidSeq(bidSeq));
    }

    @PutMapping("/{bidSeq}")
    public ResponseEntity<RelatedProjectHistoryConditionResponse> save(
            @PathVariable Long bidSeq,
            @RequestBody RelatedProjectHistoryConditionRequest request
    ) {
        return ResponseEntity.ok(service.save(bidSeq, request.conditionsJson()));
    }
}
