package com.cheil.cheil_be.domain.notice;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공지사항 값 객체이다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notice {

    private boolean active;
    private String content;
    private String exposureEndAt;
    private String exposureStartAt;
    private String id;
    private boolean important;
    private String publishAt;
    private String title;
    private String targetPath;
}
