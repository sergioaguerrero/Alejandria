-- ============================================================================
-- Alejandría UPC - Paso 1: Columnas de Documentos en RECURSO_ACADEMICO
-- Convención: snake_case en español (Database First)
-- Ejecutar en Oracle SQL Developer con F5 (Run Script) sobre AlejandrIA_nube.
-- ============================================================================

ALTER TABLE RECURSO_ACADEMICO ADD (
    corte          NUMBER(10, 0)      DEFAULT 1 NOT NULL,
    tema           VARCHAR2(150 CHAR),
    nombre_archivo VARCHAR2(255 CHAR),
    total_vistas   NUMBER(10, 0)      DEFAULT 0 NOT NULL
);

ALTER TABLE RECURSO_ACADEMICO ADD CONSTRAINT chk_recurso_corte
    CHECK (corte IN (1, 2, 3));

CREATE INDEX idx_recurso_corte ON RECURSO_ACADEMICO (corte);
CREATE INDEX idx_recurso_tema  ON RECURSO_ACADEMICO (tema);

-- Verificación rápida (opcional):
-- DESC RECURSO_ACADEMICO;
