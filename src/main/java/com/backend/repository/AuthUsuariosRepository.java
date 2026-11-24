package com.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.backend.repository.OracleJdbcSupport.*;

/**
 * Repositorio JDBC basado en {@link SimpleJdbcCall} para el paquete Oracle {@code PKG_AUTH_USUARIOS}.
 */
@Repository
public class AuthUsuariosRepository {

    private static final String PKG = "PKG_AUTH_USUARIOS";

    private final SimpleJdbcCall fnUsuarioPuedeAccederCall;
    private final SimpleJdbcCall fnSonAmigosMutuosCall;
    private final SimpleJdbcCall fnEsSeguidorUsuarioCall;
    private final SimpleJdbcCall fnContarSeguidoresUsuarioCall;
    private final SimpleJdbcCall fnContarSeguidosUsuarioCall;
    private final SimpleJdbcCall fnContarNotifNoLeidasCall;
    private final SimpleJdbcCall fnContarEstudiantesActivosCall;
    private final SimpleJdbcCall fnObtenerAmigosMutuosCall;
    private final SimpleJdbcCall fnObtenerSeguidosUsuarioCall;
    private final SimpleJdbcCall fnObtenerSeguidoresUsuarioCall;
    private final SimpleJdbcCall fnUsuariosVerificadosCall;
    private final SimpleJdbcCall fnAdminsVerificadosCall;
    private final SimpleJdbcCall fnBuscarEstudiantesActivosCall;
    private final SimpleJdbcCall fnEstudiantesPorSemestreCall;
    private final SimpleJdbcCall fnListarNotificacionesCall;
    private final SimpleJdbcCall fnMateriasInteresUsuarioCall;
    private final SimpleJdbcCall fnContactosUsuarioCall;
    private final SimpleJdbcCall fnBuscarUsuarioPorUsernameCall;
    private final SimpleJdbcCall fnBuscarUsuarioPorCorreoCall;
    private final SimpleJdbcCall fnExisteUsernameOtroCall;
    private final SimpleJdbcCall fnObtenerUltimoOtpActivoCall;
    private final SimpleJdbcCall fnObtenerTokenResetHashCall;
    private final SimpleJdbcCall fnObtenerRolPorNombreCall;
    private final SimpleJdbcCall fnObtenerNotificacionUsrCall;
    private final SimpleJdbcCall prEliminarContactosUsuarioCall;
    private final SimpleJdbcCall prEliminarMateriasInteresCall;
    private final SimpleJdbcCall prToggleSeguirUsuarioCall;
    private final SimpleJdbcCall prInvalidarCodigosOtpCall;
    private final SimpleJdbcCall prInvalidarTokensResetCall;
    private final SimpleJdbcCall prLimpiarCredencialesExpiradasCall;
    private final SimpleJdbcCall prLimpiarUsuariosNoVerifCall;
    private final SimpleJdbcCall prMarcarNotificacionesLeidasCall;

