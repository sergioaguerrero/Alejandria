-- ============================================================================
-- Alejandría UPC - Seed del Pénsum Oficial (Ingeniería de Sistemas - UPC)
-- Tablas objetivo: FACULTAD -> PROGRAMA -> SEMESTRE (1..9) -> MATERIA (62)
-- Script idempotente (usa MERGE): puede ejecutarse más de una vez sin duplicar.
-- Ejecutar en Oracle SQL Developer con F5 (Run Script).
-- ============================================================================

-- 1. Facultad
MERGE INTO FACULTAD f
USING (
    SELECT 'Facultad de Ingenierías y Tecnológicas' AS nombre
    FROM DUAL
) src
ON (f.nombre = src.nombre)
WHEN NOT MATCHED THEN
    INSERT (nombre)
    VALUES (src.nombre);

-- 2. Programa académico
MERGE INTO PROGRAMA p
USING (
    SELECT 'Ingeniería de Sistemas' AS nombre, f.id AS facultad_id
    FROM FACULTAD f
    WHERE f.nombre = 'Facultad de Ingenierías y Tecnológicas'
) src
ON (p.nombre = src.nombre AND p.facultad_id = src.facultad_id)
WHEN NOT MATCHED THEN
    INSERT (nombre, facultad_id)
    VALUES (src.nombre, src.facultad_id);

-- 3. Semestres 1 al 9
MERGE INTO SEMESTRE s
USING (
    SELECT n.numero_semestre, p.id AS programa_id
    FROM (
        SELECT 1 AS numero_semestre FROM DUAL UNION ALL
        SELECT 2 FROM DUAL UNION ALL
        SELECT 3 FROM DUAL UNION ALL
        SELECT 4 FROM DUAL UNION ALL
        SELECT 5 FROM DUAL UNION ALL
        SELECT 6 FROM DUAL UNION ALL
        SELECT 7 FROM DUAL UNION ALL
        SELECT 8 FROM DUAL UNION ALL
        SELECT 9 FROM DUAL
    ) n
    CROSS JOIN PROGRAMA p
    WHERE p.nombre = 'Ingeniería de Sistemas'
) src
ON (s.numero_semestre = src.numero_semestre AND s.programa_id = src.programa_id)
WHEN NOT MATCHED THEN
    INSERT (numero_semestre, programa_id)
    VALUES (src.numero_semestre, src.programa_id);

