package com.cheil.cheil_be.adapter.in.web.newtechnology;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentSearch;
import com.cheil.cheil_be.application.newtechnology.port.in.NewTechnologyDevelopmentUseCase;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

/** 신기술 개발 실적을 조회하고 관리하는 API다. */
@RestController
@RequestMapping("/pq/new-technology-developments")
@RequiredArgsConstructor
public class NewTechnologyDevelopmentController {

    private final NewTechnologyDevelopmentUseCase useCase;

    @GetMapping
    public ResponseEntity<PageResponse<NewTechnologyDevelopmentResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String technologyType,
            @RequestParam(required = false) String targetField,
            @RequestParam(required = false) String applicationDateFrom,
            @RequestParam(required = false) String applicationDateTo,
            @RequestParam(required = false) Boolean useYn,
            @RequestParam(required = false) String scoreReferenceDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        var safePageable = PageRequests.of(pageable);
        var result = useCase.findAll(new NewTechnologyDevelopmentSearch(
                keyword,
                technologyType,
                targetField,
                applicationDateFrom,
                applicationDateTo,
                useYn,
                scoreReferenceDate
        ), safePageable);
        return ResponseEntity.ok(PageResponse.from(result, NewTechnologyDevelopmentResponse::from));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewTechnologyDevelopmentResponse> get(
            @PathVariable Long id,
            @RequestParam(required = false) String scoreReferenceDate
    ) {
        return ResponseEntity.ok(NewTechnologyDevelopmentResponse.from(useCase.findById(id, scoreReferenceDate)));
    }

    @PostMapping
    public ResponseEntity<NewTechnologyDevelopmentResponse> create(
            @Valid @RequestBody NewTechnologyDevelopmentRequest request) {
        return ResponseEntity.ok(NewTechnologyDevelopmentResponse.from(useCase.create(request.toCommand())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewTechnologyDevelopmentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody NewTechnologyDevelopmentRequest request
    ) {
        return ResponseEntity.ok(NewTechnologyDevelopmentResponse.from(useCase.update(id, request.toCommand())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        useCase.delete(id);
        return ResponseEntity.noContent().build();
    }

}