    public AuthUsuariosRepository(JdbcTemplate jdbcTemplate) {
        this.fnUsuarioPuedeAccederCall = functionCall(jdbcTemplate, PKG, "fn_usuario_puede_acceder");
        this.fnSonAmigosMutuosCall = functionCall(jdbcTemplate, PKG, "fn_son_amigos_mutuos");
        this.fnEsSeguidorUsuarioCall = functionCall(jdbcTemplate, PKG, "fn_es_seguidor_usuario");
        this.fnContarSeguidoresUsuarioCall = functionCall(jdbcTemplate, PKG, "fn_contar_seguidores_usuario");
        this.fnContarSeguidosUsuarioCall = functionCall(jdbcTemplate, PKG, "fn_contar_seguidos_usuario");
        this.fnContarNotifNoLeidasCall = functionCall(jdbcTemplate, PKG, "fn_contar_notif_no_leidas");
        this.fnContarEstudiantesActivosCall = functionCall(jdbcTemplate, PKG, "fn_contar_estudiantes_activos");
        this.fnObtenerAmigosMutuosCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_obtener_amigos_mutuos");
        this.fnObtenerSeguidosUsuarioCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_obtener_seguidos_usuario");
        this.fnObtenerSeguidoresUsuarioCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_obtener_seguidores_usuario");
        this.fnUsuariosVerificadosCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_usuarios_verificados");
        this.fnAdminsVerificadosCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_admins_verificados");
        this.fnBuscarEstudiantesActivosCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_buscar_estudiantes_activos");
        this.fnEstudiantesPorSemestreCall = cursorFunctionCall(
                jdbcTemplate, PKG, "fn_estudiantes_por_semestre",
                (rs, rowNum) -> new Object[]{rs.getInt(1), rs.getLong(2)}
        );
        this.fnListarNotificacionesCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_listar_notificaciones");
        this.fnMateriasInteresUsuarioCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_materias_interes_usuario");
        this.fnContactosUsuarioCall = idCursorFunctionCall(jdbcTemplate, PKG, "fn_contactos_usuario");
        this.fnBuscarUsuarioPorUsernameCall = functionCall(jdbcTemplate, PKG, "fn_buscar_usuario_por_username");
        this.fnBuscarUsuarioPorCorreoCall = functionCall(jdbcTemplate, PKG, "fn_buscar_usuario_por_correo");
        this.fnExisteUsernameOtroCall = functionCall(jdbcTemplate, PKG, "fn_existe_username_otro");
        this.fnObtenerUltimoOtpActivoCall = functionCall(jdbcTemplate, PKG, "fn_obtener_ultimo_otp_activo");
        this.fnObtenerTokenResetHashCall = functionCall(jdbcTemplate, PKG, "fn_obtener_token_reset_hash");
        this.fnObtenerRolPorNombreCall = functionCall(jdbcTemplate, PKG, "fn_obtener_rol_por_nombre");
        this.fnObtenerNotificacionUsrCall = functionCall(jdbcTemplate, PKG, "fn_obtener_notificacion_usr");
        this.prEliminarContactosUsuarioCall = procedureCall(jdbcTemplate, PKG, "pr_eliminar_contactos_usuario");
        this.prEliminarMateriasInteresCall = procedureCall(jdbcTemplate, PKG, "pr_eliminar_materias_interes");
        this.prToggleSeguirUsuarioCall = procedureCall(jdbcTemplate, PKG, "pr_toggle_seguir_usuario");
        this.prInvalidarCodigosOtpCall = procedureCall(jdbcTemplate, PKG, "pr_invalidar_codigos_otp");
        this.prInvalidarTokensResetCall = procedureCall(jdbcTemplate, PKG, "pr_invalidar_tokens_reset");
        this.prLimpiarCredencialesExpiradasCall = procedureCall(jdbcTemplate, PKG, "pr_limpiar_credenciales_expiradas");
        this.prLimpiarUsuariosNoVerifCall = procedureCall(jdbcTemplate, PKG, "pr_limpiar_usuarios_no_verif");
        this.prMarcarNotificacionesLeidasCall = procedureCall(jdbcTemplate, PKG, "pr_marcar_notificaciones_leidas");
    }

    public int usuarioPuedeAcceder(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return toInt(fnUsuarioPuedeAccederCall.executeFunction(Integer.class, in));
    }

