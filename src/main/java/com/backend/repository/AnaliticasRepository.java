package com.backend.repository;

import com.backend.cross.InteractionType;
import com.backend.cross.ResourceType;
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
 * Repositorio JDBC basado en {@link SimpleJdbcCall} para el paquete Oracle {@code PKG_ANALITICAS}.
 */
@Repository
public class AnaliticasRepository {

    private static final String PKG = "PKG_ANALITICAS";

    private final SimpleJdbcCall fnIndiceDemandaMateriaCall;
    private final SimpleJdbcCall fnContarUsuariosActivosCall;
    private final SimpleJdbcCall fnTopTerminosBusquedaCall;
    private final SimpleJdbcCall fnHistorialUsuarioCall;
    private final SimpleJdbcCall fnContarPorMateriaYTipoCall;
    private final SimpleJdbcCall fnConsultasUsuarioMateriaCall;
    private final SimpleJdbcCall fnActividadRecursosAutorCall;
    private final SimpleJdbcCall fnActividadUsuariosDesdeCall;
    private final SimpleJdbcCall fnInteraccionesRangoCall;
    private final SimpleJdbcCall fnMetricasMasConsultadasCall;
    private final SimpleJdbcCall fnObtenerMetricaMateriaCall;
    private final SimpleJdbcCall prRecalcularMetricaDemandaCall;