-- 4. Materias del pénsum oficial (62 materias)
MERGE INTO MATERIA m
USING (
    SELECT d.codigo, d.nombre, d.creditos, s.id AS semestre_id
    FROM (
        -- Semestre 1 (7 materias)
        SELECT 'SS407'  AS codigo, 'Algoritmos y Fundamentos de Programación'                     AS nombre, 3 AS creditos, 1 AS num_sem FROM DUAL UNION ALL
        SELECT 'MT104',  'Cálculo Diferencial',                                                  4, 1 FROM DUAL UNION ALL
        SELECT 'UPC01',  'Cátedra Upecista',                                                     1, 1 FROM DUAL UNION ALL
        SELECT 'PG102',  'Comunicación Oral y Escrita I',                                        2, 1 FROM DUAL UNION ALL
        SELECT 'HM201',  'Humanidades I',                                                        2, 1 FROM DUAL UNION ALL
        SELECT 'SS105',  'Introducción a la Ingeniería de Sistemas',                             2, 1 FROM DUAL UNION ALL
        SELECT 'MT117',  'Lógica Matemática',                                                    3, 1 FROM DUAL UNION ALL

        -- Semestre 2 (8 materias)
        SELECT 'UPC08',  'Actividad Deportiva',                                                  1, 2 FROM DUAL UNION ALL
        SELECT 'MT301B', 'Álgebra Lineal',                                                       3, 2 FROM DUAL UNION ALL
        SELECT 'MT303B', 'Cálculo Integral',                                                     4, 2 FROM DUAL UNION ALL
        SELECT 'PG200',  'Comunicación Oral y Escrita II',                                       2, 2 FROM DUAL UNION ALL
        SELECT 'HM202',  'Humanidades II',                                                       2, 2 FROM DUAL UNION ALL
        SELECT 'FS202',  'Mecánica',                                                             3, 2 FROM DUAL UNION ALL
        SELECT 'SS200',  'Programación de Computadores I',                                       3, 2 FROM DUAL UNION ALL
        SELECT 'ID212',  'Tech English I',                                                       2, 2 FROM DUAL UNION ALL

        -- Semestre 3 (8 materias)
        SELECT 'UPC09',  'Actividad Cultural',                                                   1, 3 FROM DUAL UNION ALL
        SELECT 'MT331',  'Cálculo Multivariable',                                                3, 3 FROM DUAL UNION ALL
        SELECT 'FS400',  'Electromagnetismo',                                                    3, 3 FROM DUAL UNION ALL
        SELECT 'MT403',  'Estadística Descriptiva e Inferencial',                                3, 3 FROM DUAL UNION ALL
        SELECT 'SS301',  'Estructura de Datos',                                                  3, 3 FROM DUAL UNION ALL
        SELECT 'SS300',  'Programación de Computadores II',                                      3, 3 FROM DUAL UNION ALL
        SELECT 'SS303',  'Semillero de Investigación',                                           2, 3 FROM DUAL UNION ALL
        SELECT 'ID341',  'Tech English II',                                                      2, 3 FROM DUAL UNION ALL

        -- Semestre 4 (7 materias)
        SELECT 'ING301', 'Metodología de la Investigación',                                      2, 4 FROM DUAL UNION ALL
        SELECT 'SS463',  'Base de Datos',                                                        3, 4 FROM DUAL UNION ALL
        SELECT 'MT402',  'Ecuaciones Diferenciales',                                             3, 4 FROM DUAL UNION ALL
        SELECT 'SS705',  'Electiva Ciencias Administrativas, Económicas y Contables',            2, 4 FROM DUAL UNION ALL
        SELECT 'AI432',  'Investigación de Operaciones',                                         3, 4 FROM DUAL UNION ALL
        SELECT 'FS329',  'Ondas',                                                                3, 4 FROM DUAL UNION ALL
        SELECT 'SS462',  'Programación de Computadores III',                                     3, 4 FROM DUAL UNION ALL

        -- Semestre 5 (7 materias)
        SELECT 'ING302', 'Seminario de Investigación',                                           2, 5 FROM DUAL UNION ALL
        SELECT 'MT309B', 'Análisis Numérico',                                                    3, 5 FROM DUAL UNION ALL
        SELECT 'SS500',  'Arquitectura de Computadores',                                         3, 5 FROM DUAL UNION ALL
        SELECT 'SS802',  'Base de Datos Avanzadas',                                              3, 5 FROM DUAL UNION ALL
        SELECT 'UPC23',  'Cátedra de la Paz',                                                    1, 5 FROM DUAL UNION ALL
        SELECT 'SS502',  'Ingeniería de Software I',                                             3, 5 FROM DUAL UNION ALL
        SELECT 'SS501',  'Programación Web',                                                     3, 5 FROM DUAL UNION ALL

        -- Semestre 6 (7 materias)
        SELECT 'UPC25',  'Cátedra Ambiental y Desarrollo Sostenible',                            1, 6 FROM DUAL UNION ALL
        SELECT 'SS602',  'Ingeniería de Software II',                                            3, 6 FROM DUAL UNION ALL
        SELECT 'AI700',  'Ingeniería Económica',                                                 3, 6 FROM DUAL UNION ALL
        SELECT 'SS604',  'Innovación y Emprendimiento Tecnológico',                              2, 6 FROM DUAL UNION ALL
        SELECT 'SS601',  'Modelos y Simulación',                                                 3, 6 FROM DUAL UNION ALL
        SELECT 'SS603',  'Programación Móvil',                                                   3, 6 FROM DUAL UNION ALL
        SELECT 'SS600',  'Sistemas Operativos',                                                  3, 6 FROM DUAL UNION ALL

        -- Semestre 7 (7 materias)
        SELECT 'UPC24',  'Cátedra de Emprendimiento',                                            1, 7 FROM DUAL UNION ALL
        SELECT 'FC407',  'Formulación y Evaluación de Proyectos en Ingeniería',                    3, 7 FROM DUAL UNION ALL
        SELECT 'SS706',  'Ingeniería de Software III',                                           3, 7 FROM DUAL UNION ALL
        SELECT 'SS702',  'Inteligencia Artificial',                                              3, 7 FROM DUAL UNION ALL
        SELECT 'SS701',  'Redes y Comunicaciones',                                               3, 7 FROM DUAL UNION ALL
        SELECT 'SS708',  'Research Project',                                                     2, 7 FROM DUAL UNION ALL
        SELECT 'SS707',  'Tecnologías Inmersivas',                                               3, 7 FROM DUAL UNION ALL

        -- Semestre 8 (7 materias)
        SELECT 'SS810',  'Electiva Básica de Ingeniería',                                        3, 8 FROM DUAL UNION ALL
        SELECT 'SS811',  'Ética Profesional',                                                    2, 8 FROM DUAL UNION ALL
        SELECT 'SS809',  'Gestión de Proyectos TI',                                              3, 8 FROM DUAL UNION ALL
        SELECT 'SS807',  'Optativa de Profundización I',                                         3, 8 FROM DUAL UNION ALL
        SELECT 'SS808',  'Optativa de Profundización II',                                        3, 8 FROM DUAL UNION ALL
        SELECT 'SS812',  'Proyecto de Grado I',                                                  3, 8 FROM DUAL UNION ALL
        SELECT 'SS806',  'Seguridad de la Información',                                          3, 8 FROM DUAL UNION ALL

        -- Semestre 9 (4 materias)
        SELECT 'SS906',  'Optativa de Profundización III',                                       3, 9 FROM DUAL UNION ALL
        SELECT 'SS907',  'Optativa de Profundización IV',                                        3, 9 FROM DUAL UNION ALL
        SELECT 'SS908',  'Optativa de Profundización V',                                         3, 9 FROM DUAL UNION ALL
        SELECT 'SS909',  'Trabajo de Grado II',                                                  3, 9 FROM DUAL
    ) d
    JOIN PROGRAMA p
      ON p.nombre = 'Ingeniería de Sistemas'
    JOIN SEMESTRE s
      ON s.programa_id = p.id
     AND s.numero_semestre = d.num_sem
) src
ON (m.codigo = src.codigo AND m.semestre_id = src.semestre_id)
WHEN NOT MATCHED THEN
    INSERT (codigo, nombre, creditos, semestre_id)
    VALUES (src.codigo, src.nombre, src.creditos, src.semestre_id);

COMMIT;

-- Verificación rápida (opcional):
-- SELECT s.numero_semestre, COUNT(*) AS total_materias
-- FROM MATERIA m
-- JOIN SEMESTRE s ON s.id = m.semestre_id
-- GROUP BY s.numero_semestre
-- ORDER BY s.numero_semestre;
