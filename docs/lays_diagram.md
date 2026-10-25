flowchart TD

    %% ==========================================
    %% CAPA DE PRESENTACIÓN Y API REST
    %% ==========================================
    subgraph Presentacion [Capa de Presentación]
    Controladores[Controladores REST]
    %% Aquí se exponen los endpoints HTTP para el frontend (React).
    %% Las clases del diagrama de dominio no residen aquí directamente,
    %% pero esta capa recibe los DTOs y llama a los servicios.
    end

    %% ==========================================
    %% CAPA DE LÓGICA DE NEGOCIO (SERVICIOS)
    %% ==========================================
    subgraph Servicios [Capa de Lógica de Negocio]
        AnalyticsService[AnalyticsService]
        %% Ubicación: Capa de Servicios.
        %% Razón: Es la única clase de tu diagrama original que define comportamiento de negocio puro 
        %% (calcular métricas, generar reportes), orquestando datos sin ser una tabla de la BD.
        OtrosServicios[ResourceService, AuthService...]
    end

    %% ==========================================
    %% CAPA DE DOMINIO Y ACCESO A DATOS (ENTIDADES JPA)
    %% ==========================================
    subgraph Dominio [Capa de Dominio / Entidades]
        %% Las siguientes clases representan la estructura de la base de datos Oracle.
        %% Se ubican aquí porque son objetos persistentes mapeados con JPA/Hibernate.

        subgraph Academico [Catálogo Académico]
            Faculty[Faculty]
            %% Razón: Entidad estática precargada superior.
            Program[Program]
            %% Razón: Agrupa semestres y pertenece a una facultad.
            Semester[Semester]
            %% Razón: Nivel cronológico del plan de estudios.
            Subject[Subject]
            %% Razón: Entidad final del catálogo a la que se vinculan los recursos.
        end

        subgraph Identidad [Acceso y Seguridad]
            User[User]
            %% Razón: Entidad principal de autenticación y dueña de los recursos.
            Role[Role]
            %% Razón: Entidad de control de acceso basada en RBAC implementada en el paso anterior.
        end

        subgraph Repositorio [Gestión de Contenido]
            Resource[Resource]
            %% Razón: Entidad central que almacena el archivo BLOB y sus metadatos.
            Tag[Tag]
            %% Razón: Entidad de clasificación libre (etiquetas) vinculada a Resource.
            Rating[Rating]
            %% Razón: Entidad transaccional que guarda las valoraciones de los usuarios.
        end

        subgraph Gobernanza [Moderación]
            Report[Report]
            %% Razón: Registra las denuncias de los estudiantes.
            Decision[Decision]
            %% Razón: Registra el veredicto del administrador sobre un reporte.
            AuditLog[AuditLog]
            %% Razón: Entidad de trazabilidad para auditar acciones sensibles.
        end

        subgraph Analitica [Métricas]
            Interaction[Interaction]
            %% Razón: Entidad transaccional masiva que registra cada clic/descarga.
            DemandMetric[DemandMetric]
            %% Razón: Entidad resumen que almacena los cálculos generados por AnalyticsService.
        end
    end

    %% ==========================================
    %% CAPA TRANSVERSAL (ENUMERACIONES)
    %% ==========================================
    subgraph Transversal [Capa Transversal / Enumeradores]
        %% Se ubican aquí porque son constantes globales que restringen los valores permitidos 
        %% en los atributos de las entidades del dominio, evitando errores de tipeo.
        ResourceType[ResourceType]
        ResourceStatus[ResourceStatus]
        ReportReason[ReportReason]
        ReportStatus[ReportStatus]
        ModerationAction[ModerationAction]
        InteractionType[InteractionType]
    end

    Presentacion -->|Llama a métodos de negocio| Servicios
    Servicios -->|Consulta y persiste datos| Dominio
    Dominio -.->|Utiliza tipos estrictos| Transversal