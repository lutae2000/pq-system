package com.cheil.cheil_be.adapter.out.persistence.client;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.domain.client.Client;

@Entity
@Table(name = "clients")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
class ClientEntity {

    @Id
    @Column(name = "client_code", nullable = false, length = 20)
    private String clientCode;

    @Column(name = "order_name", nullable = false, length = 300)
    private String orderName;

    @Column(name = "order_eng_name", length = 300)
    private String orderEngName;

    @Column(name = "business_no", length = 20)
    private String businessNo;

    @Column(name = "corp_no", length = 20)
    private String corpNo;

    @Column(name = "order_name_long", length = 300)
    private String orderNameLong;

    @Column(name = "owner", length = 100)
    private String owner;

    @Column(name = "business_sectors", length = 100)
    private String businessSectors;

    @Column(name = "business_items", length = 100)
    private String businessItems;

    @Column(name = "order_class", length = 20)
    private String orderClass;

    @Column(name = "zip_code", length = 20)
    private String zipCode;

    @Column(name = "addr1", length = 500)
    private String addr1;

    @Column(name = "addr2", length = 500)
    private String addr2;

    @Column(name = "remark", length = 1000)
    private String remark;

    @Column(name = "company_type", length = 20)
    private String companyType;

    @Column(name = "homeurl", length = 500)
    private String homeUrl;

    @Column(name = "otype", length = 20)
    private String otype;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "created_id", length = 100)
    private String createdId;

    @Column(name = "last_changed_at")
    private Instant lastChangedAt;

    @Column(name = "last_changed_id", length = 100)
    private String lastChangedId;

    static ClientEntity from(Client client) {
        return ClientEntity.builder()
                .clientCode(client.clientCode())
                .orderName(client.orderName())
                .orderEngName(client.orderEngName())
                .businessNo(client.businessNo())
                .corpNo(client.corpNo())
                .orderNameLong(client.orderNameLong())
                .owner(client.owner())
                .businessSectors(client.businessSectors())
                .businessItems(client.businessItems())
                .orderClass(client.orderClass())
                .zipCode(client.zipCode())
                .addr1(client.addr1())
                .addr2(client.addr2())
                .remark(client.remark())
                .companyType(client.companyType())
                .homeUrl(client.homeUrl())
                .otype(client.otype())
                .createdAt(client.createdAt())
                .createdId(client.createdId())
                .lastChangedAt(client.lastChangedAt())
                .lastChangedId(client.lastChangedId())
                .build();
    }

    void updateFrom(Client client) {
        clientCode = client.clientCode();
        orderName = client.orderName();
        orderEngName = client.orderEngName();
        businessNo = client.businessNo();
        corpNo = client.corpNo();
        orderNameLong = client.orderNameLong();
        owner = client.owner();
        businessSectors = client.businessSectors();
        businessItems = client.businessItems();
        orderClass = client.orderClass();
        zipCode = client.zipCode();
        addr1 = client.addr1();
        addr2 = client.addr2();
        remark = client.remark();
        companyType = client.companyType();
        homeUrl = client.homeUrl();
        otype = client.otype();
        createdAt = client.createdAt();
        createdId = client.createdId();
        lastChangedAt = client.lastChangedAt();
        lastChangedId = client.lastChangedId();
    }

    Client toDomain() {
        return new Client(
                clientCode,
                orderName,
                orderEngName,
                businessNo,
                corpNo,
                orderNameLong,
                owner,
                businessSectors,
                businessItems,
                orderClass,
                zipCode,
                addr1,
                addr2,
                remark,
                companyType,
                homeUrl,
                otype,
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }
}
