package com.backend.service;

import com.backend.cross.ModerationAction;
import com.backend.cross.ReportStatus;
import com.backend.cross.ResourceStatus;
import com.backend.domain.governance.Decision;
import com.backend.domain.governance.Report;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.repository.ReportRepository;
import com.backend.repository.ResourceRepository;
import com.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;


@Service
public class ModerationService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;

    // Inyección de los tres repositorios necesarios
    public ModerationService(ReportRepository reportRepository,
                             UserRepository userRepository,
                             ResourceRepository resourceRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
    }

    //regla de negocio: un estudiante manda un reporte
    @Transactional
    public Report submitReport(Report newReport) {
        // Todo reporte nuevo nace con estado OPEN (Abierto)
        newReport.setStatus(ReportStatus.OPEN);
        newReport.setDate(LocalDateTime.now());

        return reportRepository.save(newReport);
    }

    //regla de negocio: un admin resuelve el reporte y hace o no sanción
    @Transactional
    public void resolveReport(Long reportId, Decision decision, Long adminId) {

        // Buscamos el reporte en la base de datos (falla si no existe)
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("reporte no encontrado"));

        //  Verificamos que el reporte no haya sido cerrado antes
        if (report.getStatus() == ReportStatus.RESOLVED || report.getStatus() == ReportStatus.DISMISSED) {
            throw new IllegalStateException("este reporte ya ha sido cerrado");
        }

        // Aplicamos la sanción dependiendo de la decisión del administrador
        ModerationAction action = decision.getAction();

        if (action == ModerationAction.REMOVE) {
            // Buscamos el recurso y lo ocultamos
            Resource resource = report.getResource();
            resource.setStatus(ResourceStatus.REMOVED);
            resourceRepository.save(resource);

        } else if (action == ModerationAction.SUSPEND_USER) {
            // Buscamos al dueño del recurso y le quitamos el acceso
            User offendingUser = report.getResource().getUploader();
            offendingUser.setVerified(false); // O un campo isActive = false
            userRepository.save(offendingUser);
        }

        // Actualizamos el estado del reporte a resuelto
        report.setStatus(ReportStatus.RESOLVED);

        reportRepository.save(report);
    }
}