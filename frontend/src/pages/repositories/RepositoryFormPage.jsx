/**
 * @file RepositoryFormPage.jsx
 * @description View 8 — Create / Edit repository (FE-11, endpoints BE-12).
 *
 * Handles both creating a new repository and editing an existing one.
 * Verifies that the editor is the owner, and provides delete repository action.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';

import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import SubjectAccordionSelect from '../../components/forms/SubjectAccordionSelect.jsx';
import { useAuth } from '../../context/authContext.js';
import {
  createRepository,
  deleteRepository,
  getRepository,
  getSubjects,
  updateRepository,
} from '../../services/index.js';

export default function RepositoryFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loadedId, setLoadedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load subject catalog
  useEffect(() => {
    let active = true;
    getSubjects()
      .then((data) => {
        if (active) setSubjects(data);
      })
      .catch((err) => {
        if (active) setGeneralError(err?.message ?? 'Error al cargar las materias.');
      });
    return () => {
      active = false;
    };
  }, []);

  // If editing, load the existing repository
  useEffect(() => {
    if (!isEditing) return;

    let active = true;

    getRepository(id)
      .then((repository) => {
        if (!active) return;
        if (user && repository.authorUsername !== user.username) {
          navigate('/403', { replace: true });
          return;
        }
        setName(repository.name);
        setDescription(repository.description);
        setSubjectId(repository.subjectId);
      })
      .catch((err) => {
        if (active) setGeneralError(err?.message ?? 'No se pudo cargar el repositorio.');
      })
      .finally(() => {
        if (active) setLoadedId(id);
      });

    return () => {
      active = false;
    };
  }, [id, isEditing, user, navigate]);

  // The form waits for the repository only while it is being edited.
  const isLoading = isEditing && loadedId !== id;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    const errors = {};
    if (name.trim().length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.';
    if (description.trim().length < 10) {
      errors.description = 'Describe el repositorio en al menos 10 caracteres.';
    }
    if (!subjectId) errors.subjectId = 'Selecciona una materia.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateRepository(id, { name, description, subjectId });
        navigate(`/repositories/${id}`, { replace: true });
      } else {
        const created = await createRepository({ name, description, subjectId });
        navigate(`/repositories/${created.id}`, { replace: true });
      }
    } catch (err) {
      if (err?.fields) {
        setFieldErrors(err.fields);
      } else {
        setGeneralError(err?.message ?? 'Ocurrió un error al guardar el repositorio.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRepository(id);
      setConfirmOpen(false);
      navigate('/', { replace: true });
    } catch (err) {
      setConfirmOpen(false);
      setGeneralError(err?.message ?? 'No se pudo eliminar el repositorio.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={180} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={380} />
      </Box>
    );
  }

  return (
    <Box>
      <Button
        component={RouterLink}
        to={isEditing ? `/repositories/${id}` : '/'}
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, px: 0 }}
      >
        {isEditing ? 'Volver al repositorio' : 'Volver al inicio'}
      </Button>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            <Typography variant="h5" component="h1" fontWeight={600}>
              {isEditing ? 'Editar repositorio' : 'Crear nuevo repositorio'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditing
                ? 'Actualiza la información básica del repositorio de estudio.'
                : 'Crea un espacio para recopilar y organizar documentos de una materia.'}
            </Typography>
          </Stack>

          {generalError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {generalError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={3}>
              <TextField
                label="Nombre del repositorio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name ?? 'Ejemplo: Programación 2 - Grupo 01'}
                fullWidth
                required
                disabled={isSubmitting}
              />

              <TextField
                label="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={Boolean(fieldErrors.description)}
                helperText={fieldErrors.description ?? 'Explica brevemente qué contenido recopilarás.'}
                multiline
                minRows={3}
                fullWidth
                required
                disabled={isSubmitting}
              />

              <SubjectAccordionSelect
                fullWidth
                required
                subjects={subjects}
                value={subjectId}
                onChange={setSubjectId}
                emptyLabel="Selecciona una materia"
                error={Boolean(fieldErrors.subjectId)}
                helperText={fieldErrors.subjectId || ''}
                disabled={isSubmitting}
              />

              <Divider />

              <Stack
                direction="row"
                spacing={2}
                sx={{ justifyContent: isEditing ? 'space-between' : 'flex-end', alignItems: 'center' }}
              >
                {isEditing && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlinedIcon />}
                    onClick={() => setConfirmOpen(true)}
                    disabled={isSubmitting}
                  >
                    Eliminar
                  </Button>
                )}

                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="text"
                    component={RouterLink}
                    to={isEditing ? `/repositories/${id}` : '/'}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear repositorio'}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {isEditing && (
        <ConfirmDialog
          open={confirmOpen}
          title="Eliminar repositorio"
          message={`Se eliminará "${name}" y todos sus documentos. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          isBusy={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </Box>
  );
}
