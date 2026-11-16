Artificial Intelligence Usage Log
Project: Collaborative web platform for an academic repository (Alejandría) · Systems Engineering, Universidad Popular del Cesar
Document: Project documentation annex (MVP)
1. Team member details
   • Full name: Pablo Andrés Amaya Pabón
   • Role in the project: Developer 2 – business logic, AI and analytics; repository layer (Spring Data JPA)
   • Institutional email: pamaya@unicesar.edu.co
   • ID: 1066281972
   • Program: Systems Engineering, Faculty of Engineering and Technology
   • AI tool used: Claude (Anthropic), conversational assistant
   • Project module assisted: Backend: data access layer (Capa_Repository) and Git workflow
2. Purpose of this document
   This document records, transparently and in an orderly way, how artificial intelligence was used as support during the development of the backend data access layer. It is not a verbatim transcript: each section describes what needed to be solved, what guidance the AI provided, what decision was made and how the result was verified. The AI was used as a consultation, review and explanation assistant; design decisions, integration into the project and final validation were the team's responsibility.
3. Technical context
   The platform backend is built with Spring Boot and Maven, using Spring Data JPA connected to an Oracle database. The work started from the class diagram of the repository layer (namespace Capa_Repository), where the base repositories for the main modules were defined:
   • UserRepository
   • ResourceRepository
   • CatalogRepository
   • InteractionRepository
   • ReportRepository
   Work was also done on analytics repositories, such as DemandMetricRepository. This layer had to be finished so that the teammate in charge of the services could consume the data.
4. Summary of the assistance received
1. Repository layer design
   ◦ What the AI was used for: turning the class diagram into JPA interfaces and representing it in Mermaid.
   ◦ Result: base repositories defined.
2. UserRepository
   ◦ What the AI was used for: handling Optional<User> and deciding on RoleRepository.
   ◦ Result: safe queries and the user–role relationship clarified.
3. Standardization in English
   ◦ What the AI was used for: refactoring names and parameters; fixing JPQL.
   ◦ Result: code consistent in English.
4. DemandMetricRepository
   ◦ What the AI was used for: derived queries, relationships with underscores and pagination.
   ◦ Result: working analytics queries.
5. Git workflow
   ◦ What the AI was used for: branches, conventional commits and recovering from an erroneous push.
   ◦ Result: an orderly team workflow.
6. Explanation to a teammate
   ◦ What the AI was used for: clarifying how interfaces work in Spring Data JPA.
   ◦ Result: architecture question resolved.
7. Oracle considerations
   ◦ What the AI was used for: driver, reserved words and identifiers.
   ◦ Result: stable configuration.
8. Validation
   ◦ What the AI was used for: checking that the project compiled and started.
   ◦ Result: foundation ready for the service layer.
5. Conversation log
   5.1 Defining the repositories from the class diagram
   Situation. The backend lead asked for the repository layer diagram, written in Mermaid with classes and attributes in English, to be included in the project, and a complete class diagram at the end.
   User: Presents the repository layer class diagram and asks for help converting each class into a Spring Data JPA repository and representing it correctly in Mermaid.
   Claude: Guides the definition of the base repositories (UserRepository, ResourceRepository, CatalogRepository, InteractionRepository, ReportRepository) as interfaces extending JpaRepository. It also explains how UML visibility is expressed in Mermaid, for example that the + symbol indicates a public member.
   Result. The initial structure of the layer and the Capa_Repository diagram were obtained, which served as the basis for the implementation.
   5.2 Reviewing UserRepository: Optional and the relationship with roles
   User: Asks how to avoid null pointer errors when searching for users and whether an independent repository is needed for roles, given the @ManyToOne relationship between users and roles.
   Claude: Explains why search methods should return Optional<User>: it forces the case where the record does not exist to be handled explicitly and avoids NullPointerException. Regarding roles, it analyzes the @ManyToOne relationship and the reasons for creating a dedicated RoleRepository: querying and managing roles without going through the user.
   Result. Optional<User> was adopted in the searches, and the need for an independent RoleRepository was evaluated and incorporated.
   5.3 Standardizing the code in English and fixing JPQL
   User: Asks for a review of all the code to unify it in English, for example changing correoInstitucional to institutionalEmail, and adjusting the @Param annotations.
   Claude: Points out that JPQL queries are written against entity names and their attributes, not against database table names. It helps rename attributes and parameters consistently and fix the queries so they follow that rule.
   Result. The repository layer code was standardized in English and the JPQL queries correctly reference entities and attributes.
   5.4 Advanced queries in DemandMetricRepository
   User: Needs analytics queries by subject and academic period, and wants to understand how to build them without writing SQL by hand.
   Claude: Explains Spring Data derived methods and how to traverse relationships using underscores, for example findBySubject_IdAndAcademicPeriod. It also shows how to sort and limit results with Pageable and with methods such as findByAcademicPeriodOrderByTotalQueriesDesc.
   Result. Sorted and paginated demand queries were implemented, feeding the analytics module.
   5.5 Team Git workflow
   User: Asks for guidance on how to work as a team with branches and how to react to an accidental push to the shared develop branch.
   Claude: Describes the use of git checkout -b to create working branches and the structure of commit messages following Conventional Commits (feat: for features and docs: for documentation). For the accidental push, it explains the difference between git revert, which undoes the change with a new commit and is safe on shared branches, and git reset, which rewrites history and requires coordination with the team.
   Result. The team adopted a branch and commit convention, and had a clear procedure for correcting mistakes on develop.
   5.6 Explaining interfaces in Spring Data JPA
   Situation. A teammate had doubts about why repositories are interfaces with no class implementing them.
   User: Asks for a clear explanation to align the team.
   Claude: Explains that interfaces do not store data or require a manual implementation: when the application starts, Spring automatically generates a proxy with the implementation, while actual persistence happens in Oracle. It also shows how repositories are injected into services via the constructor (private final) and how to take advantage of the methods inherited from JpaRepository (save, findById, findAll, deleteById) without rewriting them.
   Result. The team's question was resolved and the injection pattern for the service layer was agreed.
   5.7 Oracle-specific considerations
   User: Asks what problems can arise when working with Oracle from JPA.
   Claude: Warns about the JDBC driver version, reserved words such as USER (which cannot simply be used as a table name) and the behavior of identifiers. It concludes that using interfaces with Spring Data JPA saves a large amount of boilerplate code compared to implementing it manually with classes and EntityManager.
   Result. These precautions were taken into account in entity mapping and connection configuration.
   5.8 Validating the layer
   User: Checks that the project compiles and starts.
   Claude: Guides the review of the points that usually cause startup failures (attribute names in derived methods, JPQL queries and database configuration).
   Result. The project compiled and started without errors, leaving the foundation ready for the service layer to begin consuming data.
6. Verification and human responsibility
   • All suggested code was reviewed, adapted to the project's actual entities and tested by the developer before being integrated.
   • Final validation was done by compiling and running the application against the Oracle database.
   • Architecture decisions (for example, creating RoleRepository) were discussed and agreed with the team.
   • The AI had no access to the repository or the database; it worked only with the information the developer shared in the conversation.
7. Limitations and good practices
   • The AI's answers may contain inaccuracies, so they were checked against the official Spring Data JPA documentation and the project's actual behavior.
   • No credentials or users' personal data were shared in the conversations.
   • The AI was used to learn, review and reduce repetitive tasks, not to replace the team's understanding of the code.