package com.cheil.batch.g2bbidnotice.application.service;

import com.cheil.batch.g2bbidnotice.application.port.out.G2bBidNoticeCleanupPort;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class G2bBidNoticeCleanupServiceTest {
    private final G2bBidNoticeCleanupPort port = mock(G2bBidNoticeCleanupPort.class);
    private final G2bBidNoticeCleanupService service = new G2bBidNoticeCleanupService(port);

    @Test
    void deletesBothTablesWithPolicyMonths() {
        when(port.findRetentionMonths()).thenReturn("3");
        when(port.deleteExpiredCandidates(3)).thenReturn(3);
        when(port.deleteExpiredSyncItems(3)).thenReturn(5);

        var result = service.cleanup();

        assertEquals(3, result.candidates());
        assertEquals(5, result.syncItems());
        var order = inOrder(port);
        order.verify(port).findRetentionMonths();
        order.verify(port).deleteExpiredCandidates(3);
        order.verify(port).deleteExpiredSyncItems(3);
    }

    @Test
    void disabledPolicySkipsDeletion() {
        assertEquals(0, service.cleanup().candidates());
        verify(port, never()).deleteExpiredCandidates(anyInt());
        verify(port, never()).deleteExpiredSyncItems(anyInt());
    }

    @Test
    void invalidPolicyFailsBeforeDeletion() {
        when(port.findRetentionMonths()).thenReturn("0");
        assertThrows(IllegalStateException.class, service::cleanup);
        verify(port, never()).deleteExpiredCandidates(anyInt());
    }
}
