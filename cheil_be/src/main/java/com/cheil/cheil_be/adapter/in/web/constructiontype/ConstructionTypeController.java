package com.cheil.cheil_be.adapter.in.web.constructiontype;

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

import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeSearchCondition;
import com.cheil.cheil_be.application.constructiontype.service.ConstructionTypeAdminService;

@RestController
@RequestMapping("/code/construction-types")
@RequiredArgsConstructor
public class ConstructionTypeController {

    private final ConstructionTypeAdminService constructionTypeAdminService;

    /**
     * 공사종류 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<List<ConstructionTypeResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn,
            @RequestParam(required = false) Integer codeLevel,
            @RequestParam(required = false) String level1Code,
            @RequestParam(required = false) String level2Code
    ) {
        return ResponseEntity.ok(constructionTypeAdminService.findAll(new ConstructionTypeSearchCondition(
                        keyword,
                        useYn,
                        codeLevel,
                        level1Code,
                        level2Code
                ))
                .stream()
                .map(ConstructionTypeResponse::from)
                .toList());
    }

    /**
     * 공사종류 단건을 조회한다.
     */
    @GetMapping("/{codeId}")
    public ResponseEntity<ConstructionTypeResponse> get(@PathVariable Long codeId) {
        return ResponseEntity.ok(ConstructionTypeResponse.from(constructionTypeAdminService.findByCodeId(codeId)));
    }

    /**
     * 공사종류를 신규 등록한다.
     */
    @PostMapping
    public ResponseEntity<ConstructionTypeResponse> create(@RequestBody ConstructionTypeUpsertRequest request) {
        return ResponseEntity.ok(ConstructionTypeResponse.from(constructionTypeAdminService.create(request.toCommand())));
    }

    /**
     * 기존 공사종류를 수정한다.
     */
    @PutMapping("/{codeId}")
    public ResponseEntity<ConstructionTypeResponse> update(@PathVariable Long codeId, @RequestBody ConstructionTypeUpsertRequest request) {
        return ResponseEntity.ok(ConstructionTypeResponse.from(constructionTypeAdminService.update(codeId, request.toCommand())));
    }

    /**
     * 공사종류를 삭제한다.
     */
    @DeleteMapping("/{codeId}")
    public ResponseEntity<Void> delete(@PathVariable Long codeId) {
        constructionTypeAdminService.delete(codeId);
        return ResponseEntity.noContent().build();
    }
}
