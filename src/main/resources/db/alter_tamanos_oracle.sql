-- ============================================================================
-- Alejandría UPC - Ajuste de longitudes VARCHAR2 sin perder datos existentes
-- Ejecutar en Oracle SQL Developer con F5 (Run Script) sobre la BD existente.
-- Nota: Una vez ejecutado en Oracle, este archivo puede eliminarse o archivarse
-- en historico_migraciones/, pues schema_oracle.sql ya incluye estos tamaños.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO OPCIONAL: Verificar longitudes máximas actuales antes de reducir
-- (Si algún valor supera el nuevo límite, Oracle lanzará ORA-01441)
-- ----------------------------------------------------------------------------
/*
SELECT MAX(LENGTH(nombre)) AS max_rol FROM ROL;
SELECT MAX(LENGTH(permiso)) AS max_permiso FROM PERMISO_ROL;
SELECT MAX(LENGTH(nombre_usuario))       AS max_user,
       MAX(LENGTH(primer_nombre))        AS max_nom1,
       MAX(LENGTH(segundo_nombre))       AS max_nom2,
       MAX(LENGTH(primer_apellido))      AS max_ape1,
       MAX(LENGTH(segundo_apellido))     AS max_ape2,
       MAX(LENGTH(correo_institucional)) AS max_mail,
       MAX(LENGTH(contrasena_hash))      AS max_hash
FROM USUARIO;
SELECT MAX(LENGTH(nombre)) AS max_facultad FROM FACULTAD;
SELECT MAX(LENGTH(nombre)) AS max_programa FROM PROGRAMA;
SELECT MAX(LENGTH(codigo)) AS max_cod_mat, MAX(LENGTH(nombre)) AS max_nom_mat FROM MATERIA;
SELECT MAX(LENGTH(nombre)) AS max_repo FROM REPOSITORIO_ESTUDIO;
SELECT MAX(LENGTH(titulo)) AS max_titulo_rec, MAX(LENGTH(tema)) AS max_tema FROM RECURSO_ACADEMICO;
SELECT MAX(LENGTH(nombre)) AS max_etiqueta FROM ETIQUETA;
SELECT MAX(LENGTH(tipo_contenido))     AS max_ia_tipo,
       MAX(LENGTH(titulo))             AS max_ia_titulo,
       MAX(LENGTH(nombre_repositorio)) AS max_ia_repo,
       MAX(LENGTH(nombre_materia))     AS max_ia_materia,
       MAX(LENGTH(alcance))            AS max_ia_alcance,
       MAX(LENGTH(valor_alcance))      AS max_ia_valor,
       MAX(LENGTH(etiqueta_alcance))   AS max_ia_etiqueta
FROM MATERIAL_IA;
*/

-- ----------------------------------------------------------------------------
-- AJUSTE DE COLUMNAS
-- ----------------------------------------------------------------------------

ALTER TABLE ROL MODIFY (
    nombre VARCHAR2(20 CHAR)
);

ALTER TABLE PERMISO_ROL MODIFY (
    permiso VARCHAR2(20 CHAR)
);

ALTER TABLE USUARIO MODIFY (
    nombre_usuario       VARCHAR2(20 CHAR),
    primer_nombre        VARCHAR2(20 CHAR),
    segundo_nombre       VARCHAR2(20 CHAR),
    primer_apellido      VARCHAR2(20 CHAR),
    segundo_apellido     VARCHAR2(20 CHAR),
    correo_institucional VARCHAR2(80 CHAR),
    contrasena_hash      VARCHAR2(70 CHAR)
);

ALTER TABLE FACULTAD MODIFY (
    nombre VARCHAR2(80 CHAR)
);

ALTER TABLE PROGRAMA MODIFY (
    nombre VARCHAR2(80 CHAR)
);

ALTER TABLE MATERIA MODIFY (
    codigo VARCHAR2(15 CHAR),
    nombre VARCHAR2(80 CHAR)
);

ALTER TABLE REPOSITORIO_ESTUDIO MODIFY (
    nombre VARCHAR2(100 CHAR)
);

ALTER TABLE RECURSO_ACADEMICO MODIFY (
    titulo VARCHAR2(120 CHAR),
    tema   VARCHAR2(80 CHAR)
);

ALTER TABLE ETIQUETA MODIFY (
    nombre VARCHAR2(30 CHAR)
);

ALTER TABLE MATERIAL_IA MODIFY (
    tipo_contenido     VARCHAR2(15 CHAR),
    titulo             VARCHAR2(150 CHAR),
    nombre_repositorio VARCHAR2(100 CHAR),
    nombre_materia     VARCHAR2(80 CHAR),
    alcance            VARCHAR2(10 CHAR),
    valor_alcance      VARCHAR2(80 CHAR),
    etiqueta_alcance   VARCHAR2(100 CHAR)
);
