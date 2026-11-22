-- ============================================================================
-- Alejandría UPC - Packages, Funciones, Procedimientos y Triggers (Oracle PL/SQL)
-- Esquema: ALEJANDRIA (Oracle Autonomous Database Cloud)
-- ============================================================================

-- ============================================================================
-- 1. ESPECIFICACIONES DE PACKAGES (PACKAGE SPECIFICATIONS)
-- ============================================================================

CREATE OR REPLACE PACKAGE PKG_ANALITICAS AS
    FUNCTION fn_indice_demanda_materia(
        p_materia_id IN NUMBER,
        p_desde      IN TIMESTAMP,
        p_hasta      IN TIMESTAMP
    ) RETURN NUMBER;

    FUNCTION fn_contar_usuarios_activos(
        p_desde IN TIMESTAMP
    ) RETURN NUMBER;

    FUNCTION fn_top_terminos_busqueda(
        p_desde  IN TIMESTAMP,
        p_limite IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_historial_usuario(
        p_usuario_id IN NUMBER,
        p_limite     IN NUMBER DEFAULT 30
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_contar_por_materia_y_tipo(
        p_desde IN TIMESTAMP,
        p_hasta IN TIMESTAMP
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_consultas_usuario_materia(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_actividad_recursos_autor(
        p_autor_id IN NUMBER,
        p_desde    IN TIMESTAMP
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_actividad_usuarios_desde(
        p_desde IN TIMESTAMP
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_interacciones_rango(
        p_desde IN TIMESTAMP,
        p_hasta IN TIMESTAMP
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_metricas_mas_consultadas(
        p_periodo IN VARCHAR2,
        p_limite  IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_obtener_metrica_materia(
        p_materia_id IN NUMBER,
        p_periodo    IN VARCHAR2
    ) RETURN NUMBER;

    PROCEDURE pr_top_terminos_busqueda(
        p_desde  IN  TIMESTAMP,
        p_limite IN  NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );

    PROCEDURE pr_recalcular_metrica_demanda(
        p_periodo IN VARCHAR2,
        p_desde   IN TIMESTAMP,
        p_hasta   IN TIMESTAMP
    );

    PROCEDURE pr_historial_usuario(
        p_usuario_id IN  NUMBER,
        p_cursor     OUT SYS_REFCURSOR
    );

    PROCEDURE pr_desvincular_recurso_inter(
        p_recurso_id IN NUMBER
    );

    PROCEDURE pr_desvincular_repo_inter(
        p_repositorio_id IN NUMBER
    );
END PKG_ANALITICAS;
/

CREATE OR REPLACE PACKAGE PKG_AUTH_USUARIOS AS
    FUNCTION fn_usuario_puede_acceder(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_son_amigos_mutuos(
        p_usuario1_id IN NUMBER,
        p_usuario2_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_es_seguidor_usuario(
        p_seguidor_id IN NUMBER,
        p_seguido_id  IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_contar_seguidores_usuario(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_contar_seguidos_usuario(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_contar_notif_no_leidas(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_contar_estudiantes_activos RETURN NUMBER;

    FUNCTION fn_obtener_amigos_mutuos(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_obtener_seguidos_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_obtener_seguidores_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_usuarios_verificados RETURN SYS_REFCURSOR;

    FUNCTION fn_admins_verificados RETURN SYS_REFCURSOR;

    FUNCTION fn_buscar_estudiantes_activos(
        p_patron   IN VARCHAR2,
        p_semestre IN NUMBER,
        p_limite   IN NUMBER DEFAULT 50
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_estudiantes_por_semestre RETURN SYS_REFCURSOR;

    FUNCTION fn_listar_notificaciones(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_materias_interes_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_contactos_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_buscar_usuario_por_username(
        p_username IN VARCHAR2
    ) RETURN NUMBER;

    FUNCTION fn_buscar_usuario_por_correo(
        p_correo IN VARCHAR2
    ) RETURN NUMBER;

    FUNCTION fn_existe_username_otro(
        p_username   IN VARCHAR2,
        p_excluir_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_obtener_ultimo_otp_activo(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_obtener_token_reset_hash(
        p_token_hash IN VARCHAR2
    ) RETURN NUMBER;

    FUNCTION fn_obtener_rol_por_nombre(
        p_nombre IN VARCHAR2
    ) RETURN NUMBER;

    FUNCTION fn_obtener_notificacion_usr(
        p_notificacion_id IN NUMBER,
        p_usuario_id      IN NUMBER
    ) RETURN NUMBER;

    PROCEDURE pr_eliminar_contactos_usuario(
        p_usuario_id IN NUMBER
    );

    PROCEDURE pr_eliminar_materias_interes(
        p_usuario_id IN NUMBER
    );

    PROCEDURE pr_toggle_seguir_usuario(
        p_seguidor_id IN  NUMBER,
        p_seguido_id  IN  NUMBER,
        p_siguiendo   OUT NUMBER,
        p_es_mutuo    OUT NUMBER
    );

    PROCEDURE pr_invalidar_codigos_otp(
        p_usuario_id IN NUMBER
    );

    PROCEDURE pr_invalidar_tokens_reset(
        p_usuario_id IN NUMBER
    );

    PROCEDURE pr_limpiar_credenciales_expiradas(
        p_corte            IN  TIMESTAMP,
        p_codigos_borrados OUT NUMBER,
        p_tokens_borrados  OUT NUMBER
    );

    PROCEDURE pr_limpiar_usuarios_no_verif(
        p_corte    IN  TIMESTAMP,
        p_borrados OUT NUMBER
    );

    PROCEDURE pr_marcar_notificaciones_leidas(
        p_usuario_id   IN  NUMBER,
        p_actualizadas OUT NUMBER
    );

    PROCEDURE pr_obtener_amigos_mutuos(
        p_usuario_id IN  NUMBER,
        p_cursor     OUT SYS_REFCURSOR
    );
END PKG_AUTH_USUARIOS;
/

CREATE OR REPLACE PACKAGE PKG_IA_ESTUDIO AS
    FUNCTION fn_usados_hoy_ia(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_cuota_restante_ia(
        p_usuario_id    IN NUMBER,
        p_limite_diario IN NUMBER DEFAULT 5
    ) RETURN NUMBER;

    FUNCTION fn_contar_total_material_ia RETURN NUMBER;

    FUNCTION fn_contar_total_compartidos_ia RETURN NUMBER;

    FUNCTION fn_obtener_guardados_ia(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_amigos_compartidos_ia(
        p_material_id  IN NUMBER,
        p_remitente_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_compartidos_conmigo_ia(
        p_destinatario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_obtener_compartido_ia(
        p_material_id     IN NUMBER,
        p_destinatario_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_estadisticas_ia_desde(
        p_desde IN TIMESTAMP
    ) RETURN SYS_REFCURSOR;

    PROCEDURE pr_obtener_guardados_ia(
        p_usuario_id IN  NUMBER,
        p_cursor     OUT SYS_REFCURSOR
    );

    PROCEDURE pr_compartir_material_ia(
        p_material_id     IN NUMBER,
        p_remitente_id    IN NUMBER,
        p_destinatario_id IN NUMBER,
        p_nota            IN VARCHAR2
    );

    PROCEDURE pr_desvincular_repo_ia(
        p_repositorio_id IN NUMBER
    );
END PKG_IA_ESTUDIO;
/

CREATE OR REPLACE PACKAGE PKG_MODERACION AS
    FUNCTION fn_existe_reporte_activo(
        p_reportante_id IN NUMBER,
        p_tipo_objetivo IN VARCHAR2,
        p_objetivo_id   IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_resumen_reportes RETURN SYS_REFCURSOR;

    FUNCTION fn_listar_reportes RETURN SYS_REFCURSOR;

    FUNCTION fn_obtener_decision_reporte(
        p_reporte_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_sanciones_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    PROCEDURE pr_resolver_reporte(
        p_reporte_id    IN NUMBER,
        p_moderador_id  IN NUMBER,
        p_accion        IN VARCHAR2,
        p_justificacion IN VARCHAR2
    );

    PROCEDURE pr_resumen_reportes(
        p_cursor OUT SYS_REFCURSOR
    );

    PROCEDURE pr_toggle_suspension_usuario(
        p_usuario_id   IN  NUMBER,
        p_moderador_id IN  NUMBER,
        p_motivo       IN  VARCHAR2,
        p_nota         IN  VARCHAR2,
        p_suspendido   OUT NUMBER
    );

    PROCEDURE pr_desvincular_recurso_rep(
        p_recurso_id IN NUMBER
    );

    PROCEDURE pr_desvincular_repo_recursos_rep(
        p_repositorio_id IN NUMBER
    );
END PKG_MODERACION;
/

CREATE OR REPLACE PACKAGE PKG_REPOSITORIOS AS
    FUNCTION fn_contar_recursos_publicados(
        p_repositorio_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_contar_seguidores_repo(
        p_repositorio_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_usuario_dio_like_repo(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_usuario_sigue_repo(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_estado_colaborador_repo(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN VARCHAR2;

    FUNCTION fn_es_colaborador_aceptado(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_contar_repos_autor(
        p_autor_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_contar_recursos_autor(
        p_autor_id IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_contar_total_repositorios RETURN NUMBER;

    FUNCTION fn_buscar_repositorios(
        p_materia_id IN NUMBER,
        p_semestre   IN NUMBER,
        p_texto      IN VARCHAR2,
        p_orden      IN VARCHAR2 DEFAULT 'recent'
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_repositorios_por_autor(
        p_username IN VARCHAR2
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_repositorios_seguidos(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_seguidores_verificados_repo(
        p_repositorio_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_colaboradores_repositorio(
        p_repositorio_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_colaboraciones_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_recursos_por_repositorio(
        p_repositorio_id IN NUMBER,
        p_corte          IN NUMBER DEFAULT NULL
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_recursos_por_autor(
        p_username IN VARCHAR2
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_buscar_recursos(
        p_texto      IN VARCHAR2,
        p_materia_id IN NUMBER,
        p_semestre   IN NUMBER DEFAULT NULL,
        p_corte      IN NUMBER DEFAULT NULL,
        p_tipo       IN VARCHAR2 DEFAULT NULL,
        p_tema       IN VARCHAR2 DEFAULT NULL,
        p_orden      IN VARCHAR2 DEFAULT 'recent'
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_estadisticas_recursos_pub RETURN SYS_REFCURSOR;

    FUNCTION fn_estadisticas_recursos_autor(
        p_autor_id IN NUMBER
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_listar_materias_catalogo(
        p_semestre_id     IN NUMBER DEFAULT NULL,
        p_numero_semestre IN NUMBER DEFAULT NULL
    ) RETURN SYS_REFCURSOR;

    FUNCTION fn_obtener_etiqueta_nombre(
        p_nombre IN VARCHAR2
    ) RETURN NUMBER;

    FUNCTION fn_obtener_colaborador_id(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN NUMBER;

    FUNCTION fn_obtener_colab_por_username(
        p_repositorio_id IN NUMBER,
        p_username       IN VARCHAR2
    ) RETURN NUMBER;

    PROCEDURE pr_toggle_me_gusta_repo(
        p_repositorio_id IN  NUMBER,
        p_usuario_id     IN  NUMBER,
        p_liked          OUT NUMBER,
        p_total_likes    OUT NUMBER
    );

    PROCEDURE pr_toggle_seguir_repo(
        p_repositorio_id   IN  NUMBER,
        p_usuario_id       IN  NUMBER,
        p_followed         OUT NUMBER,
        p_total_seguidores OUT NUMBER
    );

    PROCEDURE pr_incrementar_vista(
        p_recurso_id IN NUMBER
    );

    PROCEDURE pr_incrementar_descarga(
        p_recurso_id IN NUMBER
    );

    PROCEDURE pr_buscar_recursos(
        p_texto      IN  VARCHAR2,
        p_materia_id IN  NUMBER,
        p_tipo       IN  VARCHAR2,
        p_cursor     OUT SYS_REFCURSOR
    );

    PROCEDURE pr_desvincular_refs_repositorio(
        p_repositorio_id IN NUMBER
    );

    PROCEDURE pr_eliminar_repositorio_cascada(
        p_repositorio_id IN NUMBER
    );

    PROCEDURE pr_eliminar_recurso_cascada(
        p_recurso_id IN NUMBER
    );
END PKG_REPOSITORIOS;
/

-- ============================================================================
-- 2. CUERPOS DE PACKAGES (PACKAGE BODIES)
-- ============================================================================

CREATE OR REPLACE PACKAGE BODY PKG_ANALITICAS AS

    FUNCTION fn_indice_demanda_materia(
        p_materia_id IN NUMBER,
        p_desde      IN TIMESTAMP,
        p_hasta      IN TIMESTAMP
    ) RETURN NUMBER IS
        v_indice NUMBER := 0;
    BEGIN
        SELECT NVL(SUM(
            CASE tipo_interaccion
                WHEN 'VIEW'     THEN 1
                WHEN 'SEARCH'   THEN 1.5
                WHEN 'DOWNLOAD' THEN 2
                ELSE 0
            END
        ), 0)
        INTO v_indice
        FROM INTERACCION
        WHERE materia_id = p_materia_id
          AND fecha_interaccion BETWEEN p_desde AND p_hasta;

        RETURN v_indice;
    END fn_indice_demanda_materia;

    FUNCTION fn_contar_usuarios_activos(
        p_desde IN TIMESTAMP
    ) RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(DISTINCT usuario_id)
        INTO v_total
        FROM INTERACCION
        WHERE usuario_id IS NOT NULL
          AND (p_desde IS NULL OR fecha_interaccion >= p_desde);
        RETURN v_total;
    END fn_contar_usuarios_activos;

    FUNCTION fn_top_terminos_busqueda(
        p_desde  IN TIMESTAMP,
        p_limite IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
        v_lim    NUMBER := GREATEST(NVL(p_limite, 8), 1);
    BEGIN
        OPEN v_cursor FOR
            SELECT LOWER(termino_busqueda) AS termino, COUNT(*) AS total
            FROM INTERACCION
            WHERE tipo_interaccion = 'SEARCH'
              AND termino_busqueda IS NOT NULL
              AND (p_desde IS NULL OR fecha_interaccion >= p_desde)
            GROUP BY LOWER(termino_busqueda)
            ORDER BY total DESC
            FETCH FIRST v_lim ROWS ONLY;
        RETURN v_cursor;
    END fn_top_terminos_busqueda;

    FUNCTION fn_historial_usuario(
        p_usuario_id IN NUMBER,
        p_limite     IN NUMBER DEFAULT 30
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
        v_lim    NUMBER := GREATEST(NVL(p_limite, 30), 1);
    BEGIN
        OPEN v_cursor FOR
            SELECT r.id AS recurso_id,
                   r.titulo AS recurso_titulo,
                   re.nombre AS repositorio_nombre,
                   i.fecha_interaccion,
                   r.tipo_recurso,
                   i.tipo_interaccion,
                   m.nombre AS materia_nombre
            FROM INTERACCION i
            JOIN RECURSO_ACADEMICO r ON i.recurso_id = r.id
            LEFT JOIN REPOSITORIO_ESTUDIO re ON r.repositorio_id = re.id
            LEFT JOIN MATERIA m ON i.materia_id = m.id
            WHERE i.usuario_id = p_usuario_id
              AND i.tipo_interaccion IN ('VIEW', 'DOWNLOAD')
            ORDER BY i.fecha_interaccion DESC, i.id DESC
            FETCH FIRST v_lim ROWS ONLY;
        RETURN v_cursor;
    END fn_historial_usuario;

    FUNCTION fn_contar_por_materia_y_tipo(
        p_desde IN TIMESTAMP,
        p_hasta IN TIMESTAMP
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT materia_id, tipo_interaccion, COUNT(*) AS total
            FROM INTERACCION
            WHERE materia_id IS NOT NULL
              AND fecha_interaccion BETWEEN p_desde AND p_hasta
            GROUP BY materia_id, tipo_interaccion;
        RETURN v_cursor;
    END fn_contar_por_materia_y_tipo;

    FUNCTION fn_consultas_usuario_materia(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT m.nombre AS materia_nombre, COUNT(*) AS total
            FROM INTERACCION i
            JOIN MATERIA m ON i.materia_id = m.id
            WHERE i.usuario_id = p_usuario_id
              AND i.tipo_interaccion IN ('VIEW', 'DOWNLOAD')
            GROUP BY m.nombre
            ORDER BY total DESC;
        RETURN v_cursor;
    END fn_consultas_usuario_materia;

    FUNCTION fn_actividad_recursos_autor(
        p_autor_id IN NUMBER,
        p_desde    IN TIMESTAMP
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT i.tipo_interaccion, i.fecha_interaccion
            FROM INTERACCION i
            JOIN RECURSO_ACADEMICO r ON i.recurso_id = r.id
            WHERE r.subido_por = p_autor_id
              AND i.fecha_interaccion >= p_desde
              AND i.tipo_interaccion IN ('VIEW', 'DOWNLOAD');
        RETURN v_cursor;
    END fn_actividad_recursos_autor;

    FUNCTION fn_actividad_usuarios_desde(
        p_desde IN TIMESTAMP
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT i.usuario_id, i.fecha_interaccion
            FROM INTERACCION i
            WHERE i.fecha_interaccion >= p_desde
            ORDER BY i.fecha_interaccion ASC;
        RETURN v_cursor;
    END fn_actividad_usuarios_desde;

    FUNCTION fn_interacciones_rango(
        p_desde IN TIMESTAMP,
        p_hasta IN TIMESTAMP
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id,
                   usuario_anonimo_id,
                   tipo_interaccion,
                   fecha_interaccion,
                   materia_id,
                   recurso_id,
                   termino_busqueda
            FROM INTERACCION
            WHERE fecha_interaccion BETWEEN p_desde AND p_hasta
            ORDER BY fecha_interaccion ASC, id ASC;
        RETURN v_cursor;
    END fn_interacciones_rango;

    FUNCTION fn_metricas_mas_consultadas(
        p_periodo IN VARCHAR2,
        p_limite  IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
        v_lim    NUMBER := GREATEST(NVL(p_limite, 10), 1);
    BEGIN
        OPEN v_cursor FOR
            SELECT id
            FROM METRICA_DEMANDA
            WHERE periodo_academico = p_periodo
            ORDER BY total_consultas DESC, indice_demanda DESC
            FETCH FIRST v_lim ROWS ONLY;
        RETURN v_cursor;
    END fn_metricas_mas_consultadas;

    FUNCTION fn_obtener_metrica_materia(
        p_materia_id IN NUMBER,
        p_periodo    IN VARCHAR2
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM METRICA_DEMANDA
        WHERE materia_id = p_materia_id
          AND periodo_academico = p_periodo
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_metrica_materia;

    PROCEDURE pr_top_terminos_busqueda(
        p_desde  IN  TIMESTAMP,
        p_limite IN  NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        p_cursor := fn_top_terminos_busqueda(p_desde, p_limite);
    END pr_top_terminos_busqueda;

    PROCEDURE pr_recalcular_metrica_demanda(
        p_periodo IN VARCHAR2,
        p_desde   IN TIMESTAMP,
        p_hasta   IN TIMESTAMP
    ) IS
    BEGIN
        MERGE INTO METRICA_DEMANDA md
        USING (
            SELECT materia_id,
                   SUM(CASE WHEN tipo_interaccion = 'VIEW'     THEN 1 ELSE 0 END) AS vistas,
                   SUM(CASE WHEN tipo_interaccion = 'DOWNLOAD' THEN 1 ELSE 0 END) AS descargas,
                   SUM(CASE WHEN tipo_interaccion = 'SEARCH'   THEN 1 ELSE 0 END) AS busquedas
            FROM INTERACCION
            WHERE materia_id IS NOT NULL
              AND fecha_interaccion BETWEEN p_desde AND p_hasta
            GROUP BY materia_id
        ) src
        ON (md.materia_id = src.materia_id AND md.periodo_academico = p_periodo)
        WHEN MATCHED THEN
            UPDATE SET md.total_consultas = src.vistas,
                       md.total_descargas = src.descargas,
                       md.total_busquedas = src.busquedas,
                       md.indice_demanda  = (src.vistas * 1) + (src.busquedas * 1.5) + (src.descargas * 2)
        WHEN NOT MATCHED THEN
            INSERT (periodo_academico, total_consultas, total_descargas, total_busquedas, indice_demanda, materia_id)
            VALUES (p_periodo, src.vistas, src.descargas, src.busquedas,
                    (src.vistas * 1) + (src.busquedas * 1.5) + (src.descargas * 2), src.materia_id);
    END pr_recalcular_metrica_demanda;

    PROCEDURE pr_historial_usuario(
        p_usuario_id IN  NUMBER,
        p_cursor     OUT SYS_REFCURSOR
    ) IS
    BEGIN
        p_cursor := fn_historial_usuario(p_usuario_id, 30);
    END pr_historial_usuario;

    PROCEDURE pr_desvincular_recurso_inter(
        p_recurso_id IN NUMBER
    ) IS
    BEGIN
        UPDATE INTERACCION
        SET recurso_id = NULL
        WHERE recurso_id = p_recurso_id;
    END pr_desvincular_recurso_inter;

    PROCEDURE pr_desvincular_repo_inter(
        p_repositorio_id IN NUMBER
    ) IS
    BEGIN
        UPDATE INTERACCION
        SET recurso_id = NULL
        WHERE recurso_id IN (
            SELECT id FROM RECURSO_ACADEMICO WHERE repositorio_id = p_repositorio_id
        );
    END pr_desvincular_repo_inter;

END PKG_ANALITICAS;
/

CREATE OR REPLACE PACKAGE BODY PKG_AUTH_USUARIOS AS

    FUNCTION fn_usuario_puede_acceder(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM USUARIO
        WHERE id = p_usuario_id
          AND verificado = 1
          AND suspendido = 0;

        RETURN CASE WHEN v_count > 0 THEN 1 ELSE 0 END;
    END fn_usuario_puede_acceder;

    FUNCTION fn_son_amigos_mutuos(
        p_usuario1_id IN NUMBER,
        p_usuario2_id IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM SEGUIMIENTO_USUARIO s1
        JOIN SEGUIMIENTO_USUARIO s2
          ON s1.seguidor_id = s2.seguido_id
         AND s1.seguido_id  = s2.seguidor_id
        WHERE s1.seguidor_id = p_usuario1_id
          AND s1.seguido_id  = p_usuario2_id;

        RETURN CASE WHEN v_count > 0 THEN 1 ELSE 0 END;
    END fn_son_amigos_mutuos;

    FUNCTION fn_es_seguidor_usuario(
        p_seguidor_id IN NUMBER,
        p_seguido_id  IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM SEGUIMIENTO_USUARIO
        WHERE seguidor_id = p_seguidor_id
          AND seguido_id  = p_seguido_id;

        RETURN CASE WHEN v_count > 0 THEN 1 ELSE 0 END;
    END fn_es_seguidor_usuario;

    FUNCTION fn_contar_seguidores_usuario(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM SEGUIMIENTO_USUARIO
        WHERE seguido_id = p_usuario_id;
        RETURN v_count;
    END fn_contar_seguidores_usuario;

    FUNCTION fn_contar_seguidos_usuario(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM SEGUIMIENTO_USUARIO
        WHERE seguidor_id = p_usuario_id;
        RETURN v_count;
    END fn_contar_seguidos_usuario;

    FUNCTION fn_contar_notif_no_leidas(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM NOTIFICACION
        WHERE usuario_id = p_usuario_id
          AND leida = 0;
        RETURN v_count;
    END fn_contar_notif_no_leidas;

    FUNCTION fn_contar_estudiantes_activos RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM USUARIO u
        LEFT JOIN ROL r ON u.rol_id = r.id
        WHERE u.verificado = 1
          AND u.suspendido = 0
          AND (r.id IS NULL OR LOWER(r.nombre) NOT LIKE '%admin%');
        RETURN v_count;
    END fn_contar_estudiantes_activos;

    FUNCTION fn_obtener_amigos_mutuos(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id, u.nombre_usuario, u.primer_nombre, u.primer_apellido, u.semestre
            FROM USUARIO u
            JOIN SEGUIMIENTO_USUARIO s1 ON s1.seguido_id = u.id
            JOIN SEGUIMIENTO_USUARIO s2 ON s2.seguidor_id = u.id AND s2.seguido_id = p_usuario_id
            WHERE s1.seguidor_id = p_usuario_id
              AND u.verificado = 1
            ORDER BY LOWER(u.nombre_usuario) ASC;
        RETURN v_cursor;
    END fn_obtener_amigos_mutuos;

    FUNCTION fn_obtener_seguidos_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id, u.nombre_usuario, u.primer_nombre, u.primer_apellido, u.semestre
            FROM USUARIO u
            JOIN SEGUIMIENTO_USUARIO s ON s.seguido_id = u.id
            WHERE s.seguidor_id = p_usuario_id
              AND u.verificado = 1
            ORDER BY LOWER(u.nombre_usuario) ASC;
        RETURN v_cursor;
    END fn_obtener_seguidos_usuario;

    FUNCTION fn_obtener_seguidores_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id, u.nombre_usuario, u.primer_nombre, u.primer_apellido, u.semestre
            FROM USUARIO u
            JOIN SEGUIMIENTO_USUARIO s ON s.seguidor_id = u.id
            WHERE s.seguido_id = p_usuario_id
              AND u.verificado = 1
            ORDER BY LOWER(u.nombre_usuario) ASC;
        RETURN v_cursor;
    END fn_obtener_seguidores_usuario;

    FUNCTION fn_usuarios_verificados RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id
            FROM USUARIO u
            WHERE u.verificado = 1
              AND u.suspendido = 0
            ORDER BY LOWER(u.nombre_usuario) ASC;
        RETURN v_cursor;
    END fn_usuarios_verificados;

    FUNCTION fn_admins_verificados RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id
            FROM USUARIO u
            JOIN ROL r ON u.rol_id = r.id
            WHERE u.verificado = 1
              AND u.suspendido = 0
              AND LOWER(r.nombre) LIKE '%admin%'
            ORDER BY u.id ASC;
        RETURN v_cursor;
    END fn_admins_verificados;

    FUNCTION fn_buscar_estudiantes_activos(
        p_patron   IN VARCHAR2,
        p_semestre IN NUMBER,
        p_limite   IN NUMBER DEFAULT 50
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
        v_lim    NUMBER := GREATEST(NVL(p_limite, 50), 1);
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id
            FROM USUARIO u
            LEFT JOIN ROL r ON u.rol_id = r.id
            WHERE u.verificado = 1
              AND u.suspendido = 0
              AND (r.id IS NULL OR LOWER(r.nombre) NOT LIKE '%admin%')
              AND (
                  p_patron IS NULL
                  OR LOWER(u.nombre_usuario) LIKE p_patron ESCAPE '\'
                  OR (p_semestre IS NOT NULL AND u.semestre = p_semestre)
              )
            ORDER BY LOWER(u.nombre_usuario) ASC
            FETCH FIRST v_lim ROWS ONLY;
        RETURN v_cursor;
    END fn_buscar_estudiantes_activos;

    FUNCTION fn_estudiantes_por_semestre RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.semestre, COUNT(*) AS total
            FROM USUARIO u
            LEFT JOIN ROL r ON u.rol_id = r.id
            WHERE u.verificado = 1
              AND u.suspendido = 0
              AND u.semestre IS NOT NULL
              AND (r.id IS NULL OR LOWER(r.nombre) NOT LIKE '%admin%')
            GROUP BY u.semestre
            ORDER BY u.semestre ASC;
        RETURN v_cursor;
    END fn_estudiantes_por_semestre;

    FUNCTION fn_listar_notificaciones(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id
            FROM NOTIFICACION
            WHERE usuario_id = p_usuario_id
            ORDER BY fecha_creacion DESC, id DESC;
        RETURN v_cursor;
    END fn_listar_notificaciones;

    FUNCTION fn_materias_interes_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT m.id
            FROM MATERIA m
            JOIN SEMESTRE s ON m.semestre_id = s.id
            JOIN USUARIO_MATERIA_INTERES umi ON umi.materia_id = m.id
            WHERE umi.usuario_id = p_usuario_id
            ORDER BY s.numero_semestre ASC, m.nombre ASC;
        RETURN v_cursor;
    END fn_materias_interes_usuario;

    FUNCTION fn_contactos_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id
            FROM CONTACTO_USUARIO
            WHERE usuario_id = p_usuario_id
            ORDER BY orden ASC, id ASC;
        RETURN v_cursor;
    END fn_contactos_usuario;

    FUNCTION fn_buscar_usuario_por_username(
        p_username IN VARCHAR2
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        IF p_username IS NULL OR TRIM(p_username) IS NULL THEN
            RETURN NULL;
        END IF;
        SELECT id
        INTO v_id
        FROM USUARIO
        WHERE LOWER(nombre_usuario) = LOWER(TRIM(p_username))
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_buscar_usuario_por_username;

    FUNCTION fn_buscar_usuario_por_correo(
        p_correo IN VARCHAR2
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        IF p_correo IS NULL OR TRIM(p_correo) IS NULL THEN
            RETURN NULL;
        END IF;
        SELECT id
        INTO v_id
        FROM USUARIO
        WHERE LOWER(correo_institucional) = LOWER(TRIM(p_correo))
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_buscar_usuario_por_correo;

    FUNCTION fn_existe_username_otro(
        p_username   IN VARCHAR2,
        p_excluir_id IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM USUARIO
        WHERE LOWER(nombre_usuario) = LOWER(TRIM(p_username))
          AND id <> p_excluir_id;
        RETURN CASE WHEN v_count > 0 THEN 1 ELSE 0 END;
    END fn_existe_username_otro;

    FUNCTION fn_obtener_ultimo_otp_activo(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM CODIGO_VERIFICACION_CORREO
        WHERE usuario_id = p_usuario_id
          AND usado = 0
        ORDER BY fecha_creacion DESC, id DESC
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_ultimo_otp_activo;

    FUNCTION fn_obtener_token_reset_hash(
        p_token_hash IN VARCHAR2
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM TOKEN_RECUPERACION_CONTRASENA
        WHERE token_hash = p_token_hash
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_token_reset_hash;

    FUNCTION fn_obtener_rol_por_nombre(
        p_nombre IN VARCHAR2
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM ROL
        WHERE UPPER(nombre) = UPPER(TRIM(p_nombre))
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_rol_por_nombre;

    FUNCTION fn_obtener_notificacion_usr(
        p_notificacion_id IN NUMBER,
        p_usuario_id      IN NUMBER
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM NOTIFICACION
        WHERE id = p_notificacion_id
          AND usuario_id = p_usuario_id
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_notificacion_usr;

    PROCEDURE pr_eliminar_contactos_usuario(
        p_usuario_id IN NUMBER
    ) IS
    BEGIN
        DELETE FROM CONTACTO_USUARIO
        WHERE usuario_id = p_usuario_id;
    END pr_eliminar_contactos_usuario;

    PROCEDURE pr_eliminar_materias_interes(
        p_usuario_id IN NUMBER
    ) IS
    BEGIN
        DELETE FROM USUARIO_MATERIA_INTERES
        WHERE usuario_id = p_usuario_id;
    END pr_eliminar_materias_interes;

    PROCEDURE pr_toggle_seguir_usuario(
        p_seguidor_id IN  NUMBER,
        p_seguido_id  IN  NUMBER,
        p_siguiendo   OUT NUMBER,
        p_es_mutuo    OUT NUMBER
    ) IS
        v_existe NUMBER := 0;
    BEGIN
        v_existe := fn_es_seguidor_usuario(p_seguidor_id, p_seguido_id);
        IF v_existe > 0 THEN
            DELETE FROM SEGUIMIENTO_USUARIO
            WHERE seguidor_id = p_seguidor_id
              AND seguido_id  = p_seguido_id;
            p_siguiendo := 0;
            p_es_mutuo  := 0;
        ELSE
            INSERT INTO SEGUIMIENTO_USUARIO (seguidor_id, seguido_id, fecha_registro)
            VALUES (p_seguidor_id, p_seguido_id, LOCALTIMESTAMP);
            p_siguiendo := 1;
            p_es_mutuo  := fn_son_amigos_mutuos(p_seguidor_id, p_seguido_id);
        END IF;
    END pr_toggle_seguir_usuario;

    PROCEDURE pr_invalidar_codigos_otp(
        p_usuario_id IN NUMBER
    ) IS
    BEGIN
        UPDATE CODIGO_VERIFICACION_CORREO
        SET usado = 1
        WHERE usuario_id = p_usuario_id
          AND usado = 0;
    END pr_invalidar_codigos_otp;

    PROCEDURE pr_invalidar_tokens_reset(
        p_usuario_id IN NUMBER
    ) IS
    BEGIN
        UPDATE TOKEN_RECUPERACION_CONTRASENA
        SET usado = 1
        WHERE usuario_id = p_usuario_id
          AND usado = 0;
    END pr_invalidar_tokens_reset;

    PROCEDURE pr_limpiar_credenciales_expiradas(
        p_corte            IN  TIMESTAMP,
        p_codigos_borrados OUT NUMBER,
        p_tokens_borrados  OUT NUMBER
    ) IS
    BEGIN
        DELETE FROM CODIGO_VERIFICACION_CORREO
        WHERE fecha_expiracion < p_corte
           OR (usado = 1 AND fecha_creacion < p_corte);
        p_codigos_borrados := SQL%ROWCOUNT;

        DELETE FROM TOKEN_RECUPERACION_CONTRASENA
        WHERE fecha_expiracion < p_corte
           OR (usado = 1 AND fecha_creacion < p_corte);
        p_tokens_borrados := SQL%ROWCOUNT;
    END pr_limpiar_credenciales_expiradas;

    PROCEDURE pr_limpiar_usuarios_no_verif(
        p_corte    IN  TIMESTAMP,
        p_borrados OUT NUMBER
    ) IS
    BEGIN
        DELETE FROM USUARIO
        WHERE verificado = 0
          AND fecha_registro < p_corte;
        p_borrados := SQL%ROWCOUNT;
    END pr_limpiar_usuarios_no_verif;

    PROCEDURE pr_marcar_notificaciones_leidas(
        p_usuario_id   IN  NUMBER,
        p_actualizadas OUT NUMBER
    ) IS
    BEGIN
        UPDATE NOTIFICACION
        SET leida = 1
        WHERE usuario_id = p_usuario_id
          AND leida = 0;
        p_actualizadas := SQL%ROWCOUNT;
    END pr_marcar_notificaciones_leidas;

    PROCEDURE pr_obtener_amigos_mutuos(
        p_usuario_id IN  NUMBER,
        p_cursor     OUT SYS_REFCURSOR
    ) IS
    BEGIN
        p_cursor := fn_obtener_amigos_mutuos(p_usuario_id);
    END pr_obtener_amigos_mutuos;

END PKG_AUTH_USUARIOS;
/

CREATE OR REPLACE PACKAGE BODY PKG_IA_ESTUDIO AS

    FUNCTION fn_usados_hoy_ia(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER IS
        v_usados NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_usados
        FROM MATERIAL_IA
        WHERE usuario_id = p_usuario_id
          AND fecha_creacion >= TRUNC(LOCALTIMESTAMP);
        RETURN v_usados;
    END fn_usados_hoy_ia;

    FUNCTION fn_cuota_restante_ia(
        p_usuario_id    IN NUMBER,
        p_limite_diario IN NUMBER DEFAULT 5
    ) RETURN NUMBER IS
        v_usados NUMBER := 0;
    BEGIN
        v_usados := fn_usados_hoy_ia(p_usuario_id);
        RETURN GREATEST(p_limite_diario - v_usados, 0);
    END fn_cuota_restante_ia;

    FUNCTION fn_contar_total_material_ia RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*) INTO v_total FROM MATERIAL_IA;
        RETURN v_total;
    END fn_contar_total_material_ia;

    FUNCTION fn_contar_total_compartidos_ia RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*) INTO v_total FROM COMPARTIDO_IA;
        RETURN v_total;
    END fn_contar_total_compartidos_ia;

    FUNCTION fn_obtener_guardados_ia(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id, repositorio_id, tipo_contenido, titulo, nombre_repositorio,
                   nombre_materia, alcance, valor_alcance, etiqueta_alcance,
                   contenido_json, ultima_puntuacion, fecha_creacion
            FROM MATERIAL_IA
            WHERE usuario_id = p_usuario_id
              AND guardado_estudio = 1
            ORDER BY fecha_creacion DESC;
        RETURN v_cursor;
    END fn_obtener_guardados_ia;

    FUNCTION fn_amigos_compartidos_ia(
        p_material_id  IN NUMBER,
        p_remitente_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.nombre_usuario
            FROM COMPARTIDO_IA c
            JOIN USUARIO u ON c.destinatario_id = u.id
            WHERE c.material_id = p_material_id
              AND c.remitente_id = p_remitente_id
            ORDER BY LOWER(u.nombre_usuario) ASC;
        RETURN v_cursor;
    END fn_amigos_compartidos_ia;

    FUNCTION fn_compartidos_conmigo_ia(
        p_destinatario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id
            FROM COMPARTIDO_IA
            WHERE destinatario_id = p_destinatario_id
            ORDER BY fecha_compartido DESC, id DESC;
        RETURN v_cursor;
    END fn_compartidos_conmigo_ia;

    FUNCTION fn_obtener_compartido_ia(
        p_material_id     IN NUMBER,
        p_destinatario_id IN NUMBER
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM COMPARTIDO_IA
        WHERE material_id = p_material_id
          AND destinatario_id = p_destinatario_id
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_compartido_ia;

    FUNCTION fn_estadisticas_ia_desde(
        p_desde IN TIMESTAMP
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id, tipo_contenido, repositorio_id, nombre_repositorio, nombre_materia, fecha_creacion
            FROM MATERIAL_IA
            WHERE fecha_creacion >= p_desde
            ORDER BY fecha_creacion ASC;
        RETURN v_cursor;
    END fn_estadisticas_ia_desde;

    PROCEDURE pr_obtener_guardados_ia(
        p_usuario_id IN  NUMBER,
        p_cursor     OUT SYS_REFCURSOR
    ) IS
    BEGIN
        p_cursor := fn_obtener_guardados_ia(p_usuario_id);
    END pr_obtener_guardados_ia;

    PROCEDURE pr_compartir_material_ia(
        p_material_id     IN NUMBER,
        p_remitente_id    IN NUMBER,
        p_destinatario_id IN NUMBER,
        p_nota            IN VARCHAR2
    ) IS
    BEGIN
        IF PKG_AUTH_USUARIOS.fn_son_amigos_mutuos(p_remitente_id, p_destinatario_id) = 0 THEN
            RAISE_APPLICATION_ERROR(-20010, 'Solo puedes compartir material de IA con amigos mutuos.');
        END IF;

        MERGE INTO COMPARTIDO_IA c
        USING DUAL
        ON (c.material_id = p_material_id AND c.remitente_id = p_remitente_id AND c.destinatario_id = p_destinatario_id)
        WHEN MATCHED THEN
            UPDATE SET c.nota = NVL(p_nota, c.nota),
                       c.fecha_compartido = LOCALTIMESTAMP
        WHEN NOT MATCHED THEN
            INSERT (material_id, remitente_id, destinatario_id, nota, fecha_compartido)
            VALUES (p_material_id, p_remitente_id, p_destinatario_id, p_nota, LOCALTIMESTAMP);
    END pr_compartir_material_ia;

    PROCEDURE pr_desvincular_repo_ia(
        p_repositorio_id IN NUMBER
    ) IS
    BEGIN
        UPDATE MATERIAL_IA
        SET repositorio_id = NULL
        WHERE repositorio_id = p_repositorio_id;
    END pr_desvincular_repo_ia;

END PKG_IA_ESTUDIO;
/

CREATE OR REPLACE PACKAGE BODY PKG_MODERACION AS

    FUNCTION fn_existe_reporte_activo(
        p_reportante_id IN NUMBER,
        p_tipo_objetivo IN VARCHAR2,
        p_objetivo_id   IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM REPORTE
        WHERE reportante_id = p_reportante_id
          AND tipo_objetivo = p_tipo_objetivo
          AND estado IN ('OPEN', 'UNDER_REVIEW')
          AND (
              (p_tipo_objetivo = 'DOCUMENT'   AND recurso_id = p_objetivo_id) OR
              (p_tipo_objetivo = 'REPOSITORY' AND repositorio_id = p_objetivo_id) OR
              (p_tipo_objetivo = 'PROFILE'    AND usuario_objetivo_id = p_objetivo_id)
          );

        RETURN CASE WHEN v_count > 0 THEN 1 ELSE 0 END;
    END fn_existe_reporte_activo;

    FUNCTION fn_resumen_reportes RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT motivo, estado, COUNT(*) AS total
            FROM REPORTE
            GROUP BY motivo, estado
            ORDER BY total DESC;
        RETURN v_cursor;
    END fn_resumen_reportes;

    FUNCTION fn_listar_reportes RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id
            FROM REPORTE
            ORDER BY fecha_reporte DESC, id DESC;
        RETURN v_cursor;
    END fn_listar_reportes;

    FUNCTION fn_obtener_decision_reporte(
        p_reporte_id IN NUMBER
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM DECISION
        WHERE reporte_id = p_reporte_id
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_decision_reporte;

    FUNCTION fn_sanciones_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id
            FROM SANCION_USUARIO
            WHERE usuario_id = p_usuario_id
            ORDER BY fecha_creacion DESC, id DESC;
        RETURN v_cursor;
    END fn_sanciones_usuario;

    PROCEDURE pr_resolver_reporte(
        p_reporte_id    IN NUMBER,
        p_moderador_id  IN NUMBER,
        p_accion        IN VARCHAR2,
        p_justificacion IN VARCHAR2
    ) IS
        v_recurso_id          REPORTE.recurso_id%TYPE;
        v_repositorio_id      REPORTE.repositorio_id%TYPE;
        v_usuario_objetivo_id REPORTE.usuario_objetivo_id%TYPE;
        v_motivo              REPORTE.motivo%TYPE;
        v_autor_id            NUMBER;
    BEGIN
        SELECT recurso_id, repositorio_id, usuario_objetivo_id, motivo
        INTO v_recurso_id, v_repositorio_id, v_usuario_objetivo_id, v_motivo
        FROM REPORTE
        WHERE id = p_reporte_id;

        v_autor_id := v_usuario_objetivo_id;
        IF v_autor_id IS NULL AND v_recurso_id IS NOT NULL THEN
            BEGIN
                SELECT subido_por INTO v_autor_id FROM RECURSO_ACADEMICO WHERE id = v_recurso_id;
            EXCEPTION
                WHEN NO_DATA_FOUND THEN v_autor_id := NULL;
            END;
        ELSIF v_autor_id IS NULL AND v_repositorio_id IS NOT NULL THEN
            BEGIN
                SELECT usuario_id INTO v_autor_id FROM REPOSITORIO_ESTUDIO WHERE id = v_repositorio_id;
            EXCEPTION
                WHEN NO_DATA_FOUND THEN v_autor_id := NULL;
            END;
        END IF;

        INSERT INTO DECISION (accion_moderacion, justificacion, fecha_decision, reporte_id, moderador_id)
        VALUES (p_accion, p_justificacion, LOCALTIMESTAMP, p_reporte_id, p_moderador_id);

        UPDATE REPORTE
        SET estado = CASE WHEN p_accion = 'KEEP' THEN 'DISMISSED' ELSE 'RESOLVED' END,
            moderador_id = p_moderador_id
        WHERE id = p_reporte_id;

        IF p_accion = 'HIDE' AND v_recurso_id IS NOT NULL THEN
            UPDATE RECURSO_ACADEMICO SET estado = 'HIDDEN' WHERE id = v_recurso_id;
        ELSIF p_accion = 'REMOVE' THEN
            IF v_recurso_id IS NOT NULL THEN
                UPDATE RECURSO_ACADEMICO SET estado = 'REMOVED' WHERE id = v_recurso_id;
            ELSIF v_repositorio_id IS NOT NULL THEN
                UPDATE REPORTE SET repositorio_id = NULL WHERE id = p_reporte_id;
                PKG_REPOSITORIOS.pr_eliminar_repositorio_cascada(v_repositorio_id);
            END IF;
        ELSIF p_accion = 'WARN_USER' AND v_autor_id IS NOT NULL THEN
            INSERT INTO SANCION_USUARIO (usuario_id, moderador_id, reporte_id, tipo, motivo, nota)
            VALUES (v_autor_id, p_moderador_id, p_reporte_id, 'ADVERTENCIA',
                    'Reporte #' || p_reporte_id || ': ' || NVL(v_motivo, 'Moderacion'), p_justificacion);
        ELSIF p_accion = 'SUSPEND_USER' AND v_autor_id IS NOT NULL THEN
            UPDATE USUARIO SET suspendido = 1 WHERE id = v_autor_id;
            INSERT INTO SANCION_USUARIO (usuario_id, moderador_id, reporte_id, tipo, motivo, nota)
            VALUES (v_autor_id, p_moderador_id, p_reporte_id, 'SUSPENSION',
                    'Reporte #' || p_reporte_id || ': ' || NVL(v_motivo, 'Moderacion'), p_justificacion);
        END IF;
    END pr_resolver_reporte;

    PROCEDURE pr_resumen_reportes(
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        p_cursor := fn_resumen_reportes;
    END pr_resumen_reportes;

    PROCEDURE pr_toggle_suspension_usuario(
        p_usuario_id   IN  NUMBER,
        p_moderador_id IN  NUMBER,
        p_motivo       IN  VARCHAR2,
        p_nota         IN  VARCHAR2,
        p_suspendido   OUT NUMBER
    ) IS
        v_actual NUMBER := 0;
        v_nuevo  NUMBER := 0;
        v_tipo   VARCHAR2(20);
        v_motivo VARCHAR2(300);
    BEGIN
        SELECT suspendido INTO v_actual FROM USUARIO WHERE id = p_usuario_id;
        v_nuevo := CASE WHEN v_actual = 1 THEN 0 ELSE 1 END;

        UPDATE USUARIO
        SET suspendido = v_nuevo
        WHERE id = p_usuario_id;

        v_tipo := CASE WHEN v_nuevo = 1 THEN 'SUSPENSION' ELSE 'REACTIVACION' END;
        v_motivo := CASE
            WHEN p_motivo IS NOT NULL AND TRIM(p_motivo) IS NOT NULL THEN SUBSTR(TRIM(p_motivo), 1, 300)
            WHEN v_nuevo = 1 THEN 'Suspensión manual por administración'
            ELSE 'Reactivación de cuenta'
        END;

        INSERT INTO SANCION_USUARIO (usuario_id, moderador_id, reporte_id, tipo, motivo, nota, fecha_creacion)
        VALUES (p_usuario_id, p_moderador_id, NULL, v_tipo, v_motivo, p_nota, LOCALTIMESTAMP);

        p_suspendido := v_nuevo;
    END pr_toggle_suspension_usuario;

    PROCEDURE pr_desvincular_recurso_rep(
        p_recurso_id IN NUMBER
    ) IS
    BEGIN
        UPDATE REPORTE
        SET recurso_id = NULL
        WHERE recurso_id = p_recurso_id;
    END pr_desvincular_recurso_rep;

    PROCEDURE pr_desvincular_repo_recursos_rep(
        p_repositorio_id IN NUMBER
    ) IS
    BEGIN
        UPDATE REPORTE
        SET recurso_id = NULL
        WHERE recurso_id IN (
            SELECT id FROM RECURSO_ACADEMICO WHERE repositorio_id = p_repositorio_id
        );
    END pr_desvincular_repo_recursos_rep;

END PKG_MODERACION;
/

CREATE OR REPLACE PACKAGE BODY PKG_REPOSITORIOS AS

    FUNCTION fn_contar_recursos_publicados(
        p_repositorio_id IN NUMBER
    ) RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_total
        FROM RECURSO_ACADEMICO
        WHERE repositorio_id = p_repositorio_id
          AND estado = 'PUBLISHED';
        RETURN v_total;
    END fn_contar_recursos_publicados;

    FUNCTION fn_contar_seguidores_repo(
        p_repositorio_id IN NUMBER
    ) RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_total
        FROM SEGUIMIENTO_REPOSITORIO
        WHERE repositorio_id = p_repositorio_id;
        RETURN v_total;
    END fn_contar_seguidores_repo;

    FUNCTION fn_usuario_dio_like_repo(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN NUMBER IS
        v_existe NUMBER := 0;
    BEGIN
        IF p_usuario_id IS NULL THEN
            RETURN 0;
        END IF;
        SELECT COUNT(*)
        INTO v_existe
        FROM ME_GUSTA_REPOSITORIO
        WHERE repositorio_id = p_repositorio_id
          AND usuario_id = p_usuario_id;
        RETURN CASE WHEN v_existe > 0 THEN 1 ELSE 0 END;
    END fn_usuario_dio_like_repo;

    FUNCTION fn_usuario_sigue_repo(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN NUMBER IS
        v_existe NUMBER := 0;
    BEGIN
        IF p_usuario_id IS NULL THEN
            RETURN 0;
        END IF;
        SELECT COUNT(*)
        INTO v_existe
        FROM SEGUIMIENTO_REPOSITORIO
        WHERE repositorio_id = p_repositorio_id
          AND usuario_id = p_usuario_id;
        RETURN CASE WHEN v_existe > 0 THEN 1 ELSE 0 END;
    END fn_usuario_sigue_repo;

    FUNCTION fn_estado_colaborador_repo(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN VARCHAR2 IS
        v_estado COLABORADOR_REPOSITORIO.estado%TYPE := NULL;
    BEGIN
        IF p_usuario_id IS NULL THEN
            RETURN NULL;
        END IF;
        SELECT estado
        INTO v_estado
        FROM COLABORADOR_REPOSITORIO
        WHERE repositorio_id = p_repositorio_id
          AND usuario_id = p_usuario_id
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_estado;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_estado_colaborador_repo;

    FUNCTION fn_es_colaborador_aceptado(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN NUMBER IS
        v_estado VARCHAR2(20);
    BEGIN
        v_estado := fn_estado_colaborador_repo(p_repositorio_id, p_usuario_id);
        RETURN CASE WHEN v_estado = 'ACEPTADO' THEN 1 ELSE 0 END;
    END fn_es_colaborador_aceptado;

    FUNCTION fn_contar_repos_autor(
        p_autor_id IN NUMBER
    ) RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_total
        FROM REPOSITORIO_ESTUDIO
        WHERE usuario_id = p_autor_id;
        RETURN v_total;
    END fn_contar_repos_autor;

    FUNCTION fn_contar_recursos_autor(
        p_autor_id IN NUMBER
    ) RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_total
        FROM RECURSO_ACADEMICO
        WHERE subido_por = p_autor_id;
        RETURN v_total;
    END fn_contar_recursos_autor;

    FUNCTION fn_contar_total_repositorios RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*) INTO v_total FROM REPOSITORIO_ESTUDIO;
        RETURN v_total;
    END fn_contar_total_repositorios;

    FUNCTION fn_buscar_repositorios(
        p_materia_id IN NUMBER,
        p_semestre   IN NUMBER,
        p_texto      IN VARCHAR2,
        p_orden      IN VARCHAR2 DEFAULT 'recent'
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
        v_patron VARCHAR2(250);
        v_orden  VARCHAR2(20) := LOWER(NVL(TRIM(p_orden), 'recent'));
    BEGIN
        v_patron := CASE WHEN p_texto IS NULL OR TRIM(p_texto) IS NULL THEN NULL
                         ELSE '%' || LOWER(TRIM(p_texto)) || '%' END;

        OPEN v_cursor FOR
            SELECT re.id
            FROM REPOSITORIO_ESTUDIO re
            JOIN MATERIA m ON re.materia_id = m.id
            JOIN SEMESTRE s ON m.semestre_id = s.id
            WHERE (p_materia_id IS NULL OR re.materia_id = p_materia_id)
              AND (p_semestre IS NULL OR p_semestre <= 0 OR s.numero_semestre = p_semestre)
              AND (
                  v_patron IS NULL
                  OR LOWER(re.nombre) LIKE v_patron
                  OR LOWER(NVL(re.descripcion, '')) LIKE v_patron
                  OR LOWER(m.nombre) LIKE v_patron
              )
            ORDER BY
                CASE WHEN v_orden = 'popular' THEN re.total_me_gusta END DESC NULLS LAST,
                CASE WHEN v_orden = 'name'    THEN re.nombre END ASC NULLS LAST,
                re.fecha_creacion DESC,
                re.id DESC;
        RETURN v_cursor;
    END fn_buscar_repositorios;

    FUNCTION fn_repositorios_por_autor(
        p_username IN VARCHAR2
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT re.id
            FROM REPOSITORIO_ESTUDIO re
            JOIN USUARIO u ON re.usuario_id = u.id
            WHERE LOWER(u.nombre_usuario) = LOWER(TRIM(p_username))
            ORDER BY re.fecha_creacion DESC, re.id DESC;
        RETURN v_cursor;
    END fn_repositorios_por_autor;

    FUNCTION fn_repositorios_seguidos(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT re.id
            FROM REPOSITORIO_ESTUDIO re
            JOIN SEGUIMIENTO_REPOSITORIO sr ON sr.repositorio_id = re.id
            WHERE sr.usuario_id = p_usuario_id
            ORDER BY sr.fecha_registro DESC, re.id DESC;
        RETURN v_cursor;
    END fn_repositorios_seguidos;

    FUNCTION fn_seguidores_verificados_repo(
        p_repositorio_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id
            FROM USUARIO u
            JOIN SEGUIMIENTO_REPOSITORIO sr ON sr.usuario_id = u.id
            WHERE sr.repositorio_id = p_repositorio_id
              AND u.verificado = 1;
        RETURN v_cursor;
    END fn_seguidores_verificados_repo;

    FUNCTION fn_colaboradores_repositorio(
        p_repositorio_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id
            FROM COLABORADOR_REPOSITORIO
            WHERE repositorio_id = p_repositorio_id
            ORDER BY estado ASC, fecha_invitacion DESC;
        RETURN v_cursor;
    END fn_colaboradores_repositorio;

    FUNCTION fn_colaboraciones_usuario(
        p_usuario_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id
            FROM COLABORADOR_REPOSITORIO
            WHERE usuario_id = p_usuario_id
            ORDER BY fecha_invitacion DESC;
        RETURN v_cursor;
    END fn_colaboraciones_usuario;

    FUNCTION fn_recursos_por_repositorio(
        p_repositorio_id IN NUMBER,
        p_corte          IN NUMBER DEFAULT NULL
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT r.id
            FROM RECURSO_ACADEMICO r
            WHERE r.repositorio_id = p_repositorio_id
              AND r.estado = 'PUBLISHED'
              AND (p_corte IS NULL OR p_corte NOT BETWEEN 1 AND 3 OR r.corte = p_corte)
            ORDER BY r.fecha_subida DESC, r.id DESC;
        RETURN v_cursor;
    END fn_recursos_por_repositorio;

    FUNCTION fn_recursos_por_autor(
        p_username IN VARCHAR2
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT r.id
            FROM RECURSO_ACADEMICO r
            JOIN USUARIO u ON r.subido_por = u.id
            WHERE LOWER(u.nombre_usuario) = LOWER(TRIM(p_username))
              AND r.estado = 'PUBLISHED'
            ORDER BY r.fecha_subida DESC, r.id DESC;
        RETURN v_cursor;
    END fn_recursos_por_autor;

    FUNCTION fn_buscar_recursos(
        p_texto      IN VARCHAR2,
        p_materia_id IN NUMBER,
        p_semestre   IN NUMBER DEFAULT NULL,
        p_corte      IN NUMBER DEFAULT NULL,
        p_tipo       IN VARCHAR2 DEFAULT NULL,
        p_tema       IN VARCHAR2 DEFAULT NULL,
        p_orden      IN VARCHAR2 DEFAULT 'recent'
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
        v_patron VARCHAR2(250);
        v_tema   VARCHAR2(120);
        v_orden  VARCHAR2(20) := LOWER(NVL(TRIM(p_orden), 'recent'));
    BEGIN
        v_patron := CASE WHEN p_texto IS NULL OR TRIM(p_texto) IS NULL THEN NULL
                         ELSE '%' || LOWER(TRIM(p_texto)) || '%' END;
        v_tema   := CASE WHEN p_tema IS NULL OR TRIM(p_tema) IS NULL THEN NULL
                         ELSE '%' || LOWER(TRIM(p_tema)) || '%' END;

        OPEN v_cursor FOR
            SELECT r.id
            FROM RECURSO_ACADEMICO r
            JOIN MATERIA m ON r.materia_id = m.id
            JOIN SEMESTRE s ON m.semestre_id = s.id
            LEFT JOIN REPOSITORIO_ESTUDIO re ON r.repositorio_id = re.id
            WHERE r.estado = 'PUBLISHED'
              AND (p_materia_id IS NULL OR r.materia_id = p_materia_id)
              AND (p_semestre IS NULL OR p_semestre <= 0 OR s.numero_semestre = p_semestre)
              AND (p_corte IS NULL OR p_corte NOT BETWEEN 1 AND 3 OR r.corte = p_corte)
              AND (p_tipo IS NULL OR r.tipo_recurso = p_tipo)
              AND (v_tema IS NULL OR LOWER(NVL(r.tema, '')) LIKE v_tema)
              AND (
                  v_patron IS NULL
                  OR LOWER(r.titulo) LIKE v_patron
                  OR LOWER(NVL(r.descripcion, '')) LIKE v_patron
                  OR LOWER(NVL(r.tema, '')) LIKE v_patron
                  OR LOWER(NVL(re.nombre, '')) LIKE v_patron
                  OR EXISTS (
                      SELECT 1
                      FROM RECURSO_ETIQUETA ret
                      JOIN ETIQUETA e ON ret.etiqueta_id = e.id
                      WHERE ret.recurso_id = r.id
                        AND LOWER(e.nombre) LIKE v_patron
                  )
              )
            ORDER BY
                CASE WHEN v_orden IN ('popular', 'liked') THEN r.total_descargas END DESC NULLS LAST,
                CASE WHEN v_orden IN ('popular', 'liked') THEN r.total_vistas END DESC NULLS LAST,
                r.fecha_subida DESC,
                r.id DESC;
        RETURN v_cursor;
    END fn_buscar_recursos;

    FUNCTION fn_estadisticas_recursos_pub RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT r.id,
                   r.titulo,
                   r.tipo_recurso,
                   r.tema,
                   r.total_vistas,
                   r.total_descargas,
                   r.fecha_subida,
                   r.subido_por,
                   m.nombre AS materia_nombre
            FROM RECURSO_ACADEMICO r
            JOIN MATERIA m ON r.materia_id = m.id
            WHERE r.estado = 'PUBLISHED';
        RETURN v_cursor;
    END fn_estadisticas_recursos_pub;

    FUNCTION fn_estadisticas_recursos_autor(
        p_autor_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT r.id,
                   r.titulo,
                   r.tipo_recurso,
                   r.tema,
                   r.total_vistas,
                   r.total_descargas,
                   r.fecha_subida,
                   r.subido_por,
                   m.nombre AS materia_nombre
            FROM RECURSO_ACADEMICO r
            JOIN MATERIA m ON r.materia_id = m.id
            WHERE r.estado = 'PUBLISHED'
              AND r.subido_por = p_autor_id
            ORDER BY r.fecha_subida DESC, r.id DESC;
        RETURN v_cursor;
    END fn_estadisticas_recursos_autor;

    FUNCTION fn_listar_materias_catalogo(
        p_semestre_id     IN NUMBER DEFAULT NULL,
        p_numero_semestre IN NUMBER DEFAULT NULL
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT m.id
            FROM MATERIA m
            JOIN SEMESTRE s ON m.semestre_id = s.id
            WHERE (p_semestre_id IS NULL OR s.id = p_semestre_id)
              AND (p_numero_semestre IS NULL OR s.numero_semestre = p_numero_semestre)
            ORDER BY s.numero_semestre ASC, m.nombre ASC;
        RETURN v_cursor;
    END fn_listar_materias_catalogo;

    FUNCTION fn_obtener_etiqueta_nombre(
        p_nombre IN VARCHAR2
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM ETIQUETA
        WHERE LOWER(nombre) = LOWER(TRIM(p_nombre))
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_etiqueta_nombre;

    FUNCTION fn_obtener_colaborador_id(
        p_repositorio_id IN NUMBER,
        p_usuario_id     IN NUMBER
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT id
        INTO v_id
        FROM COLABORADOR_REPOSITORIO
        WHERE repositorio_id = p_repositorio_id
          AND usuario_id = p_usuario_id
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_colaborador_id;

    FUNCTION fn_obtener_colab_por_username(
        p_repositorio_id IN NUMBER,
        p_username       IN VARCHAR2
    ) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        SELECT c.id
        INTO v_id
        FROM COLABORADOR_REPOSITORIO c
        JOIN USUARIO u ON c.usuario_id = u.id
        WHERE c.repositorio_id = p_repositorio_id
          AND LOWER(u.nombre_usuario) = LOWER(TRIM(p_username))
        FETCH FIRST 1 ROWS ONLY;
        RETURN v_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END fn_obtener_colab_por_username;

    PROCEDURE pr_toggle_me_gusta_repo(
        p_repositorio_id IN  NUMBER,
        p_usuario_id     IN  NUMBER,
        p_liked          OUT NUMBER,
        p_total_likes    OUT NUMBER
    ) IS
        v_existe NUMBER := 0;
    BEGIN
        v_existe := fn_usuario_dio_like_repo(p_repositorio_id, p_usuario_id);

        IF v_existe > 0 THEN
            -- Al eliminar en ME_GUSTA_REPOSITORIO, el trigger TRG_SYNC_ME_GUSTA_REPO
            -- decrementa automáticamente REPOSITORIO_ESTUDIO.total_me_gusta en 1.
            DELETE FROM ME_GUSTA_REPOSITORIO
            WHERE repositorio_id = p_repositorio_id
              AND usuario_id = p_usuario_id;
            p_liked := 0;
        ELSE
            -- Al insertar en ME_GUSTA_REPOSITORIO, el trigger TRG_SYNC_ME_GUSTA_REPO
            -- incrementa automáticamente REPOSITORIO_ESTUDIO.total_me_gusta en 1.
            INSERT INTO ME_GUSTA_REPOSITORIO (repositorio_id, usuario_id, fecha_registro)
            VALUES (p_repositorio_id, p_usuario_id, LOCALTIMESTAMP);
            p_liked := 1;
        END IF;

        SELECT total_me_gusta
        INTO p_total_likes
        FROM REPOSITORIO_ESTUDIO
        WHERE id = p_repositorio_id;
    END pr_toggle_me_gusta_repo;

    PROCEDURE pr_toggle_seguir_repo(
        p_repositorio_id   IN  NUMBER,
        p_usuario_id       IN  NUMBER,
        p_followed         OUT NUMBER,
        p_total_seguidores OUT NUMBER
    ) IS
        v_existe NUMBER := 0;
    BEGIN
        v_existe := fn_usuario_sigue_repo(p_repositorio_id, p_usuario_id);

        IF v_existe > 0 THEN
            DELETE FROM SEGUIMIENTO_REPOSITORIO
            WHERE repositorio_id = p_repositorio_id
              AND usuario_id = p_usuario_id;
            p_followed := 0;
        ELSE
            INSERT INTO SEGUIMIENTO_REPOSITORIO (repositorio_id, usuario_id, fecha_registro)
            VALUES (p_repositorio_id, p_usuario_id, LOCALTIMESTAMP);
            p_followed := 1;
        END IF;

        p_total_seguidores := fn_contar_seguidores_repo(p_repositorio_id);
    END pr_toggle_seguir_repo;

    PROCEDURE pr_incrementar_vista(
        p_recurso_id IN NUMBER
    ) IS
    BEGIN
        UPDATE RECURSO_ACADEMICO
        SET total_vistas = total_vistas + 1
        WHERE id = p_recurso_id;
    END pr_incrementar_vista;

    PROCEDURE pr_incrementar_descarga(
        p_recurso_id IN NUMBER
    ) IS
    BEGIN
        UPDATE RECURSO_ACADEMICO
        SET total_descargas = total_descargas + 1
        WHERE id = p_recurso_id;
    END pr_incrementar_descarga;

    PROCEDURE pr_buscar_recursos(
        p_texto      IN  VARCHAR2,
        p_materia_id IN  NUMBER,
        p_tipo       IN  VARCHAR2,
        p_cursor     OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT r.id, r.titulo, r.descripcion, r.tipo_recurso, r.corte, r.tema,
                   r.nombre_archivo, r.tipo_mime, r.tamano_bytes, r.fecha_subida,
                   r.total_vistas, r.total_descargas, r.repositorio_id,
                   m.id AS materia_id, m.nombre AS materia_nombre,
                   u.nombre_usuario AS autor_username
            FROM RECURSO_ACADEMICO r
            JOIN MATERIA m ON r.materia_id = m.id
            JOIN USUARIO u ON r.subido_por = u.id
            WHERE r.estado = 'PUBLISHED'
              AND (p_texto IS NULL
                   OR LOWER(r.titulo) LIKE '%' || LOWER(TRIM(p_texto)) || '%'
                   OR LOWER(NVL(r.descripcion, '')) LIKE '%' || LOWER(TRIM(p_texto)) || '%')
              AND (p_materia_id IS NULL OR r.materia_id = p_materia_id)
              AND (p_tipo IS NULL OR r.tipo_recurso = p_tipo)
            ORDER BY r.fecha_subida DESC;
    END pr_buscar_recursos;

    PROCEDURE pr_desvincular_refs_repositorio(
        p_repositorio_id IN NUMBER
    ) IS
    BEGIN
        UPDATE MATERIAL_IA
        SET repositorio_id = NULL
        WHERE repositorio_id = p_repositorio_id;

        UPDATE REPORTE
        SET repositorio_id = NULL
        WHERE repositorio_id = p_repositorio_id;
    END pr_desvincular_refs_repositorio;

    PROCEDURE pr_eliminar_repositorio_cascada(
        p_repositorio_id IN NUMBER
    ) IS
    BEGIN
        pr_desvincular_refs_repositorio(p_repositorio_id);
        PKG_ANALITICAS.pr_desvincular_repo_inter(p_repositorio_id);
        PKG_MODERACION.pr_desvincular_repo_recursos_rep(p_repositorio_id);

        DELETE FROM RECURSO_ETIQUETA
        WHERE recurso_id IN (
            SELECT id FROM RECURSO_ACADEMICO WHERE repositorio_id = p_repositorio_id
        );
        DELETE FROM RECURSO_ACADEMICO WHERE repositorio_id = p_repositorio_id;
        DELETE FROM COLABORADOR_REPOSITORIO WHERE repositorio_id = p_repositorio_id;
        DELETE FROM ME_GUSTA_REPOSITORIO WHERE repositorio_id = p_repositorio_id;
        DELETE FROM SEGUIMIENTO_REPOSITORIO WHERE repositorio_id = p_repositorio_id;
        DELETE FROM REPOSITORIO_ESTUDIO WHERE id = p_repositorio_id;
    END pr_eliminar_repositorio_cascada;

    PROCEDURE pr_eliminar_recurso_cascada(
        p_recurso_id IN NUMBER
    ) IS
    BEGIN
        PKG_ANALITICAS.pr_desvincular_recurso_inter(p_recurso_id);
        PKG_MODERACION.pr_desvincular_recurso_rep(p_recurso_id);
        DELETE FROM RECURSO_ETIQUETA WHERE recurso_id = p_recurso_id;
        DELETE FROM RECURSO_ACADEMICO WHERE id = p_recurso_id;
    END pr_eliminar_recurso_cascada;

END PKG_REPOSITORIOS;
/

-- ============================================================================
-- 3. SINCRONIZACIÓN DE CONTADORES DE ME GUSTA (CORRECCIÓN DE DOBLE CONTEO)
-- ============================================================================

UPDATE REPOSITORIO_ESTUDIO r
SET r.total_me_gusta = (
    SELECT COUNT(*)
    FROM ME_GUSTA_REPOSITORIO m
    WHERE m.repositorio_id = r.id
);
COMMIT;
