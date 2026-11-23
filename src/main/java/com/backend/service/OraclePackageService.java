package com.backend.service;

import com.backend.cross.AiContentType;
import com.backend.cross.InteractionType;
import com.backend.cross.ResourceType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Puente centralizado de invocación a las Funciones (fn_*) y Procedimientos (pr_*)
 * encapsulados en los 5 Packages de Oracle Database:
 * PKG_ANALITICAS, PKG_AUTH_USUARIOS, PKG_IA_ESTUDIO, PKG_MODERACION y PKG_REPOSITORIOS.
 */
@Service
public class OraclePackageService {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Ordena una colección de entidades cargadas por ID preservando el orden exacto
     * retornado por el cursor (SYS_REFCURSOR) de la función de Oracle.
     */
    public <T> List<T> orderByIds(List<Long> orderedIds, Collection<T> entities, Function<T, Long> idExtractor) {
        if (orderedIds == null || orderedIds.isEmpty() || entities == null || entities.isEmpty()) {
            return List.of();
        }
        Map<Long, T> byId = new HashMap<>(entities.size());
        for (T entity : entities) {
            byId.put(idExtractor.apply(entity), entity);
        }
        List<T> result = new ArrayList<>(orderedIds.size());
        for (Long id : orderedIds) {
            T match = byId.get(id);
            if (match != null) {
                result.add(match);
            }
        }
        return result;
    }

