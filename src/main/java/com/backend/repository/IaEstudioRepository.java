package com.backend.repository;

import com.backend.cross.AiContentType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import static com.backend.repository.OracleJdbcSupport.*;

/**
 * Repositorio JDBC basado en {@link SimpleJdbcCall} para el paquete Oracle {@code PKG_IA_ESTUDIO}.
 */
@Repository
public class IaEstudioRepository {

    private static final String PKG = "PKG_IA_ESTUDIO";

    private final SimpleJdbcCall fnUsadosHoyIaCall;
    private final SimpleJdbcCall fnCuotaRestanteIaCall;
    private final SimpleJdbcCall fnContarTotalMaterialIaCall;
    private final SimpleJdbcCall fnContarTotalCompartidosIaCall;
    private final SimpleJdbcCall fnObtenerGuardadosIaCall;
    private final SimpleJdbcCall fnAmigosCompartidosIaCall;
    private final SimpleJdbcCall fnCompartidosConmigoIaCall;
    private final SimpleJdbcCall fnObtenerCompartidoIaCall;
    private final SimpleJdbcCall fnEstadisticasIaDesdeCall;
    private final SimpleJdbcCall prCompartirMaterialIaCall;

    public IaEstudioRepository(JdbcTemplate jdbcTemplate) {
        this.fnUsadosHoyIaCall = functionCall(jdbcTemplate, PKG, "fn_usados_hoy_ia");
        this.fnCuotaRestanteIaCall = functionCall(jdbcTemplate, PKG, "fn_cuota_restante_ia");
        this.fnContarTotalMaterialIaCall = functionCall(jdbcTemplate, PKG, "fn_contar_total_material_ia");
        this.fnContarTotalCompartidosIaCall = functionCall(jdbcTemplate, PKG, "fn_contar_total_compartidos_ia");
        this.fnObtenerGuardadosIaCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_obtener_guardados_ia");
        this.fnAmigosCompartidosIaCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_amigos_compartidos_ia",
                (rs, rowNum) -> rs.getString(1)
        );
        this.fnCompartidosConmigoIaCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_compartidos_conmigo_ia");
        this.fnObtenerCompartidoIaCall = functionCall(jdbcTemplate, PKG, "fn_obtener_compartido_ia");
        this.fnEstadisticasIaDesdeCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_estadisticas_ia_desde",
                (rs, rowNum) -> {
                    long id = rs.getLong(1);
                    AiContentType type = AiContentType.valueOf(rs.getString(2));
                    long rawRepoId = rs.getLong(3);
                    Long repoId = rs.wasNull() ? null : rawRepoId;
                    String repoName = rs.getString(4);
                    String subjectName = rs.getString(5);
                    Timestamp ts = rs.getTimestamp(6);
                    return new Object[]{
                            id,
                            type,
                            repoId,
                            repoName,
                            subjectName,
                            ts != null ? ts.toLocalDateTime() : null
                    };
                }
        );
        this.prCompartirMaterialIaCall = procedureCall(jdbcTemplate, PKG, "pr_compartir_material_ia");
    }

    public long usadosHoyIa(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_usuario_id", userId);
        return toLong(fnUsadosHoyIaCall.executeFunction(Long.class, in));
    }

    public long cuotaRestanteIa(Long userId, int dailyLimit) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_usuario_id", userId)
                .addValue("p_limite_diario", dailyLimit);
        return toLong(fnCuotaRestanteIaCall.executeFunction(Long.class, in));
    }

    public long contarTotalMaterialIa() {
        return toLong(fnContarTotalMaterialIaCall.executeFunction(Long.class, EMPTY_PARAMS));
    }

    public long contarTotalCompartidosIa() {
        return toLong(fnContarTotalCompartidosIaCall.executeFunction(Long.class, EMPTY_PARAMS));
    }

    public List<Long> obtenerGuardadosIaIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_usuario_id", userId);
        return executeIdCursor(fnObtenerGuardadosIaCall, in);
    }

    public List<String> amigosCompartidosIa(Long materialId, Long senderId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_material_id", materialId)
                .addValue("p_remitente_id", senderId);
        return executeCursor(fnAmigosCompartidosIaCall, in);
    }

    public List<Long> compartidosConmigoIaIds(Long recipientId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_destinatario_id", recipientId);
        return executeIdCursor(fnCompartidosConmigoIaCall, in);
    }

    public Long obtenerCompartidoIa(Long materialId, Long recipientId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_material_id", materialId)
                .addValue("p_destinatario_id", recipientId);
        return executeNullableLong(fnObtenerCompartidoIaCall, in);
    }

    public List<Object[]> estadisticasIaDesde(LocalDateTime since) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addTimestamp(in, "p_desde", since);
        return executeCursor(fnEstadisticasIaDesdeCall, in);
    }

    public void compartirMaterialIa(Long materialId, Long senderId, Long recipientId, String note) {
        MapSqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_material_id", materialId)
                .addValue("p_remitente_id", senderId)
                .addValue("p_destinatario_id", recipientId);
        addString(in, "p_nota", note);
        prCompartirMaterialIaCall.execute(in);
    }
}
