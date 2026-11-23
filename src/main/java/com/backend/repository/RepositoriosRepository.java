package com.backend.repository;

import com.backend.cross.ResourceType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

import static com.backend.repository.OracleJdbcSupport.*;

/**
 * Repositorio JDBC basado en {@link SimpleJdbcCall} para el paquete Oracle {@code PKG_REPOSITORIOS}.
 */
@Repository
public class RepositoriosRepository {

    private static final String PKG = "PKG_REPOSITORIOS";

    private static final RowMapper<Object[]> RESOURCE_STATS_ROW_MAPPER = (rs, rowNum) -> {
        Timestamp ts = rs.getTimestamp(7);
        return new Object[]{
                rs.getLong(1),
                rs.getString(2),
                ResourceType.valueOf(rs.getString(3)),
                rs.getString(4),
                rs.getInt(5),
                rs.getInt(6),
                ts != null ? ts.toLocalDateTime() : null,
                rs.getLong(8),
                rs.getString(9)
        };
    };

    private final SimpleJdbcCall fnContarRecursosPublicadosCall;
    private final SimpleJdbcCall fnContarSeguidoresRepoCall;
    private final SimpleJdbcCall fnUsuarioDioLikeRepoCall;
    private final SimpleJdbcCall fnUsuarioSigueRepoCall;
    private final SimpleJdbcCall fnEstadoColaboradorRepoCall;
    private final SimpleJdbcCall fnEsColaboradorAceptadoCall;
    private final SimpleJdbcCall fnContarReposAutorCall;
    private final SimpleJdbcCall fnContarRecursosAutorCall;
    private final SimpleJdbcCall fnContarTotalRepositoriosCall;
    private final SimpleJdbcCall fnBuscarRepositoriosCall;
    private final SimpleJdbcCall fnRepositoriosPorAutorCall;
    private final SimpleJdbcCall fnRepositoriosSeguidosCall;
    private final SimpleJdbcCall fnSeguidoresVerificadosRepoCall;
    private final SimpleJdbcCall fnColaboradoresRepositorioCall;
    private final SimpleJdbcCall fnColaboracionesUsuarioCall;
    private final SimpleJdbcCall fnRecursosPorRepositorioCall;
    private final SimpleJdbcCall fnRecursosPorAutorCall;
    private final SimpleJdbcCall fnBuscarRecursosCall;
    private final SimpleJdbcCall fnEstadisticasRecursosPubCall;
    private final SimpleJdbcCall fnEstadisticasRecursosAutorCall;
    private final SimpleJdbcCall fnListarMateriasCatalogoCall;
    private final SimpleJdbcCall fnObtenerEtiquetaNombreCall;
    private final SimpleJdbcCall fnObtenerColaboradorIdCall;
    private final SimpleJdbcCall fnObtenerColabPorUsernameCall;
    private final SimpleJdbcCall prToggleMeGustaRepoCall;
    private final SimpleJdbcCall prToggleSeguirRepoCall;
    private final SimpleJdbcCall prIncrementarVistaCall;
    private final SimpleJdbcCall prIncrementarDescargaCall;
    private final SimpleJdbcCall prEliminarRepositorioCascadaCall;
    private final SimpleJdbcCall prEliminarRecursoCascadaCall;

