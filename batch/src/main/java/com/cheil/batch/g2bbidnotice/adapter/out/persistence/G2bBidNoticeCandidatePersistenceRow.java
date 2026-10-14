package com.cheil.batch.g2bbidnotice.adapter.out.persistence;

import com.cheil.batch.g2bbidnotice.domain.G2bBidNotice;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;

@Getter
public class G2bBidNoticeCandidatePersistenceRow {

    private final G2bBidNotice notice;
    private final Instant fetchedAt;
    private final String requestFrom;
    private final String requestTo;
    private final Map<Integer, String> fileNames;
    private final Map<Integer, String> fileUrls;

    public G2bBidNoticeCandidatePersistenceRow(
            G2bBidNotice notice,
            Instant fetchedAt,
            String requestFrom,
            String requestTo,
            Map<Integer, String> fileNames,
            Map<Integer, String> fileUrls
    ) {
        this.notice = notice;
        this.fetchedAt = fetchedAt;
        this.requestFrom = requestFrom;
        this.requestTo = requestTo;
        this.fileNames = fileNames;
        this.fileUrls = fileUrls;
    }

    public String getFileName1() { return fileNames.get(1); }
    public String getFileName2() { return fileNames.get(2); }
    public String getFileName3() { return fileNames.get(3); }
    public String getFileName4() { return fileNames.get(4); }
    public String getFileName5() { return fileNames.get(5); }
    public String getFileName6() { return fileNames.get(6); }
    public String getFileName7() { return fileNames.get(7); }
    public String getFileName8() { return fileNames.get(8); }
    public String getFileName9() { return fileNames.get(9); }
    public String getFileName10() { return fileNames.get(10); }

    public String getFileUrl1() { return fileUrls.get(1); }
    public String getFileUrl2() { return fileUrls.get(2); }
    public String getFileUrl3() { return fileUrls.get(3); }
    public String getFileUrl4() { return fileUrls.get(4); }
    public String getFileUrl5() { return fileUrls.get(5); }
    public String getFileUrl6() { return fileUrls.get(6); }
    public String getFileUrl7() { return fileUrls.get(7); }
    public String getFileUrl8() { return fileUrls.get(8); }
    public String getFileUrl9() { return fileUrls.get(9); }
    public String getFileUrl10() { return fileUrls.get(10); }
}
