package com.cheil.batch.common.batch;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.launch.JobOperator;

import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BatchJobRunnerTest {

    @Mock
    private JobOperator jobOperator;

    @Mock
    private Job job;

    @InjectMocks
    private BatchJobRunner batchJobRunner;

    @Test
    void runningJobIsNotStartedAgain() throws Exception {
        when(job.getName()).thenReturn("testJob");
        when(jobOperator.getRunningExecutions("testJob")).thenReturn(Set.of(1L));

        batchJobRunner.run(job, "testJob");

        verify(jobOperator, never()).start(any(Job.class), any());
    }

    @Test
    void startsJobWhenThereIsNoRunningExecution() throws Exception {
        when(job.getName()).thenReturn("testJob");
        when(jobOperator.getRunningExecutions("testJob")).thenReturn(Set.of());
        when(jobOperator.start(any(Job.class), any())).thenReturn(mock(JobExecution.class));

        batchJobRunner.run(job, "testJob");

        verify(jobOperator).start(any(Job.class), any());
    }
}
