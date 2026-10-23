package com.cheil.cheil_be.application.systempermission.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.systempermission.model.SystemMenu;
import com.cheil.cheil_be.application.systempermission.model.SystemMenuCommand;
import com.cheil.cheil_be.application.systempermission.port.out.SystemMenuRepository;

@ExtendWith(MockitoExtension.class)
class SystemMenuServiceTest {

    @Mock
    private SystemMenuRepository repository;

    @InjectMocks
    private SystemMenuService service;

    @Test
    void trimsMenuValuesBeforeDelegatingSave() {
        SystemMenuCommand command = new SystemMenuCommand(
                " MENU ", " 메뉴 ", " PARENT ", " /menu ", " PAGE ", 1, true, true, " 설명 ");
        SystemMenu saved = new SystemMenu("MENU", "메뉴", "PARENT", "/menu", "PAGE", 1, true, true, "설명");
        when(repository.save(any())).thenReturn(saved);

        assertThat(service.saveMenu(command)).isEqualTo(saved);
        verify(repository).save(new SystemMenuCommand("MENU", "메뉴", "PARENT", "/menu", "PAGE", 1, true, true, "설명"));
    }

    @Test
    void rejectsMissingMenuCode() {
        SystemMenuCommand command = new SystemMenuCommand(" ", "메뉴", null, null, "PAGE", 0, true, true, null);

        assertThatThrownBy(() -> service.saveMenu(command))
                .isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).errorType())
                .isEqualTo(ApplicationErrorType.BAD_REQUEST);
        verify(repository, never()).save(any());
    }

    @Test
    void reportsMissingMenuAsNotFound() {
        when(repository.findByCode("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findMenu("MISSING"))
                .isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).errorType())
                .isEqualTo(ApplicationErrorType.NOT_FOUND);
    }
}
