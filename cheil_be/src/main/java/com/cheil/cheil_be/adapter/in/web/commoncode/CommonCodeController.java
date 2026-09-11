package com.cheil.cheil_be.adapter.in.web.commoncode;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.commoncode.port.in.CommonCodeSearchCondition;
import com.cheil.cheil_be.application.commoncode.service.CommonCodeAdminService;

@RestController
@RequestMapping("/code/common-codes")
@RequiredArgsConstructor
public class CommonCodeController {

    private static final int MAX_BATCH_SIZE = 50;

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

    @PostMapping("/batch")
    public ResponseEntity<List<CommonCodeBatchResponse>> listBatch(@RequestBody List<CommonCodeBatchRequest> requests) {
        validateBatchRequests(requests);
        List<List<CommonCodeResponse>> resultItems = commonCodeAdminService.findAllBatch(
                        requests.stream().map(CommonCodeBatchRequest::toCondition).toList()
                ).stream()
                .map(items -> items.stream().map(CommonCodeResponse::from).toList())
                .toList();

        return ResponseEntity.ok(IntStream.range(0, requests.size())
                .mapToObj(index -> new CommonCodeBatchResponse(requests.get(index).key(), resultItems.get(index)))
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

    private void validateBatchRequests(List<CommonCodeBatchRequest> requests) {
        if (requests == null || requests.isEmpty() || requests.size() > MAX_BATCH_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Batch requests must contain between 1 and 50 items.");
        }

        Set<String> keys = new HashSet<>();
        for (CommonCodeBatchRequest request : requests) {
            if (request == null || request.key() == null || request.key().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each batch request requires a key.");
            }
            if (!keys.add(request.key())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Batch request keys must be unique.");
            }
            if (request.codeLevel() == null || request.codeLevel() < 1 || request.codeLevel() > 3) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "codeLevel must be 1, 2, or 3.");
            }
            if (request.codeLevel() >= 2 && (request.level1Code() == null || request.level1Code().isBlank())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "level1Code is required for codeLevel 2 and 3.");
            }
            if (request.codeLevel() == 3 && (request.level2Code() == null || request.level2Code().isBlank())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "level2Code is required for codeLevel 3.");
            }
        }
    }
}
