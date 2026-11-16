/**
 * @file MySubjectsPage.jsx
 * @description View 15 — Mis materias de interés (FE-06, RF-08, RF-39).
 *
 * Allows students to choose their subjects of interest grouped by semester
 * in collapsible accordions with a semester-wide checkbox and automatic saving.
 */

import { useEffect, useRef, useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Skeleton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const selectedIdsRef = useRef(new Set());
  const confirmedIdsRef = useRef(new Set());
  const saveRequestIdRef = useRef(0);
  const saveQueueRef = useRef(Promise.resolve());
  const isMountedRef = useRef(true);

  useEffect(() => {
    let active = true;
    isMountedRef.current = true;

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

        selectedIdsRef.current = initialSet;
        confirmedIdsRef.current = new Set(initialSet);
        setSelectedIds(initialSet);
        setExpandedSemesters(
          resolveInitialExpandedSemesters(allSubjects, initialSet, user?.semester),
        );
      })
      .catch((serviceError) => {
        if (active) setError(serviceError?.message ?? 'No se pudieron cargar las materias.');
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
      isMountedRef.current = false;
    };
  }, [user]);

  const persistSelection = (nextIds, successMessage) => {
    const requestId = ++saveRequestIdRef.current;

    setError('');

    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        await updateSubjectsOfInterest([...nextIds]);
        confirmedIdsRef.current = new Set(nextIds);
        if (!isMountedRef.current) return;

        if (requestId === saveRequestIdRef.current && successMessage) {
          setNotice(successMessage);
        }
      } catch (serviceError) {
        if (!isMountedRef.current) return;

        if (requestId === saveRequestIdRef.current) {
          const fallback = new Set(confirmedIdsRef.current);
          selectedIdsRef.current = fallback;
          setSelectedIds(fallback);
          setError(serviceError?.message ?? 'No se pudieron guardar las materias.');
        }
      }
    });
  };

  const toggleAccordion = (semester) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev);
      if (next.has(semester)) next.delete(semester);
      else next.add(semester);
      return next;
    });
  };

  const toggleSubject = (subject) => {
    const next = new Set(selectedIdsRef.current);
    if (next.has(subject.id)) next.delete(subject.id);
    else next.add(subject.id);

    selectedIdsRef.current = next;
    setSelectedIds(next);
    persistSelection(next, `Semestre ${subject.semester} guardado automáticamente.`);
  };

  const toggleSemester = (group) => {
    const current = selectedIdsRef.current;
    const allSelected =
      group.subjects.length > 0 && group.subjects.every((subject) => current.has(subject.id));
    const next = new Set(current);

    group.subjects.forEach((subject) => {
      if (allSelected) next.delete(subject.id);
      else next.add(subject.id);
    });

    selectedIdsRef.current = next;
    setSelectedIds(next);
    persistSelection(
      next,
      allSelected
        ? `Semestre ${group.semester} deseleccionado y guardado.`
        : `Semestre ${group.semester} seleccionado y guardado.`,
    );
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
          Marca materias individuales o usa la casilla de cada semestre para cubrir todas; los cambios se guardan automáticamente.
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
          const someInSemester = selectedCount > 0 && selectedCount < group.subjects.length;
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
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Tooltip
                    title={
                      allInSemester
                        ? `Deseleccionar todas las materias del Semestre ${group.semester}`
                        : `Seleccionar todas las materias del Semestre ${group.semester}`
                    }
                  >
                    <Box
                      component="span"
                      onClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === ' ' || event.key === 'Enter') {
                          event.stopPropagation();
                        }
                      }}
                      sx={{ display: 'inline-flex', alignItems: 'center', ml: -0.5 }}
                    >
                      <Checkbox
                        size="small"
                        sx={{ p: 0.5 }}
                        checked={allInSemester}
                        indeterminate={someInSemester}
                        onChange={() => toggleSemester(group)}
                        slotProps={{
                          input: {
                            'aria-label': `Seleccionar todas las materias del Semestre ${group.semester}`,
                          },
                        }}
                      />
                    </Box>
                  </Tooltip>
                  <Typography
                    variant="h6"
                    component="span"
                    fontWeight={600}
                    sx={{ lineHeight: 1.2 }}
                  >
                    {`Semestre ${group.semester}`}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${selectedCount}/${group.subjects.length}`}
                    color={allInSemester ? 'primary' : 'default'}
                    variant={selectedCount > 0 ? 'filled' : 'outlined'}
                  />
                </Stack>
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
                              onChange={() => toggleSubject(subject)}
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

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
      >
        <Alert severity="success" variant="filled" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
