package com.backend.controller;

import com.backend.domain.academy.Faculty;
import com.backend.domain.academy.Program;
import com.backend.domain.academy.Semester;
import com.backend.domain.academy.Subject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CatalogControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private Long algorithmsId;

    @BeforeEach
    void seedCatalog() {
        algorithmsId = transactionTemplate.execute(status -> {
            entityManager.createQuery("DELETE FROM Subject").executeUpdate();
            entityManager.createQuery("DELETE FROM Semester").executeUpdate();
            entityManager.createQuery("DELETE FROM Program").executeUpdate();
            entityManager.createQuery("DELETE FROM Faculty").executeUpdate();

            Faculty faculty = new Faculty("Facultad de Ingenierías y Tecnológicas");
            entityManager.persist(faculty);

            Program program = new Program("Ingeniería de Sistemas", faculty);
            entityManager.persist(program);

            Semester sem1 = new Semester(1, program);
            Semester sem4 = new Semester(4, program);
            entityManager.persist(sem1);
            entityManager.persist(sem4);

            Subject calc = new Subject("MT104", "Cálculo Diferencial", 4, sem1);
            Subject algo = new Subject("SS407", "Algoritmos y Fundamentos de Programación", 3, sem1);
            Subject db = new Subject("SS463", "Base de Datos", 3, sem4);
            entityManager.persist(calc);
            entityManager.persist(algo);
            entityManager.persist(db);
            entityManager.flush();

            return algo.getId();
        });
    }

    @Test
    void listsAllSubjectsOrderedBySemesterAndName() throws Exception {
        mockMvc.perform(get("/api/subjects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].code").value("SS407"))
                .andExpect(jsonPath("$[0].semester").value(1))
                .andExpect(jsonPath("$[1].code").value("MT104"))
                .andExpect(jsonPath("$[1].semester").value(1))
                .andExpect(jsonPath("$[2].code").value("SS463"))
                .andExpect(jsonPath("$[2].semester").value(4));
    }

    @Test
    void filtersSubjectsBySemesterNumber() throws Exception {
        mockMvc.perform(get("/api/subjects").param("semester", "4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].code").value("SS463"))
                .andExpect(jsonPath("$[0].name").value("Base de Datos"))
                .andExpect(jsonPath("$[0].credits").value(3))
                .andExpect(jsonPath("$[0].semester").value(4));
    }

    @Test
    void returnsSubjectByIdOrNotFound() throws Exception {
        mockMvc.perform(get("/api/subjects/{id}", algorithmsId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(algorithmsId))
                .andExpect(jsonPath("$.code").value("SS407"))
                .andExpect(jsonPath("$.semester").value(1));

        mockMvc.perform(get("/api/subjects/{id}", 999999L))
                .andExpect(status().isNotFound());
    }
}
