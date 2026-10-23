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

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentSearch;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentView;
import com.cheil.cheil_be.application.newtechnology.port.in.NewTechnologyInvestmentUseCase;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

/** 신기술 투자 실적을 조회하고 관리하는 API다. */
@RestController
@RequestMapping("/pq/new-technology-investments")
@RequiredArgsConstructor
public class NewTechnologyInvestmentController {

    private final NewTechnologyInvestmentUseCase useCase;

    @GetMapping
    public ResponseEntity<PageResponse<NewTechnologyInvestmentResponse>> list(
            @RequestParam(required = false) String yearFrom,
            @RequestParam(required = false) String yearTo,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        var safePageable = PageRequests.of(pageable);
        var result = useCase.findAll(new NewTechnologyInvestmentSearch(
                yearFrom,
                yearTo
        ), safePageable);
        return ResponseEntity.ok(PageResponse.from(result, NewTechnologyInvestmentResponse::from));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewTechnologyInvestmentResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(NewTechnologyInvestmentResponse.from(useCase.findById(id)));
    }

    @PostMapping
    public ResponseEntity<NewTechnologyInvestmentResponse> create(
            @Valid @RequestBody NewTechnologyInvestmentRequest request) {
        return ResponseEntity.ok(NewTechnologyInvestmentResponse.from(useCase.create(request.toCommand())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewTechnologyInvestmentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody NewTechnologyInvestmentRequest request
    ) {
        return ResponseEntity.ok(NewTechnologyInvestmentResponse.from(useCase.update(id, request.toCommand())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        useCase.delete(id);
        return ResponseEntity.noContent().build();
    }

}
