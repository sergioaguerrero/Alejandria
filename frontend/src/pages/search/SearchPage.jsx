/**
 * @file SearchPage.jsx
 * @description View 11 — Search & Filters (FE-17, FE-32, RF-33, RF-34, RF-35, RF-36).
 *
 * Search bar with text parameter (?q=), filters by subject, topic, semester,
 * term and material type, sort orders (recent, popular, liked), and tabs for
 * Documents, Repositories and Users with pagination.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  ListSubheader,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';

import EmptyState from '../../components/common/EmptyState.jsx';
import DocumentItem from '../../components/documents/DocumentItem.jsx';
import RepositoryCard from '../../components/repositories/RepositoryCard.jsx';
import UserCard from '../../components/users/UserCard.jsx';
import { MATERIAL_TYPES, TERMS } from '../../mocks/catalogs.js';
import {
  getDocuments,
  getRepositories,
  getSubjects,
  groupBySemester,
  searchUsers,
  toggleFollowUser,
} from '../../services/index.js';
import { SELECT_MENU_PROPS } from '../../utils/selectMenuProps.js';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') ?? '';
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'repositories' | 'users'
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [search, setSearch] = useState(queryParam);
  const [syncedQuery, setSyncedQuery] = useState(queryParam);
  const [semester, setSemester] = useState(searchParams.get('sem') ?? '');
  const [subjectId, setSubjectId] = useState(searchParams.get('subject') ?? '');
  const [term, setTerm] = useState(searchParams.get('term') ?? '');
  const [materialType, setMaterialType] = useState(searchParams.get('type') ?? '');
  const [topic, setTopic] = useState(searchParams.get('topic') ?? '');
  const [order, setOrder] = useState(searchParams.get('order') ?? 'recent');

  // Results state
  const [docResults, setDocResults] = useState({ items: [], total: 0, totalPages: 1 });
  const [repoResults, setRepoResults] = useState({ items: [], total: 0, totalPages: 1 });
  const [userResults, setUserResults] = useState([]);
  const [busyUsername, setBusyUsername] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');

  // The search bar of the app bar changes ?q=. Instead of syncing it in an
  // effect, the state is adjusted during the render where the URL changed.
  if (queryParam !== syncedQuery) {
    setSyncedQuery(queryParam);
    setSearch(queryParam);
    setPage(1);
  }

  // Load subject list
  useEffect(() => {
    let active = true;
    getSubjects()
      .then((data) => {
        if (active) setSubjects(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Update query params when key filters change
  const updateUrlParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) updated.set(key, value);
      else updated.delete(key);
    });
    setSearchParams(updated, { replace: true });
  };

  const requestKey = [
    activeTab,
    search,
    subjectId,
    semester,
    term,
    materialType,
    topic,
    order,
    page,
  ].join('|');

  const isLoading = loadedKey !== requestKey;

  // Fetch search results. The flags only change from the asynchronous
  // callbacks, and a change of filters makes `isLoading` true again.
  useEffect(() => {
    let active = true;

    const fetchPromise =
      activeTab === 'documents'
        ? getDocuments({
            search,
            subjectId,
            semester,
            term,
            type: materialType,
            topic,
            order,
            page,
            size: 8,
          })
        : activeTab === 'repositories'
          ? getRepositories({
              search,
              subjectId,
              semester,
              order: order === 'liked' ? 'popular' : order,
              page,
              size: 9,
            })
          : searchUsers(search);

    fetchPromise
      .then((result) => {
        if (!active) return;
        if (activeTab === 'documents') setDocResults(result);
        else if (activeTab === 'repositories') setRepoResults(result);
        else setUserResults(result);
        setError('');
      })
      .catch((serviceError) => {
        if (active) setError(serviceError?.message ?? 'No se pudo buscar el contenido.');
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [requestKey, activeTab, search, subjectId, semester, term, materialType, topic, order, page]);

  const handleToggleFollow = async (targetProfile) => {
    setBusyUsername(targetProfile.username);
    try {
      const updated = await toggleFollowUser(targetProfile.username);
      setUserResults((prev) =>
        prev.map((item) => (item.username === updated.username ? updated : item)),
      );
      setNotice(
        updated.isFriend
          ? `Ahora tú y @${updated.username} son amigos (seguimiento mutuo).`
          : updated.isFollowing
            ? `Ahora sigues a @${updated.username}.`
            : `Dejaste de seguir a @${updated.username}.`,
      );
    } catch (serviceError) {
      setNotice(serviceError?.message ?? 'No se pudo actualizar el seguimiento.');
    } finally {
      setBusyUsername('');
    }
  };

  const semesters = [...new Set(subjects.map((s) => s.semester))].sort((a, b) => a - b);
  const visibleSubjects =
    semester === '' ? subjects : subjects.filter((s) => s.semester === Number(semester));

  const currentResult = activeTab === 'documents' ? docResults : repoResults;
  const hasResults =
    activeTab === 'users' ? userResults.length > 0 : currentResult.items.length > 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Explorar y buscar contenido
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filtra por materia, corte, tipo o tema, o busca compañeros para seguirlos.
        </Typography>
      </Stack>

      {/* Filter panel */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                size="small"
                label="Texto de búsqueda"
                placeholder={
                  activeTab === 'users'
                    ? 'Buscar estudiante por @usuario o semestre…'
                    : 'Título, tema o palabras clave…'
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateUrlParams({ q: e.target.value });
                  setPage(1);
                }}
                sx={{ flex: 2 }}
              />

              {activeTab !== 'users' && (
                <FormControl size="small" sx={{ flex: 1, minWidth: 160 }}>
                  <InputLabel id="order-label">Ordenar por</InputLabel>
                  <Select
                    labelId="order-label"
                    label="Ordenar por"
                    value={order}
                    onChange={(e) => {
                      setOrder(e.target.value);
                      updateUrlParams({ order: e.target.value === 'recent' ? '' : e.target.value });
                      setPage(1);
                    }}
                    MenuProps={SELECT_MENU_PROPS}
                  >
                    <MenuItem value="recent">Más recientes</MenuItem>
                    <MenuItem value="popular">Más vistos y descargados</MenuItem>
                    <MenuItem value="liked">Mejor valorados</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Stack>

            {activeTab !== 'users' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel id="search-sem-label">Semestre</InputLabel>
                  <Select
                    labelId="search-sem-label"
                    label="Semestre"
                    value={semester}
                    onChange={(e) => {
                      setSemester(e.target.value);
                      setSubjectId('');
                      updateUrlParams({ sem: e.target.value, subject: '' });
                      setPage(1);
                    }}
                    MenuProps={SELECT_MENU_PROPS}
                  >
                    <MenuItem value="">Todos los semestres</MenuItem>
                    {semesters.map((s) => (
                      <MenuItem key={s} value={s}>
                        {`Semestre ${s}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200, flex: 2 }}>
                  <InputLabel id="search-sub-label">Materia</InputLabel>
                  <Select
                    labelId="search-sub-label"
                    label="Materia"
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      updateUrlParams({ subject: e.target.value });
                      setPage(1);
                    }}
                    MenuProps={SELECT_MENU_PROPS}
                  >
                    <MenuItem value="">Todas las materias</MenuItem>
                    {groupBySemester(visibleSubjects).flatMap((group) => [
                      <ListSubheader key={`s-${group.semester}`}>
                        {`Semestre ${group.semester}`}
                      </ListSubheader>,
                      ...group.subjects.map((sub) => (
                        <MenuItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </MenuItem>
                      )),
                    ])}
                  </Select>
                </FormControl>

                {activeTab === 'documents' && (
                  <>
                    <TextField
                      size="small"
                      label="Tema"
                      placeholder="Ej. recursividad"
                      value={topic}
                      onChange={(e) => {
                        setTopic(e.target.value);
                        updateUrlParams({ topic: e.target.value });
                        setPage(1);
                      }}
                      sx={{ minWidth: 160, flex: 1 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                      <InputLabel id="search-term-label">Corte</InputLabel>
                      <Select
                        labelId="search-term-label"
                        label="Corte"
                        value={term}
                        onChange={(e) => {
                          setTerm(e.target.value);
                          updateUrlParams({ term: e.target.value });
                          setPage(1);
                        }}
                        MenuProps={SELECT_MENU_PROPS}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {TERMS.map((t) => (
                          <MenuItem key={t.value} value={t.value}>
                            {t.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                      <InputLabel id="search-type-label">Tipo de material</InputLabel>
                      <Select
                        labelId="search-type-label"
                        label="Tipo de material"
                        value={materialType}
                        onChange={(e) => {
                          setMaterialType(e.target.value);
                          updateUrlParams({ type: e.target.value });
                          setPage(1);
                        }}
                        MenuProps={SELECT_MENU_PROPS}
                      >
                        <MenuItem value="">Todos los tipos</MenuItem>
                        {MATERIAL_TYPES.map((mt) => (
                          <MenuItem key={mt.value} value={mt.value}>
                            {mt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_e, val) => {
          setActiveTab(val);
          setPage(1);
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab
          value="documents"
          icon={<DescriptionOutlinedIcon />}
          iconPosition="start"
          label={`Documentos (${docResults.total || 0})`}
        />
        <Tab
          value="repositories"
          icon={<FolderOpenIcon />}
          iconPosition="start"
          label={`Repositorios (${repoResults.total || 0})`}
        />
        <Tab
          value="users"
          icon={<PeopleOutlinedIcon />}
          iconPosition="start"
          label={`Usuarios (${userResults.length || 0})`}
        />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results grid / list */}
      {isLoading ? (
        <Stack spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={85} />
          ))}
        </Stack>
      ) : !hasResults ? (
        <EmptyState
          icon={
            activeTab === 'documents'
              ? DescriptionOutlinedIcon
              : activeTab === 'repositories'
                ? FolderOpenIcon
                : PeopleOutlinedIcon
          }
          title={`No encontramos ${
            activeTab === 'documents'
              ? 'documentos'
              : activeTab === 'repositories'
                ? 'repositorios'
                : 'usuarios'
          }`}
          description="Intenta ajustando el término de búsqueda o cambiando los filtros seleccionados."
        />
      ) : activeTab === 'documents' ? (
        <Stack spacing={2}>
          {currentResult.items.map((doc) => (
            <DocumentItem key={doc.id} document={doc} />
          ))}
        </Stack>
      ) : activeTab === 'repositories' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {currentResult.items.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {userResults.map((profile) => (
            <Grid key={profile.username} size={{ xs: 12, sm: 6, md: 4 }}>
              <UserCard
                profile={profile}
                isBusy={busyUsername === profile.username}
                onToggleFollow={handleToggleFollow}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab !== 'users' && currentResult.totalPages > 1 && (
        <Stack sx={{ mt: 4, alignItems: 'center' }}>
          <Pagination
            count={currentResult.totalPages}
            page={page}
            onChange={(_e, v) => setPage(v)}
            color="primary"
          />
        </Stack>
      )}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice('')}
        message={notice}
      />
    </Box>
  );
}