    public AnaliticasRepository(JdbcTemplate jdbcTemplate) {
        this.fnIndiceDemandaMateriaCall = functionCall(
                jdbcTemplate, PKG, "fn_indice_demanda_materia",
                inNumeric("p_materia_id"), inTimestamp("p_desde"), inTimestamp("p_hasta")
        );
        this.fnContarUsuariosActivosCall = functionCall(
                jdbcTemplate, PKG, "fn_contar_usuarios_activos",
                inTimestamp("p_desde")
        );
        this.fnTopTerminosBusquedaCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_top_terminos_busqueda",
                (rs, rowNum) -> new Object[]{rs.getString(1), rs.getLong(2)},
                inTimestamp("p_desde"), inNumeric("p_limite")
        );
        this.fnHistorialUsuarioCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_historial_usuario",
                (rs, rowNum) -> {
                    Timestamp ts = rs.getTimestamp(4);
                    String rawType = rs.getString(5);
                    return new Object[]{
                            rs.getLong(1),
                            rs.getString(2),
                            rs.getString(3),
                            ts != null ? ts.toLocalDateTime() : null,
                            rawType != null ? ResourceType.valueOf(rawType) : ResourceType.NOTE
                    };
                },
                inNumeric("p_usuario_id"), inNumeric("p_limite")
        );
        this.fnContarPorMateriaYTipoCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_contar_por_materia_y_tipo",
                (rs, rowNum) -> new Object[]{
                        rs.getLong(1),
                        InteractionType.valueOf(rs.getString(2)),
                        rs.getLong(3)
                },
                inTimestamp("p_desde"), inTimestamp("p_hasta")
        );
        this.fnConsultasUsuarioMateriaCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_consultas_usuario_materia",
                (rs, rowNum) -> new Object[]{rs.getString(1), rs.getLong(2)},
                inNumeric("p_usuario_id")
        );
        this.fnActividadRecursosAutorCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_actividad_recursos_autor",
                (rs, rowNum) -> {
                    Timestamp ts = rs.getTimestamp(2);
                    return new Object[]{
                            InteractionType.valueOf(rs.getString(1)),
                            ts != null ? ts.toLocalDateTime() : null
                    };
                },
                inNumeric("p_autor_id"), inTimestamp("p_desde")
        );
        this.fnActividadUsuariosDesdeCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_actividad_usuarios_desde",
                (rs, rowNum) -> {
                    long uid = rs.getLong(1);
                    Long userId = rs.wasNull() ? null : uid;
                    Timestamp ts = rs.getTimestamp(2);
                    return new Object[]{
                            userId,
                            ts != null ? ts.toLocalDateTime() : null
                    };
                },
                inTimestamp("p_desde")
        );
        this.fnInteraccionesRangoCall = idCursorFunctionCall(
                jdbcTemplate, PKG, "fn_interacciones_rango",
                inTimestamp("p_desde"), inTimestamp("p_hasta")
        );
        this.fnMetricasMasConsultadasCall = idCursorFunctionCall(
                jdbcTemplate, PKG, "fn_metricas_mas_consultadas",
                inVarchar("p_periodo"), inNumeric("p_limite")
        );
        this.fnObtenerMetricaMateriaCall = functionCall(
                jdbcTemplate, PKG, "fn_obtener_metrica_materia",
                inNumeric("p_materia_id"), inVarchar("p_periodo")
        );
        this.prRecalcularMetricaDemandaCall = procedureCall(
                jdbcTemplate, PKG, "pr_recalcular_metrica_demanda",
                inVarchar("p_periodo"), inTimestamp("p_desde"), inTimestamp("p_hasta")
        );
    }

    public double indiceDemandaMateria(Long subjectId, LocalDateTime from, LocalDateTime to) {
        MapSqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_materia_id", subjectId);
        addTimestamp(in, "p_desde", from);
        addTimestamp(in, "p_hasta", to);
        return executeDouble(fnIndiceDemandaMateriaCall, in);
    }

    public long contarUsuariosActivos(LocalDateTime since) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addTimestamp(in, "p_desde", since);
        return executeLong(fnContarUsuariosActivosCall, in);
    }

    public List<Object[]> topTerminosBusqueda(LocalDateTime since, int limit) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addTimestamp(in, "p_desde", since);
        in.addValue("p_limite", limit);
        return executeCursor(fnTopTerminosBusquedaCall, in);
    }

    public List<Object[]> historialUsuario(Long userId, int limit) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_usuario_id", userId)
                .addValue("p_limite", limit);
        return executeCursor(fnHistorialUsuarioCall, in);
    }

    public List<Object[]> contarPorMateriaYTipo(LocalDateTime from, LocalDateTime to) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addTimestamp(in, "p_desde", from);
        addTimestamp(in, "p_hasta", to);
        return executeCursor(fnContarPorMateriaYTipoCall, in);
    }

    public List<Object[]> consultasUsuarioMateria(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_usuario_id", userId);
        return executeCursor(fnConsultasUsuarioMateriaCall, in);
    }

    public List<Object[]> actividadRecursosAutor(Long authorId, LocalDateTime since) {
        MapSqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_autor_id", authorId);
        addTimestamp(in, "p_desde", since);
        return executeCursor(fnActividadRecursosAutorCall, in);
    }

    public List<Object[]> actividadUsuariosDesde(LocalDateTime since) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addTimestamp(in, "p_desde", since);
        return executeCursor(fnActividadUsuariosDesdeCall, in);
    }

    public List<Long> interaccionesRangoIds(LocalDateTime from, LocalDateTime to) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addTimestamp(in, "p_desde", from);
        addTimestamp(in, "p_hasta", to);
        return executeIdCursor(fnInteraccionesRangoCall, in);
    }

    public List<Long> metricasMasConsultadasIds(String period, int limit) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_periodo", period)
                .addValue("p_limite", limit);
        return executeIdCursor(fnMetricasMasConsultadasCall, in);
    }

    public Long obtenerMetricaMateria(Long subjectId, String academicPeriod) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_materia_id", subjectId)
                .addValue("p_periodo", academicPeriod);
        return executeNullableLong(fnObtenerMetricaMateriaCall, in);
    }

    public void recalcularMetricaDemanda(String period, LocalDateTime from, LocalDateTime to) {
        MapSqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_periodo", period);
        addTimestamp(in, "p_desde", from);
        addTimestamp(in, "p_hasta", to);
        prRecalcularMetricaDemandaCall.execute(in);
    }
}
