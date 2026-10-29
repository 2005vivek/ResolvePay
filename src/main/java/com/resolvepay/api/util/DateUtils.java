package com.resolvepay.api.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;

public final class DateUtils {

    private static final Logger log = LoggerFactory.getLogger(DateUtils.class);

    private DateUtils() {}

    /**
     * Parses PayPal ISO-8601/RFC-3339 timestamps (with or without offset/Z).
     * Returns null if missing or unparseable, preserving safe fail-closed behavior.
     */
    public static LocalDateTime parsePayPalTimestamp(String timestampStr) {
        if (timestampStr == null || timestampStr.isBlank()) {
            return null;
        }

        String trimmed = timestampStr.trim();
        try {
            return OffsetDateTime.parse(trimmed).toLocalDateTime();
        } catch (DateTimeParseException e1) {
            try {
                return Instant.parse(trimmed).atZone(ZoneOffset.UTC).toLocalDateTime();
            } catch (DateTimeParseException e2) {
                try {
                    return LocalDateTime.parse(trimmed);
                } catch (Exception e3) {
                    log.warn("Unable to parse PayPal timestamp '{}': {}", trimmed, e3.getMessage());
                    return null;
                }
            }
        }
    }
}