    public RepositoriosRepository(JdbcTemplate jdbcTemplate) {
        this.fnContarRecursosPublicadosCall = functionCall(jdbcTemplate, PKG, "fn_contar_recursos_publicados");
        this.fnContarSeguidoresRepoCall = functionCall(jdbcTemplate, PKG, "fn_contar_seguidores_repo");
        this.fnUsuarioDioLikeRepoCall = functionCall(jdbcTemplate, PKG, "fn_usuario_dio_like_repo");
        this.fnUsuarioSigueRepoCall = functionCall(jdbcTemplate, PKG, "fn_usuario_sigue_repo");
        this.fnEstadoColaboradorRepoCall = functionCall(jdbcTemplate, PKG, "fn_estado_colaborador_repo");
        this.fnEsColaboradorAceptadoCall = functionCall(jdbcTemplate, PKG, "fn_es_colaborador_aceptado");
        this.fnContarReposAutorCall = functionCall(jdbcTemplate, PKG, "fn_contar_repos_autor");
        this.fnContarRecursosAutorCall = functionCall(jdbcTemplate, PKG, "fn_contar_recursos_autor");
        this.fnContarTotalRepositoriosCall = functionCall(jdbcTemplate, PKG, "fn_contar_total_repositorios");
        this.fnBuscarRepositoriosCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_buscar_repositorios");
        this.fnRepositoriosPorAutorCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_repositorios_por_autor");
        this.fnRepositoriosSeguidosCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_repositorios_seguidos");
        this.fnSeguidoresVerificadosRepoCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_seguidores_verificados_repo");
        this.fnColaboradoresRepositorioCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_colaboradores_repositorio");
        this.fnColaboracionesUsuarioCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_colaboraciones_usuario");
        this.fnRecursosPorRepositorioCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_recursos_por_repositorio");
        this.fnRecursosPorAutorCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_recursos_por_autor");
        this.fnBuscarRecursosCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_buscar_recursos");
        this.fnEstadisticasRecursosPubCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_estadisticas_recursos_pub", RESOURCE_STATS_ROW_MAPPER
        );
        this.fnEstadisticasRecursosAutorCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_estadisticas_recursos_autor", RESOURCE_STATS_ROW_MAPPER
        );
        this.fnListarMateriasCatalogoCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_listar_materias_catalogo");
        this.fnObtenerEtiquetaNombreCall = functionCall(jdbcTemplate, PKG, "fn_obtener_etiqueta_nombre");
        this.fnObtenerColaboradorIdCall = functionCall(jdbcTemplate, PKG, "fn_obtener_colaborador_id");
        this.fnObtenerColabPorUsernameCall = functionCall(jdbcTemplate, PKG, "fn_obtener_colab_por_username");
        this.prToggleMeGustaRepoCall = procedureCall(jdbcTemplate, PKG, "pr_toggle_me_gusta_repo");
        this.prToggleSeguirRepoCall = procedureCall(jdbcTemplate, PKG, "pr_toggle_seguir_repo");
        this.prIncrementarVistaCall = procedureCall(jdbcTemplate, PKG, "pr_incrementar_vista");
        this.prIncrementarDescargaCall = procedureCall(jdbcTemplate, PKG, "pr_incrementar_descarga");
        this.prEliminarRepositorioCascadaCall = procedureCall(jdbcTemplate, PKG, "pr_eliminar_repositorio_cascada");
        this.prEliminarRecursoCascadaCall = procedureCall(jdbcTemplate, PKG, "pr_eliminar_recurso_cascada");
    }

    public int contarRecursosPublicados(Long repositoryId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_repositorio_id", repositoryId);
        return toInt(fnContarRecursosPublicadosCall.executeFunction(Integer.class, in));
    }

    public long contarSeguidoresRepo(Long repositoryId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_repositorio_id", repositoryId);
        return toLong(fnContarSeguidoresRepoCall.executeFunction(Long.class, in));
    }

    public int usuarioDioLikeRepo(Long repositoryId, Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId)
                .addValue("p_usuario_id", userId);
        return toInt(fnUsuarioDioLikeRepoCall.executeFunction(Integer.class, in));
    }

    public int usuarioSigueRepo(Long repositoryId, Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId)
                .addValue("p_usuario_id", userId);
        return toInt(fnUsuarioSigueRepoCall.executeFunction(Integer.class, in));
    }

    public String estadoColaboradorRepo(Long repositoryId, Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId)
                .addValue("p_usuario_id", userId);
        return fnEstadoColaboradorRepoCall.executeFunction(String.class, in);
    }

    public int esColaboradorAceptado(Long repositoryId, Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId)
                .addValue("p_usuario_id", userId);
        return toInt(fnEsColaboradorAceptadoCall.executeFunction(Integer.class, in));
    }

    public long contarReposAutor(Long authorId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_autor_id", authorId);
        return toLong(fnContarReposAutorCall.executeFunction(Long.class, in));
    }

    public long contarRecursosAutor(Long authorId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_autor_id", authorId);
        return toLong(fnContarRecursosAutorCall.executeFunction(Long.class, in));
    }

    public long contarTotalRepositorios() {
        return toLong(fnContarTotalRepositoriosCall.executeFunction(Long.class, EMPTY_PARAMS));
    }

    public List<Long> buscarRepositoriosIds(Long subjectId, Integer semester, String search, String order) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addLong(in, "p_materia_id", subjectId);
        addInt(in, "p_semestre", semester);
        addString(in, "p_texto", search);
        addString(in, "p_orden", order);
        return executeIdCursor(fnBuscarRepositoriosCall, in);
    }

    public List<Long> repositoriosPorAutorIds(String username) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addString(in, "p_username", username);
        return executeIdCursor(fnRepositoriosPorAutorCall, in);
    }

    public List<Long> repositoriosSeguidosIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeIdCursor(fnRepositoriosSeguidosCall, in);
    }

    public List<Long> seguidoresVerificadosRepoIds(Long repositoryId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_repositorio_id", repositoryId);
        return executeIdCursor(fnSeguidoresVerificadosRepoCall, in);
    }

    public List<Long> colaboradoresRepositorioIds(Long repositoryId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_repositorio_id", repositoryId);
        return executeIdCursor(fnColaboradoresRepositorioCall, in);
    }

    public List<Long> colaboracionesUsuarioIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeIdCursor(fnColaboracionesUsuarioCall, in);
    }

    public List<Long> recursosPorRepositorioIds(Long repositoryId, Integer term) {
        MapSqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId);
        addInt(in, "p_corte", term);
        return executeIdCursor(fnRecursosPorRepositorioCall, in);
    }

    public List<Long> recursosPorAutorIds(String username) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addString(in, "p_username", username);
        return executeIdCursor(fnRecursosPorAutorCall, in);
    }

    public List<Long> buscarRecursosIds(
            String text,
            Long subjectId,
            Integer semester,
            Integer term,
            String type,
            String topic,
            String order
    ) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addString(in, "p_texto", text);
        addLong(in, "p_materia_id", subjectId);
        addInt(in, "p_semestre", semester);
        addInt(in, "p_corte", term);
        addString(in, "p_tipo", type);
        addString(in, "p_tema", topic);
        addString(in, "p_orden", order);
        return executeIdCursor(fnBuscarRecursosCall, in);
    }

    public List<Object[]> estadisticasRecursosPub() {
        return executeCursor(fnEstadisticasRecursosPubCall, EMPTY_PARAMS);
    }

    public List<Object[]> estadisticasRecursosAutor(Long authorId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_autor_id", authorId);
        return executeCursor(fnEstadisticasRecursosAutorCall, in);
    }

    public List<Long> listarMateriasCatalogoIds(Long semesterId, Integer semesterNumber) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addLong(in, "p_semestre_id", semesterId);
        addInt(in, "p_numero_semestre", semesterNumber);
        return executeIdCursor(fnListarMateriasCatalogoCall, in);
    }

    public Long obtenerEtiquetaNombre(String name) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_nombre", name);
        return fnObtenerEtiquetaNombreCall.executeFunction(Long.class, in);
    }

    public Long obtenerColaboradorId(Long repositoryId, Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId)
                .addValue("p_usuario_id", userId);
        return fnObtenerColaboradorIdCall.executeFunction(Long.class, in);
    }

    public Long obtenerColabPorUsername(Long repositoryId, String username) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId)
                .addValue("p_username", username);
        return fnObtenerColabPorUsernameCall.executeFunction(Long.class, in);
    }

    public int[] toggleMeGustaRepo(Long repositoryId, Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId)
                .addValue("p_usuario_id", userId);
        Map<String, Object> out = prToggleMeGustaRepoCall.execute(in);
        return new int[]{toInt(out.get("p_liked")), toInt(out.get("p_total_likes"))};
    }

    public long[] toggleSeguirRepo(Long repositoryId, Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_repositorio_id", repositoryId)
                .addValue("p_usuario_id", userId);
        Map<String, Object> out = prToggleSeguirRepoCall.execute(in);
        return new long[]{toLong(out.get("p_followed")), toLong(out.get("p_total_seguidores"))};
    }

    public void incrementarVista(Long resourceId) {
        prIncrementarVistaCall.execute(new MapSqlParameterSource().addValue("p_recurso_id", resourceId));
    }

    public void incrementarDescarga(Long resourceId) {
        prIncrementarDescargaCall.execute(new MapSqlParameterSource().addValue("p_recurso_id", resourceId));
    }

    public void eliminarRepositorioCascada(Long repositoryId) {
        prEliminarRepositorioCascadaCall.execute(new MapSqlParameterSource().addValue("p_repositorio_id", repositoryId));
    }

    public void eliminarRecursoCascada(Long resourceId) {
        prEliminarRecursoCascadaCall.execute(new MapSqlParameterSource().addValue("p_recurso_id", resourceId));
    }
}
