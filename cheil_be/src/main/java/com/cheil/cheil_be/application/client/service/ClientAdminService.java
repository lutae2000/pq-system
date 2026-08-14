package com.cheil.cheil_be.application.client.service;

import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.client.port.in.ClientSearchCondition;
import com.cheil.cheil_be.application.client.port.in.ClientUpsertCommand;
import com.cheil.cheil_be.application.client.port.out.ClientRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.client.Client;

@Service
@RequiredArgsConstructor
public class ClientAdminService {

    private static final int CODE_MAX_LENGTH = 20;
    private static final int NAME_MAX_LENGTH = 300;
    private static final int BUSINESS_NO_MAX_LENGTH = 20;
    private static final int CORP_NO_MAX_LENGTH = 20;
    private static final int OWNER_MAX_LENGTH = 100;
    private static final int SHORT_TEXT_MAX_LENGTH = 100;
    private static final int ADDRESS_MAX_LENGTH = 500;
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final int URL_MAX_LENGTH = 500;
    private static final int AUDIT_ID_MAX_LENGTH = 100;

    private final ClientRepository clientRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public Page<Client> findAll(ClientSearchCondition condition, Pageable pageable) {
        return clientRepository.findAll(condition, pageable);
    }

    @Transactional(readOnly = true)
    public Client findByClientCode(String clientCode) {
        return clientRepository.findByClientCode(StringValues.required(clientCode, "clientCode"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "諛쒖＜泥??뺣낫瑜?李얠쓣 ???놁뒿?덈떎."));
    }

    @Transactional
    public Client create(ClientUpsertCommand command) {
        NormalizedClient normalized = normalize(command, null);
        if (clientRepository.existsByClientCode(normalized.clientCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "?대? 議댁옱?섎뒗 諛쒖＜泥?肄붾뱶?낅땲??");
        }

        Instant now = Instant.now(clock);
        return clientRepository.save(toDomain(normalized, now, normalized.createdId(), now, normalized.lastChangedId()));
    }

    @Transactional
    public Client update(String clientCode, ClientUpsertCommand command) {
        Client existing = findByClientCode(clientCode);
        NormalizedClient normalized = normalize(command, existing);

        if (!existing.clientCode().equals(normalized.clientCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "諛쒖＜泥?肄붾뱶???섏젙?????놁뒿?덈떎.");
        }

        Instant now = Instant.now(clock);
        return clientRepository.save(toDomain(normalized, existing.createdAt(), existing.createdId(), now, normalized.lastChangedId()));
    }

    @Transactional
    public void delete(String clientCode) {
        findByClientCode(clientCode);
        clientRepository.deleteByClientCode(StringValues.required(clientCode, "clientCode"));
    }

    private NormalizedClient normalize(ClientUpsertCommand command, Client existing) {
        if (command == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "?붿껌 蹂몃Ц???꾩슂?⑸땲??");
        }

        String clientCode = StringValues.required(command.clientCode(), "clientCode");
        String orderName = StringValues.required(command.orderName(), "orderName");
        String orderNameLong = StringValues.optional(command.orderNameLong(), orderName);
        String createdId = StringValues.optional(command.createdId(), existing == null ? "admin" : existing.createdId());
        String lastChangedId = StringValues.optional(command.lastChangedId(), createdId);

        NormalizedClient normalized = new NormalizedClient(
                clientCode,
                orderName,
                StringValues.normalize(command.orderEngName()),
                StringValues.normalize(command.businessNo()),
                StringValues.normalize(command.corpNo()),
                orderNameLong,
                StringValues.normalize(command.owner()),
                StringValues.normalize(command.businessSectors()),
                StringValues.normalize(command.businessItems()),
                StringValues.normalize(command.orderClass()),
                StringValues.normalize(command.zipCode()),
                StringValues.normalize(command.addr1()),
                StringValues.normalize(command.addr2()),
                StringValues.normalize(command.remark()),
                StringValues.normalize(command.companyType()),
                StringValues.normalize(command.homeUrl()),
                StringValues.normalize(command.otype()),
                createdId,
                lastChangedId
        );
        validateLengths(normalized);
        return normalized;
    }

    private Client toDomain(
            NormalizedClient normalized,
            Instant createdAt,
            String createdId,
            Instant lastChangedAt,
            String lastChangedId
    ) {
        return new Client(
                normalized.clientCode(),
                normalized.orderName(),
                normalized.orderEngName(),
                normalized.businessNo(),
                normalized.corpNo(),
                normalized.orderNameLong(),
                normalized.owner(),
                normalized.businessSectors(),
                normalized.businessItems(),
                normalized.orderClass(),
                normalized.zipCode(),
                normalized.addr1(),
                normalized.addr2(),
                normalized.remark(),
                normalized.companyType(),
                normalized.homeUrl(),
                normalized.otype(),
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }

    private void validateLengths(NormalizedClient value) {
        StringValues.validateMaxLength(value.clientCode(), CODE_MAX_LENGTH, "clientCode");
        StringValues.validateMaxLength(value.orderName(), NAME_MAX_LENGTH, "orderName");
        StringValues.validateMaxLength(value.orderEngName(), NAME_MAX_LENGTH, "orderEngName");
        StringValues.validateMaxLength(value.businessNo(), BUSINESS_NO_MAX_LENGTH, "businessNo");
        StringValues.validateMaxLength(value.corpNo(), CORP_NO_MAX_LENGTH, "corpNo");
        StringValues.validateMaxLength(value.orderNameLong(), NAME_MAX_LENGTH, "orderNameLong");
        StringValues.validateMaxLength(value.owner(), OWNER_MAX_LENGTH, "owner");
        StringValues.validateMaxLength(value.businessSectors(), SHORT_TEXT_MAX_LENGTH, "businessSectors");
        StringValues.validateMaxLength(value.businessItems(), SHORT_TEXT_MAX_LENGTH, "businessItems");
        StringValues.validateMaxLength(value.orderClass(), CODE_MAX_LENGTH, "orderClass");
        StringValues.validateMaxLength(value.zipCode(), CODE_MAX_LENGTH, "zipCode");
        StringValues.validateMaxLength(value.addr1(), ADDRESS_MAX_LENGTH, "addr1");
        StringValues.validateMaxLength(value.addr2(), ADDRESS_MAX_LENGTH, "addr2");
        StringValues.validateMaxLength(value.remark(), REMARK_MAX_LENGTH, "remark");
        StringValues.validateMaxLength(value.companyType(), CODE_MAX_LENGTH, "companyType");
        StringValues.validateMaxLength(value.homeUrl(), URL_MAX_LENGTH, "homeUrl");
        StringValues.validateMaxLength(value.otype(), CODE_MAX_LENGTH, "otype");
        StringValues.validateMaxLength(value.createdId(), AUDIT_ID_MAX_LENGTH, "createdId");
        StringValues.validateMaxLength(value.lastChangedId(), AUDIT_ID_MAX_LENGTH, "lastChangedId");
    }

    private record NormalizedClient(
            String clientCode,
            String orderName,
            String orderEngName,
            String businessNo,
            String corpNo,
            String orderNameLong,
            String owner,
            String businessSectors,
            String businessItems,
            String orderClass,
            String zipCode,
            String addr1,
            String addr2,
            String remark,
            String companyType,
            String homeUrl,
            String otype,
            String createdId,
            String lastChangedId
    ) {
    }
}
