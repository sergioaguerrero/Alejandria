/**
 * @file MySubjectsPage.jsx
 * @description View 15 — Mis materias de interés (FE-06, RF-08, RF-39).
 *
 * Allows students to choose their subjects of interest grouped by semester.
 * Pre-selects subjects matching user's current semester.
 */

import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import { useAuth } from '../../context/authContext.js';
import {
  getSubjects,
  getSubjectsOfInterest,
  groupBySemester,
  updateSubjectsOfInterest,
} from '../../services/index.js';

export default function MySubjectsPage() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([getSubjects(), getSubjectsOfInterest()])
      .then(([allSubjects, savedIds]) => {
        if (!active) return;
        setSubjects(allSubjects);

        const initialSet = new Set(savedIds);
        // With nothing saved yet, the subjects of the semester of the student
        // are preselected as a starting point.
        if (initialSet.size === 0 && user?.semester) {
          allSubjects
            .filter((subject) => subject.semester === Number(user.semester))
            .forEach((subject) => initialSet.add(subject.id));
        }

        setSelectedIds(initialSet);
      })
      .catch((serviceError) => {
        if (active) setError(serviceError?.message ?? 'No se pudieron cargar las materias.');
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const toggleSubject = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSemester = (semesterSubjects) => {
    const allSelected = semesterSubjects.every((s) => selectedIds.has(s.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      semesterSubjects.forEach((s) => {
        if (allSelected) next.delete(s.id);
        else next.add(s.id);
      });
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      await updateSubjectsOfInterest([...selectedIds]);
      setNotice('Materias de interés guardadas.');
    } catch (serviceError) {
      setError(serviceError?.message ?? 'No se pudieron guardar las materias.');
    } finally {
      setIsSaving(false);
    }
  };

  const groups = groupBySemester(subjects);
  const isLoading = !loaded;

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={240} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Mis materias de interés
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecciona las asignaturas que estás cursando o que deseas seguir para recibir novedades.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {groups.map((group) => {
          const allInSemester = group.subjects.every((subject) => selectedIds.has(subject.id));

          return (
            <Card key={group.semester} variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  sx={{
                    mb: 1.5,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6" component="h2" fontWeight={600}>
                    {`Semestre ${group.semester}`}
                  </Typography>

                  <Button
                    size="small"
                    variant="text"
                    onClick={() => toggleSemester(group.subjects)}
                  >
                    {allInSemester ? 'Deseleccionar todo' : 'Seleccionar semestre'}
                  </Button>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={1}>
                  {group.subjects.map((subject) => {
                    const isChecked = selectedIds.has(subject.id);
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={subject.id}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={() => toggleSubject(subject.id)}
                            />
                          }
                          label={
                            <Typography variant="body2" fontWeight={isChecked ? 600 : 400}>
                              {subject.name}
                            </Typography>
                          }
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando…' : 'Guardar materias de interés'}
        </Button>
      </Box>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
      >
        <Alert severity="success" variant="filled" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
