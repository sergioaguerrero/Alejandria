/**
 * @file HomePage.jsx
 * @description View 6 — Home / Explore repositories (FE-10, endpoints BE-12 and BE-20).
 *
 * A grid of repository cards with a cascading filter (semester → subject) and
 * pagination. It shows skeletons while loading and an empty state when there is
 * nothing to show. The "Create repository" button goes to view 8 and each card
 * goes to the repository detail (view 7).
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import SubjectAccordionSelect from '../../components/forms/SubjectAccordionSelect.jsx';
import RepositoryCard from '../../components/repositories/RepositoryCard.jsx';
import { getRepositories } from '../../services/repositoryService.js';
import { getSubjects } from '../../services/subjectService.js';
import { SELECT_MENU_PROPS } from '../../utils/selectMenuProps.js';

const PAGE_SIZE = 9;

/** Grid shared by the cards and the loading skeletons. */
const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)',
  },
  gap: 2.5,
};

export default function HomePage() {
  const [subjects, setSubjects] = useState([]);
  const [semester, setSemester] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Loads the subject catalog once, for the filter.
  useEffect(() => {
    let active = true;

    getSubjects()
      .then((list) => {
        if (active) setSubjects(list);
      })
      .catch(() => {
        // If the catalog fails, the filter simply stays empty.
      });

    return () => {
      active = false;
    };
  }, []);

  // Loads the repositories again when the filter or the page changes. The
  // loading flag is turned on by the handlers that start a new search, so the
  // effect only talks to the external system (the service).
  useEffect(() => {
    let active = true;

    getRepositories({
      subjectId: subjectId === '' ? null : subjectId,
      semester: semester === '' ? null : semester,
      page,
      size: PAGE_SIZE,
    })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((serviceError) => {
        if (active) {
          setError(serviceError?.message ?? 'No se pudieron cargar los repositorios.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [semester, subjectId, page]);

  /** Shows the skeletons again while a new search is on its way. */
  const startLoading = () => {
    setIsLoading(true);
    setError('');
  };

  // Changing the semester clears the subject, because the subject list depends
  // on the semester that is selected.
  const handleSemesterChange = (event) => {
    startLoading();
    setSemester(event.target.value);
    setSubjectId('');
    setPage(1);
  };

  const handleSubjectChange = (nextSubjectId) => {
    startLoading();
    setSubjectId(nextSubjectId);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    startLoading();
    setPage(value);
  };

  const semesters = [...new Set(subjects.map((subject) => subject.semester))].sort(
    (a, b) => a - b,
  );

  const visibleSubjects =
    semester === '' ? subjects : subjects.filter((subject) => subject.semester === semester);

  const items = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Explorar repositorios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Encuentra material de estudio por semestre y materia, y sigue las rutas que comparte la
          comunidad.
        </Typography>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="semester-filter-label">Semestre</InputLabel>
            <Select
              labelId="semester-filter-label"
              label="Semestre"
              value={semester}
              onChange={handleSemesterChange}
              MenuProps={SELECT_MENU_PROPS}
            >
              <MenuItem value="">Todos los semestres</MenuItem>
              {semesters.map((value) => (
                <MenuItem key={value} value={value}>
                  {`Semestre ${value}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <SubjectAccordionSelect
            size="small"
            subjects={visibleSubjects}
            value={subjectId}
            onChange={handleSubjectChange}
            emptyLabel="Todas las materias"
            sx={{ minWidth: 240 }}
          />
        </Stack>

        <Button
          component={RouterLink}
          to="/repositories/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Crear repositorio
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={GRID_SX}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={210} />
          ))}
        </Box>
      ) : items.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No encontramos repositorios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {semester === '' && subjectId === ''
              ? 'Todavía no hay repositorios publicados.'
              : 'Prueba con otro semestre u otra materia, o quita los filtros.'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={GRID_SX}>
            {items.map((repository) => (
              <RepositoryCard key={repository.id} repository={repository} />
            ))}
          </Box>

          {totalPages > 1 && (
            <Stack sx={{ mt: 4, alignItems: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
