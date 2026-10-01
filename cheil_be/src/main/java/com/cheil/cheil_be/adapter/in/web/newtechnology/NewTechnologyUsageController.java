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

import com.cheil.cheil_be.application.newtechnology.port.in.NewTechnologyUsageUseCase;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageView;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/new-technology-usages")
@RequiredArgsConstructor
public class NewTechnologyUsageController {

    private final NewTechnologyUsageUseCase newTechnologyUsageUseCase;

    @GetMapping
    public ResponseEntity<PageResponse<NewTechnologyUsageResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String designationNo,
            @RequestParam(required = false) String client,
            @RequestParam(required = false) String noticeDateFrom,
            @RequestParam(required = false) String noticeDateTo,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<NewTechnologyUsageView> result = newTechnologyUsageUseCase.findAll(
                keyword,
                designationNo,
                client,
                noticeDateFrom,
                noticeDateTo,
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result.map(NewTechnologyUsageResponse::from)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewTechnologyUsageResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(NewTechnologyUsageResponse.from(newTechnologyUsageUseCase.findById(id)));
    }

    @PostMapping
    public ResponseEntity<NewTechnologyUsageResponse> create(@RequestBody NewTechnologyUsageRequest request) {
        return ResponseEntity.ok(NewTechnologyUsageResponse.from(newTechnologyUsageUseCase.create(request.toCommand())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewTechnologyUsageResponse> update(
            @PathVariable Long id,
            @RequestBody NewTechnologyUsageRequest request
    ) {
        return ResponseEntity.ok(NewTechnologyUsageResponse.from(newTechnologyUsageUseCase.update(id, request.toCommand())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        newTechnologyUsageUseCase.delete(id);
        return ResponseEntity.noContent().build();
    }
}
