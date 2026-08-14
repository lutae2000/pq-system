package com.cheil.cheil_be.adapter.in.web.client;

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

import com.cheil.cheil_be.application.client.port.in.ClientSearchCondition;
import com.cheil.cheil_be.application.client.service.ClientAdminService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;
import com.cheil.cheil_be.domain.client.Client;

/**
 * 거래처 코드 관리 API.
 * <p>
 * 화면에서는 "거래처 등록" 용도로 사용하고, 추후 거래처 코드 조회 팝업 등 공통 컴포넌트에서도
 * 같은 목록 API를 재사용할 수 있도록 페이지 응답을 제공합니다.
 */
@RestController
@RequestMapping("/code/client-codes")
@RequiredArgsConstructor
public class ClientController {

    private final ClientAdminService clientAdminService;

    /**
     * 거래처 목록을 clientCode 오름차순으로 페이지 단위 조회합니다.
     * <p>
     * businessName은 거래처 코드, 약식명, 정식명, 영문명, 사업자번호를 통합 검색합니다.
     * orderClass는 거래처 분류 코드, companyType은 상위기관 코드를 정확히 일치 검색합니다.
     */
    @GetMapping
    public ResponseEntity<PageResponse<ClientResponse>> list(
            @RequestParam(required = false) String businessName,
            @RequestParam(required = false) String orderClass,
            @RequestParam(required = false) String companyType,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<Client> result = clientAdminService.findAll(
                new ClientSearchCondition(businessName, orderClass, companyType),
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result, ClientResponse::from));
    }

    /**
     * 거래처 한 건을 조회합니다.
     */
    @GetMapping("/{clientCode}")
    public ResponseEntity<ClientResponse> get(@PathVariable String clientCode) {
        return ResponseEntity.ok(ClientResponse.from(clientAdminService.findByClientCode(clientCode)));
    }

    /**
     * 신규 거래처를 등록합니다.
     */
    @PostMapping
    public ResponseEntity<ClientResponse> create(@RequestBody ClientUpsertRequest request) {
        return ResponseEntity.ok(ClientResponse.from(clientAdminService.create(request.toCommand())));
    }

    /**
     * 기존 거래처 정보를 수정합니다.
     */
    @PutMapping("/{clientCode}")
    public ResponseEntity<ClientResponse> update(
            @PathVariable String clientCode,
            @RequestBody ClientUpsertRequest request
    ) {
        return ResponseEntity.ok(ClientResponse.from(clientAdminService.update(clientCode, request.toCommand())));
    }

    /**
     * 거래처 코드를 삭제합니다.
     */
    @DeleteMapping("/{clientCode}")
    public ResponseEntity<Void> delete(@PathVariable String clientCode) {
        clientAdminService.delete(clientCode);
        return ResponseEntity.noContent().build();
    }
}