    public int sonAmigosMutuos(Long user1Id, Long user2Id) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_usuario1_id", user1Id)
                .addValue("p_usuario2_id", user2Id);
        return toInt(fnSonAmigosMutuosCall.executeFunction(Integer.class, in));
    }

    public int esSeguidorUsuario(Long followerId, Long followedId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_seguidor_id", followerId)
                .addValue("p_seguido_id", followedId);
        return toInt(fnEsSeguidorUsuarioCall.executeFunction(Integer.class, in));
    }

    public long contarSeguidoresUsuario(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return toLong(fnContarSeguidoresUsuarioCall.executeFunction(Long.class, in));
    }

    public long contarSeguidosUsuario(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return toLong(fnContarSeguidosUsuarioCall.executeFunction(Long.class, in));
    }

    public long contarNotifNoLeidas(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return toLong(fnContarNotifNoLeidasCall.executeFunction(Long.class, in));
    }

    public long contarEstudiantesActivos() {
        return toLong(fnContarEstudiantesActivosCall.executeFunction(Long.class, EMPTY_PARAMS));
    }

    public List<Long> obtenerAmigosMutuosIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeIdCursor(fnObtenerAmigosMutuosCall, in);
    }

    public List<Long> obtenerSeguidosUsuarioIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeIdCursor(fnObtenerSeguidosUsuarioCall, in);
    }

    public List<Long> obtenerSeguidoresUsuarioIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeIdCursor(fnObtenerSeguidoresUsuarioCall, in);
    }

    public List<Long> usuariosVerificadosIds() {
        return executeIdCursor(fnUsuariosVerificadosCall, EMPTY_PARAMS);
    }

    public List<Long> adminsVerificadosIds() {
        return executeIdCursor(fnAdminsVerificadosCall, EMPTY_PARAMS);
    }

    public List<Long> buscarEstudiantesActivosIds(String pattern, Integer semester, int limit) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addString(in, "p_patron", pattern);
        addInt(in, "p_semestre", semester);
        in.addValue("p_limite", limit);
        return executeIdCursor(fnBuscarEstudiantesActivosCall, in);
    }

    public Map<Integer, Long> estudiantesPorSemestre() {
        List<Object[]> rows = executeCursor(fnEstudiantesPorSemestreCall, EMPTY_PARAMS);
        Map<Integer, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((Integer) row[0], (Long) row[1]);
        }
        return counts;
    }

    public List<Long> listarNotificacionesIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeIdCursor(fnListarNotificacionesCall, in);
    }

    public List<Long> materiasInteresUsuarioIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeIdCursor(fnMateriasInteresUsuarioCall, in);
    }

    public List<Long> contactosUsuarioIds(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeIdCursor(fnContactosUsuarioCall, in);
    }

    public Long buscarUsuarioPorUsername(String username) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_username", username);
        return executeNullableLong(fnBuscarUsuarioPorUsernameCall, in);
    }

    public Long buscarUsuarioPorCorreo(String email) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_correo", email);
        return executeNullableLong(fnBuscarUsuarioPorCorreoCall, in);
    }

    public int existeUsernameOtro(String username, Long excludeId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_username", username)
                .addValue("p_excluir_id", excludeId);
        return toInt(fnExisteUsernameOtroCall.executeFunction(Integer.class, in));
    }

    public Long obtenerUltimoOtpActivo(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        return executeNullableLong(fnObtenerUltimoOtpActivoCall, in);
    }

    public Long obtenerTokenResetHash(String tokenHash) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_token_hash", tokenHash);
        return executeNullableLong(fnObtenerTokenResetHashCall, in);
    }

    public Long obtenerRolPorNombre(String name) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_nombre", name);
        return executeNullableLong(fnObtenerRolPorNombreCall, in);
    }

    public Long obtenerNotificacionUsr(Long notificationId, Long userId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_notificacion_id", notificationId)
                .addValue("p_usuario_id", userId);
        return executeNullableLong(fnObtenerNotificacionUsrCall, in);
    }

    public void eliminarContactosUsuario(Long userId) {
        prEliminarContactosUsuarioCall.execute(new MapSqlParameterSource().addValue("p_usuario_id", userId));
    }

    public void eliminarMateriasInteres(Long userId) {
        prEliminarMateriasInteresCall.execute(new MapSqlParameterSource().addValue("p_usuario_id", userId));
    }

    public int[] toggleSeguirUsuario(Long followerId, Long followedId) {
        SqlParameterSource in = new MapSqlParameterSource()
                .addValue("p_seguidor_id", followerId)
                .addValue("p_seguido_id", followedId);
        Map<String, Object> out = prToggleSeguirUsuarioCall.execute(in);
        return new int[]{toInt(out.get("p_siguiendo")), toInt(out.get("p_es_mutuo"))};
    }

    public void invalidarCodigosOtp(Long userId) {
        prInvalidarCodigosOtpCall.execute(new MapSqlParameterSource().addValue("p_usuario_id", userId));
    }

    public void invalidarTokensReset(Long userId) {
        prInvalidarTokensResetCall.execute(new MapSqlParameterSource().addValue("p_usuario_id", userId));
    }

    public int[] limpiarCredencialesExpiradas(LocalDateTime cutoff) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addTimestamp(in, "p_corte", cutoff);
        Map<String, Object> out = prLimpiarCredencialesExpiradasCall.execute(in);
        return new int[]{toInt(out.get("p_codigos_borrados")), toInt(out.get("p_tokens_borrados"))};
    }

    public int limpiarUsuariosNoVerif(LocalDateTime cutoff) {
        MapSqlParameterSource in = new MapSqlParameterSource();
        addTimestamp(in, "p_corte", cutoff);
        Map<String, Object> out = prLimpiarUsuariosNoVerifCall.execute(in);
        return toInt(out.get("p_borrados"));
    }

    public int marcarNotificacionesLeidas(Long userId) {
        SqlParameterSource in = new MapSqlParameterSource().addValue("p_usuario_id", userId);
        Map<String, Object> out = prMarcarNotificacionesLeidasCall.execute(in);
        return toInt(out.get("p_actualizadas"));
    }
}
