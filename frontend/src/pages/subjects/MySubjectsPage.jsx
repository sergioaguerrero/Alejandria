/**
 * @file MySubjectsPage.jsx
 * @description View 15 — Mis materias de interés (FE-06, RF-08, RF-39).
 *
 * Allows students to choose their subjects of interest grouped by semester
 * using collapsible semester accordions.
 */

import { useEffect, useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';

import { useAuth } from '../../context/authContext.js';
import {
  getSubjects,
  getSubjectsOfInterest,
  groupBySemester,
  updateSubjectsOfInterest,
} from '../../services/index.js';

/**
 * Determines which semester accordions should start expanded once subjects load.
 * @param {object[]} allSubjects
 * @param {Set<number>} initialSet
 * @param {number|string|undefined} userSemester
 * @returns {Set<number>}
 */
function resolveInitialExpandedSemesters(allSubjects, initialSet, userSemester) {
  const expanded = new Set(
    allSubjects
      .filter((subject) => initialSet.has(subject.id))
      .map((subject) => subject.semester),
  );

  if (expanded.size === 0 && userSemester) {
    expanded.add(Number(userSemester));
  }

  if (expanded.size === 0 && allSubjects.length > 0) {
    expanded.add(allSubjects[0].semester);
  }

  return expanded;
}

export default function MySubjectsPage() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState(new Set());
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
        setExpandedSemesters(resolveInitialExpandedSemesters(allSubjects, initialSet, user?.semester));
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

  const toggleAccordion = (semester) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev);
      if (next.has(semester)) next.delete(semester);
      else next.add(semester);
      return next;
    });
  };

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

      <Stack spacing={1.5}>
        {groups.map((group) => {
          const selectedCount = group.subjects.filter((subject) =>
            selectedIds.has(subject.id),
          ).length;
          const allInSemester =
            group.subjects.length > 0 && selectedCount === group.subjects.length;
          const isExpanded = expandedSemesters.has(group.semester);

          return (
            <Accordion
              key={group.semester}
              variant="outlined"
              disableGutters
              expanded={isExpanded}
              onChange={() => toggleAccordion(group.semester)}
              slotProps={{ heading: { component: 'h2' } }}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                '&::before': { display: 'none' },
                '&:first-of-type, &:last-of-type, &:not(:first-of-type):not(:last-of-type)': {
                  borderRadius: 2,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`semester-${group.semester}-content`}
                id={`semester-${group.semester}-header`}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    mr: 1,
                  },
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Typography variant="subtitle1" component="span" fontWeight={700}>
                    {`Semestre ${group.semester}`}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${selectedCount}/${group.subjects.length}`}
                    color={allInSemester ? 'primary' : 'default'}
                    variant={selectedCount > 0 ? 'filled' : 'outlined'}
                  />
                </Stack>

                <Button
                  size="small"
                  variant="text"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSemester(group.subjects);
                  }}
                >
                  {allInSemester ? 'Deseleccionar todo' : 'Seleccionar semestre'}
                </Button>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 0 }}>
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
              </AccordionDetails>
            </Accordion>
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
