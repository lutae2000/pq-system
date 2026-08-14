package com.cheil.cheil_be.config.logging;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class LogFileDirectoryInitializer {

    private static final Logger log = LoggerFactory.getLogger(LogFileDirectoryInitializer.class);

    private final String logFileName;

    public LogFileDirectoryInitializer(@Value("${logging.file.name:}") String logFileName) {
        this.logFileName = logFileName;
    }

    @PostConstruct
    void ensureLogDirectoryExists() {
        if (logFileName == null || logFileName.isBlank()) {
            return;
        }

        Path logPath = Paths.get(logFileName).toAbsolutePath().normalize();
        Path parent = logPath.getParent();
        if (parent == null) {
            return;
        }

        try {
            Files.createDirectories(parent);
            log.info("Ensured log directory exists: {}", parent);
        } catch (Exception exception) {
            log.warn("Failed to create log directory: {}", parent, exception);
        }
    }
}
