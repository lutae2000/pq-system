package com.cheil.cheil_be.adapter.in.web.newtechnology;

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

import com.cheil.cheil_be.application.newtechnology.service.NewTechnologyDevelopmentService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/new-technology-developments")
@RequiredArgsConstructor
public class NewTechnologyDevelopmentController {

    private final NewTechnologyDevelopmentService newTechnologyDevelopmentService;

    @GetMapping
    public ResponseEntity<PageResponse<NewTechnologyDevelopmentResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String technologyType,
            @RequestParam(required = false) String targetField,
            @RequestParam(required = false) String applicationDateFrom,
            @RequestParam(required = false) String applicationDateTo,
            @RequestParam(required = false) Boolean useYn,
            @RequestParam(required = false) String scoreReferenceDate,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<NewTechnologyDevelopmentResponse> result = newTechnologyDevelopmentService.findAll(
                keyword,
                technologyType,
                targetField,
                applicationDateFrom,
                applicationDateTo,
                useYn,
                scoreReferenceDate,
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewTechnologyDevelopmentResponse> get(
            @PathVariable Long id,
            @RequestParam(required = false) String scoreReferenceDate
    ) {
        return ResponseEntity.ok(newTechnologyDevelopmentService.findById(id, scoreReferenceDate));
    }

    @PostMapping
    public ResponseEntity<NewTechnologyDevelopmentResponse> create(@RequestBody NewTechnologyDevelopmentRequest request) {
        return ResponseEntity.ok(newTechnologyDevelopmentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewTechnologyDevelopmentResponse> update(
            @PathVariable Long id,
            @RequestBody NewTechnologyDevelopmentRequest request
    ) {
        return ResponseEntity.ok(newTechnologyDevelopmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        newTechnologyDevelopmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
