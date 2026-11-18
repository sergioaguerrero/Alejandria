/**
 * @file ProfilePage.jsx
 * @description View 14 — My profile (FE-07, endpoint BE-08).
 *
 * Modern academic profile layout with institutional gradient banner, overlapping avatar,
 * statistics counters, tabs for repositories and uploaded documents, and an edit modal.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EmptyState from '../../components/common/EmptyState.jsx';
import RepositoryCard from '../../components/repositories/RepositoryCard.jsx';
import ProfileBioAndContacts, { ContactTypeIcon } from '../../components/users/ProfileBioAndContacts.jsx';
import ProfileCounters from '../../components/users/ProfileCounters.jsx';
import { useAuth } from '../../context/authContext.js';
import { MATERIAL_TYPES, TERMS } from '../../mocks/catalogs.js';
import {
  getDocumentsByUser,
  getPublicProfile,
  getRepositoriesByUser,
} from '../../services/index.js';
import {
  CONTACT_METHODS,
  MAX_BIO_LENGTH,
  MAX_CONTACTS,
  MAX_CONTACT_LABEL_LENGTH,
  MAX_CONTACT_VALUE_LENGTH,
  getContactMeta,
  validateBioAndContacts,
} from '../../utils/contactMethods.js';
import { SELECT_MENU_PROPS } from '../../utils/selectMenuProps.js';
import { initials } from '../../utils/users.js';

const SEMESTERS = Array.from({ length: 10 }, (_, index) => index + 1);

const emptyFields = () => ({});
const emptyPasswordFields = () => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const createEmptyContact = () => ({
  type: 'WHATSAPP',
  value: '',
  label: '',
});

function materialTypeLabel(type) {
  return MATERIAL_TYPES.find((m) => m.value === type)?.label ?? type;
}

function termLabel(term) {
  return TERMS.find((t) => t.value === term)?.label ?? `Corte ${term}`;
}

export default function ProfilePage() {
  const { user, isAdmin, updateProfile, refreshUser, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState('repositories'); // 'repositories' | 'documents'
  const [repositories, setRepositories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [socialStats, setSocialStats] = useState({ followers: 0, following: 0 });
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTab, setEditTab] = useState('profile'); // 'profile' | 'contacts' | 'password'

  // Profile form state
  const [profileValues, setProfileValues] = useState(() => ({
    name: user?.name ?? '',
    username: user?.username ?? '',
    semester: user?.semester ?? '',
    bio: user?.bio ?? '',
    contacts: Array.isArray(user?.contacts)
      ? user.contacts.map((c) => ({
          type: c.type ?? 'WHATSAPP',
          value: c.value ?? '',
          label: c.label ?? '',
        }))
      : [],
  }));
  const [profileErrors, setProfileErrors] = useState(emptyFields);
  const [profileGeneralError, setProfileGeneralError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form state
  const [passwordValues, setPasswordValues] = useState(emptyPasswordFields);
  const [passwordErrors, setPasswordErrors] = useState(emptyPasswordFields);
  const [passwordGeneralError, setPasswordGeneralError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [notice, setNotice] = useState(null);

  const currentUsername = user?.username ?? '';
  const isLoading = !user || loadedKey !== `${currentUsername}:${reloadKey}`;

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    if (!currentUsername) return undefined;
    let active = true;

    Promise.all([
      getRepositoriesByUser(currentUsername),
      getDocumentsByUser(currentUsername),
      getPublicProfile(currentUsername).catch(() => null),
    ])
      .then(([userRepos, userDocs, publicProfile]) => {
        if (!active) return;
        setRepositories(userRepos);
        setDocuments(userDocs);
        setSocialStats({
          followers: publicProfile?.followersCount ?? 0,
          following: publicProfile?.followingCount ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadedKey(`${currentUsername}:${reloadKey}`);
      });

    return () => {
      active = false;
    };
  }, [currentUsername, reloadKey]);

  const handleOpenEditModal = (initialTab = 'profile') => {
    setProfileValues({
      name: user?.name ?? '',
      username: user?.username ?? '',
      semester: user?.semester ?? '',
      bio: user?.bio ?? '',
      contacts: Array.isArray(user?.contacts)
        ? user.contacts.map((c) => ({
            type: c.type ?? 'WHATSAPP',
            value: c.value ?? '',
            label: c.label ?? '',
          }))
        : [],
    });
    setProfileErrors(emptyFields());
    setProfileGeneralError('');
    setPasswordValues(emptyPasswordFields());
    setPasswordErrors(emptyPasswordFields());
    setPasswordGeneralError('');
    setEditTab(initialTab);
    setIsEditModalOpen(true);
  };

  const focusTabForFieldErrors = (fields) => {
    const keys = Object.keys(fields || {});
    const hasPersonalError = keys.some((k) => ['name', 'username', 'semester', 'bio'].includes(k));
    const hasContactError = keys.some((k) => k === 'contacts' || k.startsWith('contacts.'));
    if (editTab === 'profile' && !hasPersonalError && hasContactError) {
      setEditTab('contacts');
    } else if (editTab === 'contacts' && !hasContactError && hasPersonalError) {
      setEditTab('profile');
    }
  };

  const handleAddContact = () => {
    setProfileValues((prev) => {
      if (prev.contacts.length >= MAX_CONTACTS) return prev;
      return { ...prev, contacts: [...prev.contacts, createEmptyContact()] };
    });
    setProfileErrors((prev) => ({ ...prev, contacts: '' }));
  };

  const handleContactChange = (index, field, value) => {
    setProfileValues((prev) => ({
      ...prev,
      contacts: prev.contacts.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    }));
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next[`contacts.${index}.${field}`];
      delete next.contacts;
      return next;
    });
  };

  const handleMoveContact = (index, direction) => {
    setProfileValues((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.contacts.length) return prev;
      const next = [...prev.contacts];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return { ...prev, contacts: next };
    });
    setProfileErrors((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith('contacts.')) next[k] = v;
      }
      return next;
    });
  };

  const handleRemoveContact = (index) => {
    setProfileValues((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_item, idx) => idx !== index),
    }));
    setProfileErrors((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith('contacts.') && k !== 'contacts') next[k] = v;
      }
      return next;
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileGeneralError('');
    setProfileErrors(emptyFields());

    const clientFields = validateBioAndContacts({
      bio: profileValues.bio,
      contacts: profileValues.contacts,
    });
    if (Object.keys(clientFields).length > 0) {
      setProfileErrors(clientFields);
      focusTabForFieldErrors(clientFields);
      return;
    }

    setIsSavingProfile(true);

    try {
      await updateProfile({
        name: profileValues.name,
        username: profileValues.username,
        semester: isAdmin || profileValues.semester === '' ? null : Number(profileValues.semester),
        bio: profileValues.bio,
        contacts: profileValues.contacts,
      });
      setIsEditModalOpen(false);
      setNotice({ severity: 'success', message: 'Tus datos de perfil se actualizaron con éxito.' });
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (err?.fields) {
        setProfileErrors(err.fields);
        focusTabForFieldErrors(err.fields);
      } else {
        setProfileGeneralError(err?.message ?? 'No se pudieron guardar los cambios.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordGeneralError('');
    setPasswordErrors(emptyPasswordFields());
    setIsSavingPassword(true);

    try {
      await changePassword({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
        confirmPassword: passwordValues.confirmPassword,
      });
      setPasswordValues(emptyPasswordFields());
      setIsEditModalOpen(false);
      setNotice({ severity: 'success', message: 'Tu contraseña ha sido actualizada.' });
    } catch (err) {
      if (err?.fields) {
        setPasswordErrors(err.fields);
      } else {
        setPasswordGeneralError(err?.message ?? 'No se pudo actualizar la contraseña.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const totalLikes =
    repositories.reduce((acc, repo) => acc + (repo.likes || 0), 0) +
    documents.reduce((acc, doc) => acc + (doc.likes || 0), 0);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Banner using the project's official color palette */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 150, sm: 200, md: 230 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0B1220 0%, #152944 35%, #1D3557 70%, #2563EB 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.6)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      />

      {/* Profile Header Information */}
      <Box sx={{ px: { xs: 2, sm: 3 }, position: 'relative', mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'flex-start' },
            justifyContent: 'space-between',
            gap: 2.5,
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'flex-start' },
              gap: { xs: 1.5, sm: 2.5 },
            }}
          >
            <Avatar
              sx={{
                width: { xs: 90, sm: 110, md: 120 },
                height: { xs: 90, sm: 110, md: 120 },
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                fontWeight: 700,
                bgcolor: '#F59E0B',
                color: '#0B1220',
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: 3,
                mt: { xs: -5.5, sm: -7, md: -7.5 },
                flexShrink: 0,
              }}
            >
              {initials(user)}
            </Avatar>

            <Box sx={{ pt: { xs: 0, sm: 1.5 } }}>
              <Typography variant="h4" component="h1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {user?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.25 }}>
                @{user?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {isAdmin
                  ? 'Administración · Universidad Popular del Cesar'
                  : `Ingeniería de Sistemas · Semestre ${user?.semester ?? '—'} · Universidad Popular del Cesar`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ pt: { xs: 0, md: 2 }, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditOutlinedIcon />}
              onClick={() => handleOpenEditModal('profile')}
              sx={{ px: 2.5, py: 1 }}
            >
              Editar perfil
            </Button>
          </Box>
        </Box>

        {/* Counters Row */}
        <ProfileCounters
          followers={socialStats.followers}
          following={socialStats.following}
          likes={totalLikes}
          linkSocial
        />

        {/* Bio & Contact Methods */}
        <ProfileBioAndContacts
          bio={user?.bio}
          contacts={user?.contacts}
          isOwnProfile
          onEdit={handleOpenEditModal}
          onNotice={setNotice}
        />
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          aria-label="Pestañas de contenidos del perfil"
        >
          <Tab
            value="repositories"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Repositorios</span>
                <Chip size="small" label={repositories.length} />
              </Box>
            }
          />
          <Tab
            value="documents"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Documentos</span>
                <Chip size="small" label={documents.length} />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Loading State */}
      {isLoading && (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((key) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={180} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Repositories Tab Content */}
      {!isLoading && activeTab === 'repositories' && (
        <>
          {repositories.length === 0 ? (
            <Card variant="outlined">
              <CardContent>
                <EmptyState
                  icon={FolderOutlinedIcon}
                  title="Aún no tienes repositorios creados"
                  description="Crea tu primer espacio de estudio para organizar tus apuntes y guías por corte."
                  action={
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/repositories/new"
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      Crear repositorio
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {repositories.map((repo) => (
                <Grid key={repo.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <RepositoryCard repository={repo} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Documents Tab Content */}
      {!isLoading && activeTab === 'documents' && (
        <>
          {documents.length === 0 ? (
            <Card variant="outlined">
              <CardContent>
                <EmptyState
                  icon={DescriptionOutlinedIcon}
                  title="No has subido documentos todavía"
                  description="Comparte apuntes, talleres o resúmenes con la comunidad de tu carrera."
                />
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={2}>
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  variant="outlined"
                  sx={{
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
                          <Chip
                            size="small"
                            variant="outlined"
                            color="primary"
                            label={doc.subject?.name ?? 'Sin materia'}
                          />
                          <Chip size="small" label={materialTypeLabel(doc.type)} />
                          <Chip size="small" variant="outlined" label={termLabel(doc.term)} />
                        </Box>

                        <Typography
                          component={RouterLink}
                          to={`/documents/${doc.id}`}
                          variant="subtitle1"
                          fontWeight={600}
                          sx={{
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                          }}
                        >
                          {doc.title}
                        </Typography>

                        {doc.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mt: 0.5,
                            }}
                          >
                            {doc.description}
                          </Typography>
                        )}
                      </Box>

                      {/* Document metrics */}
                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VisibilityOutlinedIcon fontSize="small" />
                          <Typography variant="caption">{doc.views || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DownloadOutlinedIcon fontSize="small" />
                          <Typography variant="caption">{doc.downloads || 0}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Edit Profile & Security Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => !isSavingProfile && !isSavingPassword && setIsEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          Modificar perfil y seguridad
        </DialogTitle>

        <Tabs
          value={editTab}
          onChange={(_e, v) => setEditTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            value="profile"
            icon={<PersonOutlineIcon />}
            iconPosition="start"
            label="Datos personales"
          />
          <Tab
            value="contacts"
            icon={<ContactMailOutlinedIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span>Contacto</span>
                <Chip size="small" label={profileValues.contacts.length} />
              </Box>
            }
          />
          <Tab
            value="password"
            icon={<LockOutlinedIcon />}
            iconPosition="start"
            label="Seguridad"
          />
        </Tabs>

        <DialogContent sx={{ pt: 3 }}>
          {(editTab === 'profile' || editTab === 'contacts') && (
            <Box component="form" onSubmit={handleProfileSubmit} noValidate id="profile-form">
              {editTab === 'profile' && (
                <Stack spacing={2.5}>
                  {profileGeneralError && <Alert severity="error">{profileGeneralError}</Alert>}

                  <TextField
                    label="Nombre completo"
                    value={profileValues.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfileValues((prev) => ({ ...prev, name: val }));
                      setProfileErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    error={Boolean(profileErrors.name)}
                    helperText={profileErrors.name}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Nombre de usuario"
                    value={profileValues.username}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfileValues((prev) => ({ ...prev, username: val }));
                      setProfileErrors((prev) => ({ ...prev, username: '' }));
                    }}
                    error={Boolean(profileErrors.username)}
                    helperText={profileErrors.username || 'Único en la plataforma. Visible para los demás.'}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Correo institucional"
                    value={user?.email ?? ''}
                    disabled
                    helperText="El correo institucional está verificado y no puede modificarse."
                    fullWidth
                  />

                  {!isAdmin && (
                    <TextField
                      select
                      label="Semestre actual"
                      value={profileValues.semester}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfileValues((prev) => ({ ...prev, semester: val }));
                        setProfileErrors((prev) => ({ ...prev, semester: '' }));
                      }}
                      error={Boolean(profileErrors.semester)}
                      helperText={profileErrors.semester || 'Opcional. Te sugerirá materias afines.'}
                      fullWidth
                      slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
                    >
                      <MenuItem value="">Sin especificar</MenuItem>
                      {SEMESTERS.map((s) => (
                        <MenuItem key={s} value={s}>
                          {`Semestre ${s}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}

                  <TextField
                    label="Descripción / Biografía"
                    value={profileValues.bio}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfileValues((prev) => ({ ...prev, bio: val }));
                      setProfileErrors((prev) => ({ ...prev, bio: '' }));
                    }}
                    error={Boolean(profileErrors.bio)}
                    helperText={
                      profileErrors.bio ||
                      `Cuéntale a la comunidad qué estudias o tus intereses académicos (${(profileValues.bio || '').length}/${MAX_BIO_LENGTH}).`
                    }
                    placeholder="Ej. Estudiante de Ingeniería de Sistemas interesado en bases de datos y desarrollo backend."
                    multiline
                    minRows={3}
                    maxRows={6}
                    slotProps={{ htmlInput: { maxLength: MAX_BIO_LENGTH + 50 } }}
                    fullWidth
                  />
                </Stack>
              )}

              {editTab === 'contacts' && (
                <Stack spacing={2}>
                  {profileGeneralError && <Alert severity="error">{profileGeneralError}</Alert>}
                  {profileErrors.contacts && <Alert severity="error">{profileErrors.contacts}</Alert>}

                  <Typography variant="body2" color="text.secondary">
                    Publica los medios por los que otros estudiantes pueden contactarte para estudiar,
                    colaborar en repositorios o resolver dudas (máximo {MAX_CONTACTS}).
                  </Typography>

                  {profileValues.contacts.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{ p: 2.5, textAlign: 'center', borderStyle: 'dashed' }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Todavía no tienes medios de contacto configurados.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddContact}
                      >
                        Agregar primer medio de contacto
                      </Button>
                    </Paper>
                  ) : (
                    <Stack spacing={2}>
                      {profileValues.contacts.map((contact, index) => {
                        const meta = getContactMeta(contact.type);
                        const valueError = profileErrors[`contacts.${index}.value`];
                        const labelError = profileErrors[`contacts.${index}.label`];
                        const typeError = profileErrors[`contacts.${index}.type`];

                        return (
                          <Paper
                            key={index}
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2 }}
                          >
                            <Stack
                              direction="row"
                              sx={{
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 1.5,
                              }}
                            >
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <ContactTypeIcon type={contact.type} />
                                <Typography variant="subtitle2" fontWeight={700}>
                                  {`Contacto #${index + 1}`}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Subir">
                                  <span>
                                    <IconButton
                                      size="small"
                                      aria-label="Mover contacto arriba"
                                      disabled={index === 0}
                                      onClick={() => handleMoveContact(index, -1)}
                                    >
                                      <ArrowUpwardIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Bajar">
                                  <span>
                                    <IconButton
                                      size="small"
                                      aria-label="Mover contacto abajo"
                                      disabled={index === profileValues.contacts.length - 1}
                                      onClick={() => handleMoveContact(index, 1)}
                                    >
                                      <ArrowDownwardIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Eliminar contacto">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    aria-label="Eliminar contacto"
                                    onClick={() => handleRemoveContact(index)}
                                  >
                                    <DeleteOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>

                            <Grid container spacing={1.5}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  select
                                  size="small"
                                  label="Plataforma / Tipo"
                                  value={contact.type}
                                  onChange={(e) => handleContactChange(index, 'type', e.target.value)}
                                  error={Boolean(typeError)}
                                  helperText={typeError}
                                  fullWidth
                                  slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
                                >
                                  {CONTACT_METHODS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ContactTypeIcon type={option.value} fontSize="small" />
                                        <span>{option.label}</span>
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>

                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  size="small"
                                  label="Etiqueta (opcional)"
                                  value={contact.label}
                                  onChange={(e) => handleContactChange(index, 'label', e.target.value)}
                                  error={Boolean(labelError)}
                                  helperText={labelError || 'Ej. Grupos, Portafolio'}
                                  placeholder="Ej. Estudio"
                                  slotProps={{ htmlInput: { maxLength: MAX_CONTACT_LABEL_LENGTH } }}
                                  fullWidth
                                />
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <TextField
                                  size="small"
                                  label="Dato, usuario o enlace"
                                  value={contact.value}
                                  onChange={(e) => handleContactChange(index, 'value', e.target.value)}
                                  error={Boolean(valueError)}
                                  helperText={valueError || meta.helper}
                                  placeholder={meta.placeholder}
                                  slotProps={{ htmlInput: { maxLength: MAX_CONTACT_VALUE_LENGTH } }}
                                  required
                                  fullWidth
                                />
                              </Grid>
                            </Grid>
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}

                  {profileValues.contacts.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {`${profileValues.contacts.length} de ${MAX_CONTACTS} medios usados`}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        disabled={profileValues.contacts.length >= MAX_CONTACTS}
                        onClick={handleAddContact}
                      >
                        Agregar otro medio
                      </Button>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          )}

          {editTab === 'password' && (
            <Box component="form" onSubmit={handlePasswordSubmit} noValidate id="password-form">
              <Stack spacing={2.5}>
                {passwordGeneralError && <Alert severity="error">{passwordGeneralError}</Alert>}

                <TextField
                  type="password"
                  label="Contraseña actual"
                  value={passwordValues.currentPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPasswordValues((prev) => ({ ...prev, currentPassword: val }));
                    setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
                  }}
                  error={Boolean(passwordErrors.currentPassword)}
                  helperText={passwordErrors.currentPassword}
                  required
                  fullWidth
                />

                <TextField
                  type="password"
                  label="Nueva contraseña"
                  value={passwordValues.newPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPasswordValues((prev) => ({ ...prev, newPassword: val }));
                    setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  error={Boolean(passwordErrors.newPassword)}
                  helperText={passwordErrors.newPassword || 'Mínimo 8 caracteres, con mayúscula, minúscula y número.'}
                  required
                  fullWidth
                />

                <TextField
                  type="password"
                  label="Confirmar nueva contraseña"
                  value={passwordValues.confirmPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPasswordValues((prev) => ({ ...prev, confirmPassword: val }));
                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  error={Boolean(passwordErrors.confirmPassword)}
                  helperText={passwordErrors.confirmPassword}
                  required
                  fullWidth
                />
              </Stack>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setIsEditModalOpen(false)}
            disabled={isSavingProfile || isSavingPassword}
          >
            Cancelar
          </Button>

          {editTab === 'profile' || editTab === 'contacts' ? (
            <Button
              type="submit"
              form="profile-form"
              variant="contained"
              disabled={isSavingProfile}
            >
              {isSavingProfile ? 'Guardando...' : 'Guardar datos'}
            </Button>
          ) : (
            <Button
              type="submit"
              form="password-form"
              variant="contained"
              disabled={isSavingPassword}
            >
              {isSavingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        message={notice?.message}
      />
    </Box>
  );
}
