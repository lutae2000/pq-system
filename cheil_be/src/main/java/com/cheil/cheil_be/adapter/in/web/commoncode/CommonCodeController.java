package com.cheil.cheil_be.adapter.in.web.commoncode;

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

import com.cheil.cheil_be.application.commoncode.port.in.CommonCodeSearchCondition;
import com.cheil.cheil_be.application.commoncode.service.CommonCodeAdminService;

@RestController
@RequestMapping("/code/common-codes")
@RequiredArgsConstructor
public class CommonCodeController {

    private final CommonCodeAdminService commonCodeAdminService;

    /**
     * 공통코드 목록 조회.
     * 검색 조건은 서비스에서 처리하고, 컨트롤러는 요청을 DTO로 묶어 전달만 담당한다.
     */
    @GetMapping
    public ResponseEntity<List<CommonCodeResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn,
            @RequestParam(required = false) Integer codeLevel,
            @RequestParam(required = false) String level1Code,
            @RequestParam(required = false) String level2Code,
            @RequestParam(required = false) String level2CodePrefix,
            @RequestParam(required = false) String level3Code,
            @RequestParam(required = false) String refValue1Contains,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "false") boolean bypassCache
    ) {
        return ResponseEntity.ok(commonCodeAdminService.findAll(new CommonCodeSearchCondition(
                        keyword,
                        useYn,
                        codeLevel,
                        level1Code,
                        level2Code,
                        level2CodePrefix,
                        level3Code,
                        refValue1Contains,
                        sort,
                        bypassCache
                ))
                .stream()
                .map(CommonCodeResponse::from)
                .toList());
    }

    /**
     * 단건 공통코드 조회.
     */
    @GetMapping("/{codeId}")
    public ResponseEntity<CommonCodeResponse> get(@PathVariable Long codeId) {
        return ResponseEntity.ok(CommonCodeResponse.from(commonCodeAdminService.findByCodeId(codeId)));
    }

    /**
     * 공통코드 신규 등록.
     */
    @PostMapping
    public ResponseEntity<CommonCodeResponse> create(@RequestBody CommonCodeUpsertRequest request) {
        return ResponseEntity.ok(CommonCodeResponse.from(commonCodeAdminService.create(request.toCommand())));
    }

    /**
     * 기존 공통코드 수정.
     */
    @PutMapping("/{codeId}")
    public ResponseEntity<CommonCodeResponse> update(@PathVariable Long codeId, @RequestBody CommonCodeUpsertRequest request) {
        return ResponseEntity.ok(CommonCodeResponse.from(commonCodeAdminService.update(codeId, request.toCommand())));
    }

    /**
     * 공통코드 삭제.
     */
    @DeleteMapping("/{codeId}")
    public ResponseEntity<Void> delete(@PathVariable Long codeId) {
        commonCodeAdminService.delete(codeId);
        return ResponseEntity.noContent().build();
    }
}
