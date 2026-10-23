package com.cheil.cheil_be.application.newemployment.port.in;

import java.util.List;

import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusPivot;

public interface NewEmploymentMonthlyStatusUseCase {

    List<NewEmploymentMonthlyStatus> monthlyStatuses(String baseYearMonth);

    List<NewEmploymentMonthlyStatusPivot> monthlyStatusPivot(String baseYearMonth);

    List<NewEmploymentMonthlyStatusPivot> previousYearSamePeriodMonthlyStatusPivot(String baseYearMonth);
}
