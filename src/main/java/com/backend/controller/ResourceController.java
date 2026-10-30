package com.backend.controller;

import com.backend.domain.repos.Resource;
import com.backend.service.ResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    // Inyectamos el servicio
    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Resource> uploadResource(
            @RequestPart("file") MultipartFile file,
            @RequestPart("data") Resource resourceData) throws IOException {

        // Delegamos el archivo y los datos al servicio
        // el servicio validará los 25MB, el formato PDF y extraerá los bytes para Oracle
        Resource savedResource = resourceService.uploadResource(file, resourceData);

        // Respondemos con éxito y devolvemos los datos del recurso guardado
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResource);
    }
}

