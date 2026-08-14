package com.cheil.cheil_be.application.commondepartment.service;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.cheil.cheil_be.application.cache.port.out.CacheStore;
import com.cheil.cheil_be.common.cache.DepartmentCacheKeys;
import com.cheil.cheil_be.config.commondepartment.AppDepartmentCacheProperties;
import com.cheil.cheil_be.domain.commondepartment.Department;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentCacheService {

    private static final Type DEPARTMENT_LIST_TYPE = new TypeToken<List<Department>>() {
    }.getType();
    private static final Type DEPARTMENT_TYPE = new TypeToken<Department>() {
    }.getType();

    private final CacheStore cacheStore;
    private final AppDepartmentCacheProperties properties;
    @Qualifier("departmentCacheExecutor")
    private final TaskExecutor departmentCacheExecutor;
    @Qualifier("cacheGson")
    private final Gson gson;

    /**
     * Returns the full department list from Redis when available.
     * DB remains the fallback source when Redis is slow, unavailable, or empty.
     */
    public List<Department> getOrLoadAll(Supplier<List<Department>> dbLoader) {
        String cacheKey = DepartmentCacheKeys.departments();
        return readCachedDepartments(cacheKey).orElseGet(() -> {
            List<Department> departments = dbLoader.get();
            cacheAfterCompletion(() -> writeCache(cacheKey, departments));
            return departments;
        });
    }

    /**
     * Returns one department by code from Redis when available.
     */
    public Optional<Department> getOrLoadByDeptCode(String deptCode, Supplier<Optional<Department>> dbLoader) {
        String cacheKey = DepartmentCacheKeys.departmentByCode(deptCode);
        Optional<Department> cached = readCachedDepartment(cacheKey);
        if (cached.isPresent()) {
            return cached;
        }

        Optional<Department> loaded = dbLoader.get();
        loaded.ifPresent(department -> cacheAfterCompletion(() -> writeCache(cacheKey, department)));
        return loaded;
    }

    /**
     * Refreshes both the list cache and the item cache after a successful write.
     */
    public void refreshAfterCommit(Department department, Supplier<List<Department>> dbLoader) {
        cacheAfterCompletion(() -> {
            writeCache(DepartmentCacheKeys.departmentByCode(department.deptCode()), department);
            writeCache(DepartmentCacheKeys.departments(), dbLoader.get());
        });
    }

    private Optional<List<Department>> readCachedDepartments(String cacheKey) {
        CompletableFuture<Optional<String>> future = CompletableFuture.supplyAsync(
                () -> cacheStore.get(cacheKey),
                departmentCacheExecutor
        );

        try {
            Optional<String> cachedValue = future.get(properties.readTimeout().toMillis(), TimeUnit.MILLISECONDS);
            return cachedValue.flatMap(value -> deserializeDepartments(cacheKey, value));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            future.cancel(true);
            return Optional.empty();
        } catch (ExecutionException | TimeoutException ex) {
            future.cancel(true);
            return Optional.empty();
        }
    }

    private Optional<Department> readCachedDepartment(String cacheKey) {
        CompletableFuture<Optional<String>> future = CompletableFuture.supplyAsync(
                () -> cacheStore.get(cacheKey),
                departmentCacheExecutor
        );

        try {
            Optional<String> cachedValue = future.get(properties.readTimeout().toMillis(), TimeUnit.MILLISECONDS);
            return cachedValue.flatMap(value -> deserializeDepartment(cacheKey, value));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            future.cancel(true);
            return Optional.empty();
        } catch (ExecutionException | TimeoutException ex) {
            future.cancel(true);
            return Optional.empty();
        }
    }

    private Optional<List<Department>> deserializeDepartments(String cacheKey, String cachedValue) {
        try {
            return Optional.ofNullable(gson.fromJson(cachedValue, DEPARTMENT_LIST_TYPE));
        } catch (JsonSyntaxException ex) {
            log.debug("Failed to deserialize department cache entry. Evicting cache key {}.", cacheKey, ex);
            evictQuietly(cacheKey);
            return Optional.empty();
        }
    }

    private Optional<Department> deserializeDepartment(String cacheKey, String cachedValue) {
        try {
            return Optional.ofNullable(gson.fromJson(cachedValue, DEPARTMENT_TYPE));
        } catch (JsonSyntaxException ex) {
            log.debug("Failed to deserialize department cache entry. Evicting cache key {}.", cacheKey, ex);
            evictQuietly(cacheKey);
            return Optional.empty();
        }
    }

    private void writeCache(String cacheKey, List<Department> departments) {
        try {
            cacheStore.put(cacheKey, gson.toJson(departments), properties.ttl());
        } catch (RuntimeException ex) {
            log.debug("Failed to serialize departments for cache.", ex);
        }
    }

    private void writeCache(String cacheKey, Department department) {
        try {
            cacheStore.put(cacheKey, gson.toJson(department), properties.ttl());
        } catch (RuntimeException ex) {
            log.debug("Failed to serialize department for cache.", ex);
        }
    }

    private void evictQuietly(String cacheKey) {
        try {
            cacheStore.evict(cacheKey);
        } catch (RuntimeException ex) {
            log.debug("Failed to evict department cache key {}.", cacheKey, ex);
        }
    }

    private void cacheAfterCompletion(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
            return;
        }

        action.run();
    }
}
