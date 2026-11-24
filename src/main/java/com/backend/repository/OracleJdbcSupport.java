package com.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Utilidades compartidas para invocar paquetes, funciones y procedimientos de Oracle
 * mediante {@link SimpleJdbcCall} sin acceso a metadatos del diccionario ({@code ALL_ARGUMENTS})
 * y con {@code fetchSize=500} en cursores {@code SYS_REFCURSOR}.
 */
final class OracleJdbcSupport {

    static final SqlParameterSource EMPTY_PARAMS = new MapSqlParameterSource();
    static final int CURSOR_FETCH_SIZE = 500;
    private static final int ORACLE_CURSOR_SQL_TYPE = -10; // OracleTypes.CURSOR

    private OracleJdbcSupport() {
    }

    private static void configureJdbcTemplate(JdbcTemplate jdbcTemplate) {
        if (jdbcTemplate.getFetchSize() < CURSOR_FETCH_SIZE) {
            jdbcTemplate.setFetchSize(CURSOR_FETCH_SIZE);
        }
    }

    private static <T> RowMapper<T> prefetchRowMapper(RowMapper<T> delegate) {
        return (rs, rowNum) -> {
            if (rowNum == 0) {
                try {
                    rs.setFetchSize(CURSOR_FETCH_SIZE);
                } catch (SQLException ignored) {
                }
            }
            return delegate.mapRow(rs, rowNum);
        };
    }

    static SqlParameter inNumeric(String name) {
        return new SqlParameter(name, Types.NUMERIC);
    }

    static SqlParameter inVarchar(String name) {
        return new SqlParameter(name, Types.VARCHAR);
    }

    static SqlParameter inTimestamp(String name) {
        return new SqlParameter(name, Types.TIMESTAMP);
    }

    static SqlOutParameter outNumeric(String name) {
        return new SqlOutParameter(name, Types.NUMERIC);
    }

    static SimpleJdbcCall functionCall(
            JdbcTemplate jdbcTemplate,
            String catalogName,
            String functionName,
            int returnSqlType,
            SqlParameter... inParams
    ) {
        configureJdbcTemplate(jdbcTemplate);
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(catalogName)
                .withFunctionName(functionName)
                .withoutProcedureColumnMetaDataAccess();
        call.addDeclaredParameter(new SqlOutParameter("return", returnSqlType));
        for (SqlParameter param : inParams) {
            call.addDeclaredParameter(param);
        }
        return call;
    }

    static SimpleJdbcCall functionCall(
            JdbcTemplate jdbcTemplate,
            String catalogName,
            String functionName,
            SqlParameter... inParams
    ) {
        return functionCall(jdbcTemplate, catalogName, functionName, Types.NUMERIC, inParams);
    }

    static <T> SimpleJdbcCall cursorFunctionCall(
            JdbcTemplate jdbcTemplate,
            String catalogName,
            String functionName,
            RowMapper<T> rowMapper,
            SqlParameter... inParams
    ) {
        configureJdbcTemplate(jdbcTemplate);
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(catalogName)
                .withFunctionName(functionName)
                .withoutProcedureColumnMetaDataAccess();
        call.addDeclaredParameter(new SqlOutParameter("return", ORACLE_CURSOR_SQL_TYPE, prefetchRowMapper(rowMapper)));
        for (SqlParameter param : inParams) {
            call.addDeclaredParameter(param);
        }
        return call;
    }

    static SimpleJdbcCall idCursorFunctionCall(
            JdbcTemplate jdbcTemplate,
            String catalogName,
            String functionName,
            SqlParameter... inParams
    ) {
        return cursorFunctionCall(jdbcTemplate, catalogName, functionName, (rs, rowNum) -> rs.getLong(1), inParams);
    }

    static SimpleJdbcCall procedureCall(
            JdbcTemplate jdbcTemplate,
            String catalogName,
            String procedureName,
            SqlParameter... params
    ) {
        configureJdbcTemplate(jdbcTemplate);
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(catalogName)
                .withProcedureName(procedureName)
                .withoutProcedureColumnMetaDataAccess();
        for (SqlParameter param : params) {
            call.addDeclaredParameter(param);
        }
        return call;
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

    static int executeInt(SimpleJdbcCall call, SqlParameterSource in) {
        return toInt(call.executeFunction(Object.class, in));
    }

    static long executeLong(SimpleJdbcCall call, SqlParameterSource in) {
        return toLong(call.executeFunction(Object.class, in));
    }

    static Long executeNullableLong(SimpleJdbcCall call, SqlParameterSource in) {
        return toNullableLong(call.executeFunction(Object.class, in));
    }

    static double toDouble(Object value) {
        return value instanceof Number n ? n.doubleValue() : 0.0;
    }

    static double executeDouble(SimpleJdbcCall call, SqlParameterSource in) {
        return toDouble(call.executeFunction(Object.class, in));
    }
}
