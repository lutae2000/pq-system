package com.cheil.cheil_be.application.newemployment.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static com.cheil.cheil_be.application.common.validation.InputValues.yearMonth;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusPivot;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatusUseCase;
import com.cheil.cheil_be.application.newemployment.port.out.NewEmploymentMonthlyStatusReader;

@Service
@RequiredArgsConstructor
public class NewEmploymentMonthlyStatusQueryService implements NewEmploymentMonthlyStatusUseCase {

    private static final String GLOBAL_DEPARTMENT_CODE = "ALL";
    private static final int MONTHLY_STATUS_WINDOW = 12;
    private static final DateTimeFormatter YEAR_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    private final NewEmploymentMonthlyStatusReader reader;

    @Override
    @Transactional(readOnly = true)
    public List<NewEmploymentMonthlyStatus> monthlyStatuses(String baseYearMonth) {
        return reader.findMonthlyStatuses(normalizeYearMonthAnchor(baseYearMonth), GLOBAL_DEPARTMENT_CODE, MONTHLY_STATUS_WINDOW);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewEmploymentMonthlyStatusPivot> monthlyStatusPivot(String baseYearMonth) {
        return reader.findMonthlyStatusPivot(normalizeYearMonthAnchor(baseYearMonth), false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewEmploymentMonthlyStatusPivot> previousYearSamePeriodMonthlyStatusPivot(String baseYearMonth) {
        return reader.findMonthlyStatusPivot(normalizeYearMonthAnchor(baseYearMonth), true);
    }

    private String normalizeYearMonthAnchor(String value) {
        String normalized = yearMonth(value, "baseYearMonth", false);
        return normalized == null ? LocalDate.now().format(YEAR_MONTH_FORMATTER) : normalized;
    }
}