    // =========================================================================
    // 1. PKG_ANALITICAS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Object[]> fnTopTerminosBusqueda(LocalDateTime since, int limit) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_ANALITICAS.fn_top_terminos_busqueda(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setTimestamp(cs, 2, since);
                cs.setInt(3, limit);
                cs.execute();
                List<Object[]> rows = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        rows.add(new Object[]{rs.getString(1), rs.getLong(2)});
                    }
                }
                return rows;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnHistorialUsuario(Long userId, int limit) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_ANALITICAS.fn_historial_usuario(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.setLong(2, userId);
                cs.setInt(3, limit);
                cs.execute();
                List<Object[]> rows = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        Timestamp ts = rs.getTimestamp(4);
                        String rawType = rs.getString(5);
                        rows.add(new Object[]{
                                rs.getLong(1),
                                rs.getString(2),
                                rs.getString(3),
                                ts != null ? ts.toLocalDateTime() : null,
                                rawType != null ? ResourceType.valueOf(rawType) : ResourceType.NOTE
                        });
                    }
                }
                return rows;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnContarPorMateriaYTipo(LocalDateTime from, LocalDateTime to) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_ANALITICAS.fn_contar_por_materia_y_tipo(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setTimestamp(cs, 2, from);
                setTimestamp(cs, 3, to);
                cs.execute();
                List<Object[]> rows = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        rows.add(new Object[]{
                                rs.getLong(1),
                                InteractionType.valueOf(rs.getString(2)),
                                rs.getLong(3)
                        });
                    }
                }
                return rows;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnConsultasUsuarioMateria(Long userId) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_ANALITICAS.fn_consultas_usuario_materia(?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.setLong(2, userId);
                cs.execute();
                List<Object[]> rows = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        rows.add(new Object[]{rs.getString(1), rs.getLong(2)});
                    }
                }
                return rows;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnActividadRecursosAutor(Long authorId, LocalDateTime since) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_ANALITICAS.fn_actividad_recursos_autor(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.setLong(2, authorId);
                setTimestamp(cs, 3, since);
                cs.execute();
                List<Object[]> rows = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        Timestamp ts = rs.getTimestamp(2);
                        rows.add(new Object[]{
                                InteractionType.valueOf(rs.getString(1)),
                                ts != null ? ts.toLocalDateTime() : null
                        });
                    }
                }
                return rows;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnActividadUsuariosDesde(LocalDateTime since) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_ANALITICAS.fn_actividad_usuarios_desde(?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setTimestamp(cs, 2, since);
                cs.execute();
                List<Object[]> rows = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        long uid = rs.getLong(1);
                        Long userId = rs.wasNull() ? null : uid;
                        Timestamp ts = rs.getTimestamp(2);
                        rows.add(new Object[]{
                                userId,
                                ts != null ? ts.toLocalDateTime() : null
                        });
                    }
                }
                return rows;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnInteraccionesRangoIds(LocalDateTime from, LocalDateTime to) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_ANALITICAS.fn_interacciones_rango(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setTimestamp(cs, 2, from);
                setTimestamp(cs, 3, to);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnMetricasMasConsultadasIds(String period, int limit) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_ANALITICAS.fn_metricas_mas_consultadas(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.setString(2, period);
                cs.setInt(3, limit);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional
    public void prRecalcularMetricaDemanda(String period, LocalDateTime from, LocalDateTime to) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_ANALITICAS.pr_recalcular_metrica_demanda(?, ?, ?) }")) {
                cs.setString(1, period);
                setTimestamp(cs, 2, from);
                setTimestamp(cs, 3, to);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    // =========================================================================
    // 2. PKG_AUTH_USUARIOS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Long> fnObtenerAmigosMutuosIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_AUTH_USUARIOS.fn_obtener_amigos_mutuos(?) }", userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnObtenerSeguidosUsuarioIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_AUTH_USUARIOS.fn_obtener_seguidos_usuario(?) }", userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnObtenerSeguidoresUsuarioIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_AUTH_USUARIOS.fn_obtener_seguidores_usuario(?) }", userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnUsuariosVerificadosIds() {
        return callNoArgIdCursor("{ ? = call PKG_AUTH_USUARIOS.fn_usuarios_verificados() }");
    }

    @Transactional(readOnly = true)
    public List<Long> fnAdminsVerificadosIds() {
        return callNoArgIdCursor("{ ? = call PKG_AUTH_USUARIOS.fn_admins_verificados() }");
    }

    @Transactional(readOnly = true)
    public List<Long> fnBuscarEstudiantesActivosIds(String pattern, Integer semester, int limit) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_AUTH_USUARIOS.fn_buscar_estudiantes_activos(?, ?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setString(cs, 2, pattern);
                setInt(cs, 3, semester);
                cs.setInt(4, limit);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public Map<Integer, Long> fnEstudiantesPorSemestre() {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_AUTH_USUARIOS.fn_estudiantes_por_semestre() }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.execute();
                Map<Integer, Long> counts = new HashMap<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        counts.put(rs.getInt(1), rs.getLong(2));
                    }
                }
                return counts;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnListarNotificacionesIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_AUTH_USUARIOS.fn_listar_notificaciones(?) }", userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnMateriasInteresUsuarioIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_AUTH_USUARIOS.fn_materias_interes_usuario(?) }", userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnContactosUsuarioIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_AUTH_USUARIOS.fn_contactos_usuario(?) }", userId);
    }

    @Transactional
    public int[] prToggleSeguirUsuario(Long followerId, Long followedId) {
        entityManager.flush();
        int[] res = session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_AUTH_USUARIOS.pr_toggle_seguir_usuario(?, ?, ?, ?) }")) {
                cs.setLong(1, followerId);
                cs.setLong(2, followedId);
                cs.registerOutParameter(3, Types.NUMERIC);
                cs.registerOutParameter(4, Types.NUMERIC);
                cs.execute();
                return new int[]{cs.getInt(3), cs.getInt(4)};
            }
        });
        entityManager.clear();
        return res;
    }

    @Transactional
    public void prInvalidarCodigosOtp(Long userId) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_AUTH_USUARIOS.pr_invalidar_codigos_otp(?) }")) {
                cs.setLong(1, userId);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    @Transactional
    public void prInvalidarTokensReset(Long userId) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_AUTH_USUARIOS.pr_invalidar_tokens_reset(?) }")) {
                cs.setLong(1, userId);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    @Transactional
    public int[] prLimpiarCredencialesExpiradas(LocalDateTime cutoff) {
        entityManager.flush();
        int[] out = session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_AUTH_USUARIOS.pr_limpiar_credenciales_expiradas(?, ?, ?) }")) {
                setTimestamp(cs, 1, cutoff);
                cs.registerOutParameter(2, Types.NUMERIC);
                cs.registerOutParameter(3, Types.NUMERIC);
                cs.execute();
                return new int[]{cs.getInt(2), cs.getInt(3)};
            }
        });
        entityManager.clear();
        return out;
    }

    @Transactional
    public int prLimpiarUsuariosNoVerif(LocalDateTime cutoff) {
        entityManager.flush();
        int deleted = session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_AUTH_USUARIOS.pr_limpiar_usuarios_no_verif(?, ?) }")) {
                setTimestamp(cs, 1, cutoff);
                cs.registerOutParameter(2, Types.NUMERIC);
                cs.execute();
                return cs.getInt(2);
            }
        });
        entityManager.clear();
        return deleted;
    }

    @Transactional
    public int prMarcarNotificacionesLeidas(Long userId) {
        entityManager.flush();
        int updated = session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_AUTH_USUARIOS.pr_marcar_notificaciones_leidas(?, ?) }")) {
                cs.setLong(1, userId);
                cs.registerOutParameter(2, Types.NUMERIC);
                cs.execute();
                return cs.getInt(2);
            }
        });
        entityManager.clear();
        return updated;
    }

    @Transactional
    public void prEliminarContactosUsuario(Long userId) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_AUTH_USUARIOS.pr_eliminar_contactos_usuario(?) }")) {
                cs.setLong(1, userId);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    @Transactional
    public void prEliminarMateriasInteres(Long userId) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_AUTH_USUARIOS.pr_eliminar_materias_interes(?) }")) {
                cs.setLong(1, userId);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    // =========================================================================
    // 3. PKG_IA_ESTUDIO
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Long> fnObtenerGuardadosIaIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_IA_ESTUDIO.fn_obtener_guardados_ia(?) }", userId);
    }

    @Transactional(readOnly = true)
    public List<String> fnAmigosCompartidosIa(Long materialId, Long senderId) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_IA_ESTUDIO.fn_amigos_compartidos_ia(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.setLong(2, materialId);
                cs.setLong(3, senderId);
                cs.execute();
                List<String> usernames = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        usernames.add(rs.getString(1));
                    }
                }
                return usernames;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnCompartidosConmigoIaIds(Long recipientId) {
        return callSingleIdParamCursor("{ ? = call PKG_IA_ESTUDIO.fn_compartidos_conmigo_ia(?) }", recipientId);
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnEstadisticasIaDesde(LocalDateTime since) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_IA_ESTUDIO.fn_estadisticas_ia_desde(?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setTimestamp(cs, 2, since);
                cs.execute();
                List<Object[]> rows = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        long id = rs.getLong(1);
                        AiContentType type = AiContentType.valueOf(rs.getString(2));
                        long rawRepoId = rs.getLong(3);
                        Long repoId = rs.wasNull() ? null : rawRepoId;
                        String repoName = rs.getString(4);
                        String subjectName = rs.getString(5);
                        Timestamp ts = rs.getTimestamp(6);
                        rows.add(new Object[]{
                                id,
                                type,
                                repoId,
                                repoName,
                                subjectName,
                                ts != null ? ts.toLocalDateTime() : null
                        });
                    }
                }
                return rows;
            }
        });
    }

    @Transactional
    public void prCompartirMaterialIa(Long materialId, Long senderId, Long recipientId, String note) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_IA_ESTUDIO.pr_compartir_material_ia(?, ?, ?, ?) }")) {
                cs.setLong(1, materialId);
                cs.setLong(2, senderId);
                cs.setLong(3, recipientId);
                setString(cs, 4, note);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    // =========================================================================
    // 4. PKG_MODERACION
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Object[]> fnResumenReportes() {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_MODERACION.fn_resumen_reportes() }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.execute();
                List<Object[]> rows = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs != null && rs.next()) {
                        rows.add(new Object[]{rs.getString(1), rs.getString(2), rs.getLong(3)});
                    }
                }
                return rows;
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnListarReportesIds() {
        return callNoArgIdCursor("{ ? = call PKG_MODERACION.fn_listar_reportes() }");
    }

    @Transactional(readOnly = true)
    public List<Long> fnSancionesUsuarioIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_MODERACION.fn_sanciones_usuario(?) }", userId);
    }

    @Transactional
    public void prResolverReporte(Long reportId, Long moderatorId, String action, String justification) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_MODERACION.pr_resolver_reporte(?, ?, ?, ?) }")) {
                cs.setLong(1, reportId);
                cs.setLong(2, moderatorId);
                cs.setString(3, action);
                setString(cs, 4, justification);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    @Transactional
    public boolean prToggleSuspensionUsuario(Long userId, Long moderatorId, String reason, String note) {
        entityManager.flush();
        int suspended = session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_MODERACION.pr_toggle_suspension_usuario(?, ?, ?, ?, ?) }")) {
                cs.setLong(1, userId);
                cs.setLong(2, moderatorId);
                setString(cs, 3, reason);
                setString(cs, 4, note);
                cs.registerOutParameter(5, Types.NUMERIC);
                cs.execute();
                return cs.getInt(5);
            }
        });
        entityManager.clear();
        return suspended == 1;
    }

    // =========================================================================
    // 5. PKG_REPOSITORIOS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Long> fnBuscarRepositoriosIds(Long subjectId, Integer semester, String search, String order) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_REPOSITORIOS.fn_buscar_repositorios(?, ?, ?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setLong(cs, 2, subjectId);
                setInt(cs, 3, semester);
                setString(cs, 4, search);
                setString(cs, 5, order);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnRepositoriosPorAutorIds(String username) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_REPOSITORIOS.fn_repositorios_por_autor(?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setString(cs, 2, username);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnRepositoriosSeguidosIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_REPOSITORIOS.fn_repositorios_seguidos(?) }", userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnSeguidoresVerificadosRepoIds(Long repositoryId) {
        return callSingleIdParamCursor("{ ? = call PKG_REPOSITORIOS.fn_seguidores_verificados_repo(?) }", repositoryId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnColaboradoresRepositorioIds(Long repositoryId) {
        return callSingleIdParamCursor("{ ? = call PKG_REPOSITORIOS.fn_colaboradores_repositorio(?) }", repositoryId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnColaboracionesUsuarioIds(Long userId) {
        return callSingleIdParamCursor("{ ? = call PKG_REPOSITORIOS.fn_colaboraciones_usuario(?) }", userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnRecursosPorRepositorioIds(Long repositoryId, Integer term) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_REPOSITORIOS.fn_recursos_por_repositorio(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.setLong(2, repositoryId);
                setInt(cs, 3, term);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnRecursosPorAutorIds(String username) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_REPOSITORIOS.fn_recursos_por_autor(?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setString(cs, 2, username);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnBuscarRecursosIds(
            String text,
            Long subjectId,
            Integer semester,
            Integer term,
            String type,
            String topic,
            String order
    ) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_REPOSITORIOS.fn_buscar_recursos(?, ?, ?, ?, ?, ?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setString(cs, 2, text);
                setLong(cs, 3, subjectId);
                setInt(cs, 4, semester);
                setInt(cs, 5, term);
                setString(cs, 6, type);
                setString(cs, 7, topic);
                setString(cs, 8, order);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnEstadisticasRecursosPub() {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_REPOSITORIOS.fn_estadisticas_recursos_pub() }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.execute();
                return readResourceStatsCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnEstadisticasRecursosAutor(Long authorId) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_REPOSITORIOS.fn_estadisticas_recursos_autor(?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.setLong(2, authorId);
                cs.execute();
                return readResourceStatsCursor(cs, 1);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Long> fnListarMateriasCatalogoIds(Long semesterId, Integer semesterNumber) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ ? = call PKG_REPOSITORIOS.fn_listar_materias_catalogo(?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setLong(cs, 2, semesterId);
                setInt(cs, 3, semesterNumber);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    @Transactional
    public int[] prToggleMeGustaRepo(Long repositoryId, Long userId) {
        entityManager.flush();
        int[] res = session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_REPOSITORIOS.pr_toggle_me_gusta_repo(?, ?, ?, ?) }")) {
                cs.setLong(1, repositoryId);
                cs.setLong(2, userId);
                cs.registerOutParameter(3, Types.NUMERIC);
                cs.registerOutParameter(4, Types.NUMERIC);
                cs.execute();
                return new int[]{cs.getInt(3), cs.getInt(4)};
            }
        });
        entityManager.clear();
        return res;
    }

    @Transactional
    public long[] prToggleSeguirRepo(Long repositoryId, Long userId) {
        entityManager.flush();
        long[] res = session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_REPOSITORIOS.pr_toggle_seguir_repo(?, ?, ?, ?) }")) {
                cs.setLong(1, repositoryId);
                cs.setLong(2, userId);
                cs.registerOutParameter(3, Types.NUMERIC);
                cs.registerOutParameter(4, Types.NUMERIC);
                cs.execute();
                return new long[]{cs.getLong(3), cs.getLong(4)};
            }
        });
        entityManager.clear();
        return res;
    }

    @Transactional
    public void prIncrementarVista(Long resourceId) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_REPOSITORIOS.pr_incrementar_vista(?) }")) {
                cs.setLong(1, resourceId);
                cs.execute();
            }
        });
    }

    @Transactional
    public void prIncrementarDescarga(Long resourceId) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_REPOSITORIOS.pr_incrementar_descarga(?) }")) {
                cs.setLong(1, resourceId);
                cs.execute();
            }
        });
    }

    @Transactional
    public void prEliminarRepositorioCascada(Long repositoryId) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_REPOSITORIOS.pr_eliminar_repositorio_cascada(?) }")) {
                cs.setLong(1, repositoryId);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    @Transactional
    public void prEliminarRecursoCascada(Long resourceId) {
        entityManager.flush();
        session().doWork(conn -> {
            try (CallableStatement cs = conn.prepareCall("{ call PKG_REPOSITORIOS.pr_eliminar_recurso_cascada(?) }")) {
                cs.setLong(1, resourceId);
                cs.execute();
            }
        });
        entityManager.clear();
    }

    // =========================================================================
    // UTILIDADES INTERNAS DE CURSOR Y PARÁMETROS JDBC
    // =========================================================================

    private Session session() {
        return entityManager.unwrap(Session.class);
    }

    private List<Long> callNoArgIdCursor(String callSql) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall(callSql)) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    private List<Long> callSingleIdParamCursor(String callSql, Long paramId) {
        return session().doReturningWork(conn -> {
            try (CallableStatement cs = conn.prepareCall(callSql)) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                cs.setLong(2, paramId);
                cs.execute();
                return readIdCursor(cs, 1);
            }
        });
    }

    private List<Long> readIdCursor(CallableStatement cs, int paramIndex) throws SQLException {
        List<Long> ids = new ArrayList<>();
        try (ResultSet rs = (ResultSet) cs.getObject(paramIndex)) {
            if (rs != null) {
                rs.setFetchSize(500);
                while (rs.next()) {
                    ids.add(rs.getLong(1));
                }
            }
        }
        return ids;
    }

    private List<Object[]> readResourceStatsCursor(CallableStatement cs, int paramIndex) throws SQLException {
        List<Object[]> rows = new ArrayList<>();
        try (ResultSet rs = (ResultSet) cs.getObject(paramIndex)) {
            if (rs != null) {
                rs.setFetchSize(500);
            }
            while (rs != null && rs.next()) {
                Timestamp ts = rs.getTimestamp(7);
                rows.add(new Object[]{
                        rs.getLong(1),
                        rs.getString(2),
                        ResourceType.valueOf(rs.getString(3)),
                        rs.getString(4),
                        rs.getInt(5),
                        rs.getInt(6),
                        ts != null ? ts.toLocalDateTime() : null,
                        rs.getLong(8),
                        rs.getString(9)
                });
            }
        }
        return rows;
    }

    private void setString(CallableStatement cs, int index, String value) throws SQLException {
        if (value == null || value.isBlank()) {
            cs.setNull(index, Types.VARCHAR);
        } else {
            cs.setString(index, value);
        }
    }

    private void setLong(CallableStatement cs, int index, Long value) throws SQLException {
        if (value == null) {
            cs.setNull(index, Types.NUMERIC);
        } else {
            cs.setLong(index, value);
        }
    }

    private void setInt(CallableStatement cs, int index, Integer value) throws SQLException {
        if (value == null) {
            cs.setNull(index, Types.NUMERIC);
        } else {
            cs.setInt(index, value);
        }
    }

    private void setTimestamp(CallableStatement cs, int index, LocalDateTime value) throws SQLException {
        if (value == null) {
            cs.setNull(index, Types.TIMESTAMP);
        } else {
            cs.setTimestamp(index, Timestamp.valueOf(value));
        }
    }
}
