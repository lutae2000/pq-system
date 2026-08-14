package com.cheil.cheil_be.config.observability;

import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class RepositoryObservationAspect {

    private final ObservationRegistry observationRegistry;

    @Around("execution(* com.cheil.cheil_be.adapter.out.persistence..*Repository.*(..))")
    public Object observeRepositoryCall(ProceedingJoinPoint joinPoint) throws Throwable {
        String repositoryName = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        Observation observation = Observation.createNotStarted("repository.query", observationRegistry)
                .contextualName(repositoryName + "." + methodName)
                .lowCardinalityKeyValue("repository", repositoryName)
                .lowCardinalityKeyValue("method", methodName);

        observation.start();
        try (Observation.Scope scope = observation.openScope()) {
            Object result = joinPoint.proceed();
            observation.stop();
            return result;
        } catch (Throwable throwable) {
            observation.error(throwable);
            observation.stop();
            throw throwable;
        }
    }
}
