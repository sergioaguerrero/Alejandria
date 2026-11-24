package com.backend.service;

import com.backend.repository.AnaliticasRepository;
import com.backend.repository.AuthUsuariosRepository;
import com.backend.repository.IaEstudioRepository;
import com.backend.repository.ModeracionRepository;
import com.backend.repository.RepositoriosRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
 * PKG_ANALITICAS, PKG_AUTH_USUARIOS, PKG_IA_ESTUDIO, PKG_MODERACION y PKG_REPOSITORIOS,
 * delegando la ejecución JDBC a los repositorios basados en {@code SimpleJdbcCall}.
 */
@Service
public class OraclePackageService {

    @PersistenceContext
    private EntityManager entityManager;

    private final AnaliticasRepository analiticasRepository;
    private final AuthUsuariosRepository authUsuariosRepository;
    private final IaEstudioRepository iaEstudioRepository;
    private final ModeracionRepository moderacionRepository;
    private final RepositoriosRepository repositoriosRepository;

    public OraclePackageService(
            AnaliticasRepository analiticasRepository,
            AuthUsuariosRepository authUsuariosRepository,
            IaEstudioRepository iaEstudioRepository,
            ModeracionRepository moderacionRepository,
            RepositoriosRepository repositoriosRepository
    ) {
        this.analiticasRepository = analiticasRepository;
        this.authUsuariosRepository = authUsuariosRepository;
        this.iaEstudioRepository = iaEstudioRepository;
        this.moderacionRepository = moderacionRepository;
        this.repositoriosRepository = repositoriosRepository;
    }

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
        return analiticasRepository.topTerminosBusqueda(since, limit);
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnHistorialUsuario(Long userId, int limit) {
        return analiticasRepository.historialUsuario(userId, limit);
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnContarPorMateriaYTipo(LocalDateTime from, LocalDateTime to) {
        return analiticasRepository.contarPorMateriaYTipo(from, to);
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnConsultasUsuarioMateria(Long userId) {
        return analiticasRepository.consultasUsuarioMateria(userId);
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnActividadRecursosAutor(Long authorId, LocalDateTime since) {
        return analiticasRepository.actividadRecursosAutor(authorId, since);
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnActividadUsuariosDesde(LocalDateTime since) {
        return analiticasRepository.actividadUsuariosDesde(since);
    }

    @Transactional(readOnly = true)
    public List<Long> fnInteraccionesRangoIds(LocalDateTime from, LocalDateTime to) {
        return analiticasRepository.interaccionesRangoIds(from, to);
    }

    @Transactional(readOnly = true)
    public List<Long> fnMetricasMasConsultadasIds(String period, int limit) {
        return analiticasRepository.metricasMasConsultadasIds(period, limit);
    }

    @Transactional
    public void prRecalcularMetricaDemanda(String period, LocalDateTime from, LocalDateTime to) {
        entityManager.flush();
        analiticasRepository.recalcularMetricaDemanda(period, from, to);
        entityManager.clear();
    }

    // =========================================================================
    // 2. PKG_AUTH_USUARIOS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Long> fnObtenerAmigosMutuosIds(Long userId) {
        return authUsuariosRepository.obtenerAmigosMutuosIds(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnObtenerSeguidosUsuarioIds(Long userId) {
        return authUsuariosRepository.obtenerSeguidosUsuarioIds(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnObtenerSeguidoresUsuarioIds(Long userId) {
        return authUsuariosRepository.obtenerSeguidoresUsuarioIds(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnUsuariosVerificadosIds() {
        return authUsuariosRepository.usuariosVerificadosIds();
    }

    @Transactional(readOnly = true)
    public List<Long> fnAdminsVerificadosIds() {
        return authUsuariosRepository.adminsVerificadosIds();
    }

    @Transactional(readOnly = true)
    public List<Long> fnBuscarEstudiantesActivosIds(String pattern, Integer semester, int limit) {
        return authUsuariosRepository.buscarEstudiantesActivosIds(pattern, semester, limit);
    }

    @Transactional(readOnly = true)
    public Map<Integer, Long> fnEstudiantesPorSemestre() {
        return authUsuariosRepository.estudiantesPorSemestre();
    }

    @Transactional(readOnly = true)
    public List<Long> fnListarNotificacionesIds(Long userId) {
        return authUsuariosRepository.listarNotificacionesIds(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnMateriasInteresUsuarioIds(Long userId) {
        return authUsuariosRepository.materiasInteresUsuarioIds(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnContactosUsuarioIds(Long userId) {
        return authUsuariosRepository.contactosUsuarioIds(userId);
    }

    @Transactional
    public int[] prToggleSeguirUsuario(Long followerId, Long followedId) {
        entityManager.flush();
        int[] res = authUsuariosRepository.toggleSeguirUsuario(followerId, followedId);
        entityManager.clear();
        return res;
    }

    @Transactional
    public void prInvalidarCodigosOtp(Long userId) {
        entityManager.flush();
        authUsuariosRepository.invalidarCodigosOtp(userId);
        entityManager.clear();
    }

    @Transactional
    public void prInvalidarTokensReset(Long userId) {
        entityManager.flush();
        authUsuariosRepository.invalidarTokensReset(userId);
        entityManager.clear();
    }

    @Transactional
    public int[] prLimpiarCredencialesExpiradas(LocalDateTime cutoff) {
        entityManager.flush();
        int[] out = authUsuariosRepository.limpiarCredencialesExpiradas(cutoff);
        entityManager.clear();
        return out;
    }

    @Transactional
    public int prLimpiarUsuariosNoVerif(LocalDateTime cutoff) {
        entityManager.flush();
        int deleted = authUsuariosRepository.limpiarUsuariosNoVerif(cutoff);
        entityManager.clear();
        return deleted;
    }

    @Transactional
    public int prMarcarNotificacionesLeidas(Long userId) {
        entityManager.flush();
        int updated = authUsuariosRepository.marcarNotificacionesLeidas(userId);
        entityManager.clear();
        return updated;
    }

    @Transactional
    public void prEliminarContactosUsuario(Long userId) {
        entityManager.flush();
        authUsuariosRepository.eliminarContactosUsuario(userId);
        entityManager.clear();
    }

    @Transactional
    public void prEliminarMateriasInteres(Long userId) {
        entityManager.flush();
        authUsuariosRepository.eliminarMateriasInteres(userId);
        entityManager.clear();
    }

    // =========================================================================
    // 3. PKG_IA_ESTUDIO
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Long> fnObtenerGuardadosIaIds(Long userId) {
        return iaEstudioRepository.obtenerGuardadosIaIds(userId);
    }

    @Transactional(readOnly = true)
    public List<String> fnAmigosCompartidosIa(Long materialId, Long senderId) {
        return iaEstudioRepository.amigosCompartidosIa(materialId, senderId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnCompartidosConmigoIaIds(Long recipientId) {
        return iaEstudioRepository.compartidosConmigoIaIds(recipientId);
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnEstadisticasIaDesde(LocalDateTime since) {
        return iaEstudioRepository.estadisticasIaDesde(since);
    }

    @Transactional
    public void prCompartirMaterialIa(Long materialId, Long senderId, Long recipientId, String note) {
        entityManager.flush();
        iaEstudioRepository.compartirMaterialIa(materialId, senderId, recipientId, note);
        entityManager.clear();
    }

    // =========================================================================
    // 4. PKG_MODERACION
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Object[]> fnResumenReportes() {
        return moderacionRepository.resumenReportes();
    }

    @Transactional(readOnly = true)
    public List<Long> fnListarReportesIds() {
        return moderacionRepository.listarReportesIds();
    }

    @Transactional(readOnly = true)
    public List<Long> fnSancionesUsuarioIds(Long userId) {
        return moderacionRepository.sancionesUsuarioIds(userId);
    }

    @Transactional
    public void prResolverReporte(Long reportId, Long moderatorId, String action, String justification) {
        entityManager.flush();
        moderacionRepository.resolverReporte(reportId, moderatorId, action, justification);
        entityManager.clear();
    }

    @Transactional
    public boolean prToggleSuspensionUsuario(Long userId, Long moderatorId, String reason, String note) {
        entityManager.flush();
        boolean suspended = moderacionRepository.toggleSuspensionUsuario(userId, moderatorId, reason, note);
        entityManager.clear();
        return suspended;
    }

    // =========================================================================
    // 5. PKG_REPOSITORIOS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Long> fnBuscarRepositoriosIds(Long subjectId, Integer semester, String search, String order) {
        return repositoriosRepository.buscarRepositoriosIds(subjectId, semester, search, order);
    }

    @Transactional(readOnly = true)
    public List<Long> fnRepositoriosPorAutorIds(String username) {
        return repositoriosRepository.repositoriosPorAutorIds(username);
    }

    @Transactional(readOnly = true)
    public List<Long> fnRepositoriosSeguidosIds(Long userId) {
        return repositoriosRepository.repositoriosSeguidosIds(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnSeguidoresVerificadosRepoIds(Long repositoryId) {
        return repositoriosRepository.seguidoresVerificadosRepoIds(repositoryId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnColaboradoresRepositorioIds(Long repositoryId) {
        return repositoriosRepository.colaboradoresRepositorioIds(repositoryId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnColaboracionesUsuarioIds(Long userId) {
        return repositoriosRepository.colaboracionesUsuarioIds(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnRecursosPorRepositorioIds(Long repositoryId, Integer term) {
        return repositoriosRepository.recursosPorRepositorioIds(repositoryId, term);
    }

    @Transactional(readOnly = true)
    public List<Long> fnRecursosPorAutorIds(String username) {
        return repositoriosRepository.recursosPorAutorIds(username);
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
        return repositoriosRepository.buscarRecursosIds(text, subjectId, semester, term, type, topic, order);
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnEstadisticasRecursosPub() {
        return repositoriosRepository.estadisticasRecursosPub();
    }

    @Transactional(readOnly = true)
    public List<Object[]> fnEstadisticasRecursosAutor(Long authorId) {
        return repositoriosRepository.estadisticasRecursosAutor(authorId);
    }

    @Transactional(readOnly = true)
    public List<Long> fnListarMateriasCatalogoIds(Long semesterId, Integer semesterNumber) {
        return repositoriosRepository.listarMateriasCatalogoIds(semesterId, semesterNumber);
    }

    @Transactional
    public int[] prToggleMeGustaRepo(Long repositoryId, Long userId) {
        entityManager.flush();
        int[] res = repositoriosRepository.toggleMeGustaRepo(repositoryId, userId);
        entityManager.clear();
        return res;
    }

    @Transactional
    public long[] prToggleSeguirRepo(Long repositoryId, Long userId) {
        entityManager.flush();
        long[] res = repositoriosRepository.toggleSeguirRepo(repositoryId, userId);
        entityManager.clear();
        return res;
    }

    @Transactional
    public void prIncrementarVista(Long resourceId) {
        entityManager.flush();
        repositoriosRepository.incrementarVista(resourceId);
    }

    @Transactional
    public void prIncrementarDescarga(Long resourceId) {
        entityManager.flush();
        repositoriosRepository.incrementarDescarga(resourceId);
    }

    @Transactional
    public void prEliminarRepositorioCascada(Long repositoryId) {
        entityManager.flush();
        repositoriosRepository.eliminarRepositorioCascada(repositoryId);
        entityManager.clear();
    }

    @Transactional
    public void prEliminarRecursoCascada(Long resourceId) {
        entityManager.flush();
        repositoriosRepository.eliminarRecursoCascada(resourceId);
        entityManager.clear();
    }
}
