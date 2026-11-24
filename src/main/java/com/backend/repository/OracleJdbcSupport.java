package com.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;

import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Utilidades compartidas para invocar paquetes, funciones y procedimientos de Oracle
 * mediante {@link SimpleJdbcCall}.
 */
final class OracleJdbcSupport {

    static final SqlParameterSource EMPTY_PARAMS = new MapSqlParameterSource();

    private OracleJdbcSupport() {
    }

    static SimpleJdbcCall functionCall(JdbcTemplate jdbcTemplate, String catalogName, String functionName) {
        return new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(catalogName)
                .withFunctionName(functionName);
    }

    static <T> SimpleJdbcCall cursorFunctionCall(
            JdbcTemplate jdbcTemplate,
            String catalogName,
            String functionName,
            RowMapper<T> rowMapper
    ) {
        return new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(catalogName)
                .withFunctionName(functionName)
                .returningResultSet("return", rowMapper);
    }

    static SimpleJdbcCall idCursorFunctionCall(JdbcTemplate jdbcTemplate, String catalogName, String functionName) {
        return cursorFunctionCall(jdbcTemplate, catalogName, functionName, (rs, rowNum) -> rs.getLong(1));
    }

    static SimpleJdbcCall procedureCall(JdbcTemplate jdbcTemplate, String catalogName, String procedureName) {
        return new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(catalogName)
                .withProcedureName(procedureName);
    }

    @SuppressWarnings("unchecked")
    static <T> List<T> executeCursor(SimpleJdbcCall call, SqlParameterSource in) {
        Map<String, Object> out = call.execute(in);
        List<T> rows = (List<T>) out.get("return");
        return rows != null ? rows : List.of();
    }

    static List<Long> executeIdCursor(SimpleJdbcCall call, SqlParameterSource in) {
        return executeCursor(call, in);
    }

    static MapSqlParameterSource addString(MapSqlParameterSource in, String name, String value) {
        String clean = (value == null || value.isBlank()) ? null : value;
        return in.addValue(name, clean, Types.VARCHAR);
    }

    static MapSqlParameterSource addLong(MapSqlParameterSource in, String name, Long value) {
        return in.addValue(name, value, Types.NUMERIC);
    }

    static MapSqlParameterSource addInt(MapSqlParameterSource in, String name, Integer value) {
        return in.addValue(name, value, Types.NUMERIC);
    }

    static MapSqlParameterSource addTimestamp(MapSqlParameterSource in, String name, LocalDateTime value) {
        return in.addValue(name, value != null ? Timestamp.valueOf(value) : null, Types.TIMESTAMP);
    }

    static int toInt(Object value) {
        return value instanceof Number n ? n.intValue() : 0;
    }

    static long toLong(Object value) {
        return value instanceof Number n ? n.longValue() : 0L;
    }

    static Long toNullableLong(Object value) {
        return value instanceof Number n ? n.longValue() : null;
    }

    static Long executeNullableLong(SimpleJdbcCall call, SqlParameterSource in) {
        return toNullableLong(call.executeFunction(Object.class, in));
    }

    static double toDouble(Object value) {
        return value instanceof Number n ? n.doubleValue() : 0.0;
    }
}
