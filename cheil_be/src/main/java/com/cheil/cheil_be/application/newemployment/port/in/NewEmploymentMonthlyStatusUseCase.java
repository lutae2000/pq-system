package com.cheil.cheil_be.application.newemployment.port.in;

import java.util.List;

public interface NewEmploymentMonthlyStatusUseCase {

    List<NewEmploymentMonthlyStatus> monthlyStatuses(String baseYearMonth);

    List<NewEmploymentMonthlyStatusPivot> monthlyStatusPivot(String baseYearMonth);

    List<NewEmploymentMonthlyStatusPivot> previousYearSamePeriodMonthlyStatusPivot(String baseYearMonth);
}
