package com.backend.dto;

import java.util.List;

/**
 * Respuesta de GET /api/users/me/collaborations con invitaciones pendientes y repositorios compartidos.
 */
public class CollaborationsResponseDto {

    private List<CollaboratorDto> invitations;
    private List<RepositoryResponseDto> collaboratedRepositories;

    public CollaborationsResponseDto(
            List<CollaboratorDto> invitations,
            List<RepositoryResponseDto> collaboratedRepositories
    ) {
        this.invitations = invitations;
        this.collaboratedRepositories = collaboratedRepositories;
    }

    public List<CollaboratorDto> getInvitations() { return invitations; }
    public List<RepositoryResponseDto> getCollaboratedRepositories() { return collaboratedRepositories; }
}
