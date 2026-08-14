package com.cheil.cheil_be.common.paging;

import lombok.experimental.UtilityClass;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

/**
 * 페이지 요청 값을 Spring Data {@link PageRequest}로 변환하는 공통 유틸입니다.
 * <p>
 * 컨트롤러에서 들어오는 page, size 값이 null이거나 잘못된 값일 수 있으므로
 * 이 클래스에서 안전한 기본값과 정렬 정보를 함께 묶어 만듭니다.
 */
@UtilityClass
public class PageRequests {

    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 200;

    public static PageRequest of(Integer page) {
        return PageRequest.of(safePage(page), DEFAULT_PAGE_SIZE);
    }

    public static PageRequest of(Integer page, Sort sort) {
        return PageRequest.of(safePage(page), DEFAULT_PAGE_SIZE, sort == null ? Sort.unsorted() : sort);
    }

    public static PageRequest of(Integer page, Integer size) {
        return PageRequest.of(safePage(page), safeSize(size));
    }

    public static PageRequest of(Integer page, Integer size, Sort sort) {
        return PageRequest.of(safePage(page), safeSize(size), sort == null ? Sort.unsorted() : sort);
    }

    private static int safePage(Integer page) {
        return Math.max(page == null ? 0 : page, 0);
    }

    private static int safeSize(Integer size) {
        if (size == null || size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
