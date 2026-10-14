package com.cheil.batch.g2bbidnotice.adapter.out.persistence;

import com.cheil.batch.g2bbidnotice.domain.G2bBidNotice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface G2bBidNoticeCandidateMapper {

    List<String> findSyncKeys(@Param("notices") List<G2bBidNotice> notices);

    int upsertSyncItems(@Param("rows") List<G2bBidNoticeSyncPersistenceRow> rows);

    int upsertAll(List<G2bBidNoticeCandidatePersistenceRow> rows);

    int linkImportedNotices();

    int createChangeNotices();
}
