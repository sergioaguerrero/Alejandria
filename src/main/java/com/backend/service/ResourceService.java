package com.backend.service;

import com.backend.repository.ResourceRepository;
import com.backend.domain.repos.Resource; // Asegúrate de que la ruta coincida con tu paquete
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    // Inyección de dependencias (como en AuthService)
    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    // Método principal para subir el documento
    // Recibe el archivo físico (MultipartFile) y los datos de texto (Resource)
    public Resource uploadResource(MultipartFile file, Resource resourceData) throws IOException {

        // Regla de negocio: Validar el tamaño (Máximo 25 MB)
        long maxSizeInBytes = 25 * 1024 * 1024; // 25 MB convertidos a bytes

        if (file.getSize() > maxSizeInBytes) {
            throw new IllegalArgumentException("El tamaño del documento supera los 25 MB");
        }

        // Regla de negocio: Validar el formato (MimeType)
        String mimeType = file.getContentType();

        // Aquí validamos que sea un PDF, más adelante lo hacemos también con word y con imagen
        if (mimeType == null || !mimeType.equals("application/pdf")) {
            throw new IllegalArgumentException("formato de documento invalido, solo se permite PDF por ahora");
        }

        // se extraen los bytes del archivo y se asignan a la entidad
        // Esto es lo que viajará a Oracle para guardarse como BLOB
        resourceData.setFileBytes(file.getBytes());
        resourceData.setMimeType(mimeType);
        resourceData.setFileSizeBytes(file.getSize());

        // se llama al repository para que lo guarde
        return resourceRepository.save(resourceData);


        //conceptos
        //MultipartFile file: Es la interfaz de Spring Boot que representa el archivo físico (el PDF, Word, etc.) que Sergio enviará desde el frontend en React. Te permite acceder al peso (getSize()), al tipo de archivo (getContentType()) y al contenido crudo (getBytes()).
        //throws IOException: Al manipular archivos físicos o extraer bytes, siempre existe el riesgo de que el archivo esté corrupto o la lectura falle. Esta instrucción le avisa a Java que este método podría fallar por un error de entrada/salida (I/O)
        //resourceData: Este es el objeto que contiene la metadata (el título del documento, la descripción, a qué materia pertenece). En el controlador, dev2 se encargará de unir el archivo físico con estos datos de texto y pasártelos limpios a este método.
    }
}