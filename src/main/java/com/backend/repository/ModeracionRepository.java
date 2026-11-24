package com.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

import static com.backend.repository.OracleJdbcSupport.*;

/**
 * Repositorio JDBC basado en {@link SimpleJdbcCall} para el paquete Oracle {@code PKG_MODERACION}.
 */
@Repository
public class ModeracionRepository {

    private static final String PKG = "PKG_MODERACION";

    private final SimpleJdbcCall fnExisteReporteActivoCall;
    private final SimpleJdbcCall fnResumenReportesCall;
    private final SimpleJdbcCall fnListarReportesCall;
    private final SimpleJdbcCall fnObtenerDecisionCall;
    private final SimpleJdbcCall fnSancionesUsuarioCall;
    private final SimpleJdbcCall prResolverReporteCall;
    private final SimpleJdbcCall prToggleSuspensionUsuarioCall;

    public ModeracionRepository(JdbcTemplate jdbcTemplate) {
        this.fnExisteReporteActivoCall = functionCall(jdbcTemplate, PKG, "fn_existe_reporte_activo");
        this.fnResumenReportesCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_resumen_reportes",
                (rs, rowNum) -> new Object[]{rs.getString(1), rs.getString(2), rs.getLong(3)}
        );
        this.fnListarReportesCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_listar_reportes");
        this.fnObtenerDecisionCall = functionCall(jdbcTemplate, PKG, "fn_obtener_decision_reporte");
        this.fnSancionesUsuarioCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_sanciones_usuario");
        this.prResolverReporteCall = procedureCall(jdbcTemplate, PKG, "pr_resolver_reporte");
        this.prToggleSuspensionUsuarioCall = procedureCall(jdbcTemplate, PKG, "pr_toggle_suspension_usuario");
    }

    public int existeReporteActivo(Long reporterId, String targetType, Long targetId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_reportante_id", reporterId)
                .addValue("p_tipo_objetivo", targetType)
                .addValue("p_objetivo_id", targetId);
        return toInt(fnExisteReporteActivoCall.executeFunction(Integer.class, in));
    }

    public List<Object[]> resumenReportes() {
        return executeCursor(fnResumenReportesCall, EMPTY_PARAMS);
    }

    public List<Long> listarReportesIds() {
        return executeIdCursor(fnListarReportesCall, EMPTY_PARAMS);
    }

    public Long obtenerDecisionReporte(Long reportId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_reporte_id", reportId);
        return executeNullableLong(fnObtenerDecisionCall, in);
    }

    public List<Long> sancionesUsuarioIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_usuario_id", userId);
        return executeIdCursor(fnSancionesUsuarioCall, in);
    }

    public void resolverReporte(Long reportId, Long moderatorId, String action, String justification) {
        MapSqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_reporte_id", reportId)
                .addValue("p_moderador_id", moderatorId)
                .addValue("p_accion", action);
        addString(in, "p_justificacion", justification);
        prResolverReporteCall.execute(in);
    }

    public boolean toggleSuspensionUsuario(Long userId, Long moderatorId, String reason, String note) {
        MapSqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_usuario_id", userId)
                .addValue("p_moderador_id", moderatorId);
        addString(in, "p_motivo", reason);
        addString(in, "p_nota", note);
        Map<String, Object> out = prToggleSuspensionUsuarioCall.execute(in);
        return toInt(out.get("p_suspendido")) == 1;
    }
}
