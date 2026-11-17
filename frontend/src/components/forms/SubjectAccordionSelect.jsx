/**
 * @file SubjectAccordionSelect.jsx
 * @description Subject selector dropdown grouped into collapsible semester
 * accordions that start closed and expand on click.
 */

import { useId, useMemo, useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  MenuList,
  OutlinedInput,
  Popover,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { groupBySemester } from '../../services/subjectService.js';

/**
 * @param {object} props
 * @param {Array<{ id: number|string, name: string, semester: number }>} props.subjects
 * @param {number|string} props.value
 * @param {(subjectId: number|string) => void} props.onChange
 * @param {string} [props.label='Materia']
 * @param {string} [props.emptyLabel='Todas las materias']
 * @param {'small'|'medium'} [props.size='medium']
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.required=false]
 * @param {boolean} [props.error=false]
 * @param {string} [props.helperText='']
 * @param {boolean} [props.disabled=false]
 * @param {object} [props.sx]
 */
export default function SubjectAccordionSelect({
  subjects = [],
  value,
  onChange,
  label = 'Materia',
  emptyLabel = 'Todas las materias',
  size = 'medium',
  fullWidth = false,
  required = false,
  error = false,
  helperText = '',
  disabled = false,
  sx,
}) {
  const inputId = useId();
  const labelId = `${inputId}-label`;

  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorWidth, setAnchorWidth] = useState(280);
  const [expandedSemesters, setExpandedSemesters] = useState(() => new Set());

  const open = Boolean(anchorEl);
  const groups = useMemo(() => groupBySemester(subjects), [subjects]);
  const selectedSubject = useMemo(
    () =>
      value === '' || value === null || value === undefined
        ? null
        : subjects.find((subject) => Number(subject.id) === Number(value)) ?? null,
    [subjects, value],
  );
  const hasSelection = Boolean(selectedSubject);

  const handleOpen = (event) => {
    if (disabled) return;
    setAnchorWidth(Math.round(event.currentTarget.getBoundingClientRect().width));
    setExpandedSemesters(new Set());
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setExpandedSemesters(new Set());
  };

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    handleClose();
  };

  const toggleSemester = (semesterNumber) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev);
      if (next.has(semesterNumber)) next.delete(semesterNumber);
      else next.add(semesterNumber);
      return next;
    });
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      handleOpen(event);
    }
  };

  return (
    <>
      <FormControl
        size={size}
        fullWidth={fullWidth}
        required={required}
        error={error}
        disabled={disabled}
        sx={sx}
      >
        <InputLabel id={labelId} htmlFor={inputId} shrink={hasSelection || open}>
          {label}
        </InputLabel>
        <OutlinedInput
          id={inputId}
          label={label}
          notched={hasSelection || open}
          readOnly
          value={selectedSubject ? selectedSubject.name : open ? emptyLabel : ''}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          inputProps={{
            role: 'combobox',
            'aria-expanded': open,
            'aria-haspopup': 'listbox',
            'aria-labelledby': labelId,
          }}
          endAdornment={
            <InputAdornment position="end">
              <ArrowDropDownIcon
                sx={{
                  color: 'action.active',
                  pointerEvents: 'none',
                  transform: open ? 'rotate(180deg)' : 'none',
                  transition: 'transform 150ms',
                }}
              />
            </InputAdornment>
          }
          sx={{
            cursor: disabled ? 'default' : 'pointer',
            '& .MuiOutlinedInput-input': {
              cursor: disabled ? 'default' : 'pointer',
              textOverflow: 'ellipsis',
            },
          }}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: Math.max(anchorWidth, 300),
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'min(560px, calc(100vh - 96px))',
              overflowY: 'auto',
            },
          },
        }}
      >
        {emptyLabel && (
          <>
            <MenuList dense disablePadding>
              <MenuItem
                selected={value === '' || value === null || value === undefined}
                onClick={() => handleSelect('')}
                sx={{ py: 1 }}
              >
                <Typography
                  variant="body2"
                  color={!hasSelection ? 'primary.main' : 'text.secondary'}
                  fontWeight={!hasSelection ? 600 : 400}
                >
                  {emptyLabel}
                </Typography>
              </MenuItem>
            </MenuList>
            {groups.length > 0 && <Divider />}
          </>
        )}

        {groups.map((group) => {
          const isExpanded = expandedSemesters.has(group.semester);
          return (
            <Accordion
              key={group.semester}
              disableGutters
              elevation={0}
              expanded={isExpanded}
              onChange={() => toggleSemester(group.semester)}
              slotProps={{ heading: { component: 'div' } }}
              sx={{
                '&:before': { display: 'none' },
                bgcolor: 'transparent',
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-of-type': { borderBottom: 0 },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{
                  minHeight: 36,
                  px: 2,
                  '& .MuiAccordionSummary-content': {
                    my: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pr: 1,
                  },
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {`Semestre ${group.semester}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {group.subjects.length}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <MenuList dense disablePadding>
                  {group.subjects.map((subject) => (
                    <MenuItem
                      key={subject.id}
                      selected={Number(value) === Number(subject.id)}
                      onClick={() => handleSelect(subject.id)}
                      sx={{ pl: 3, py: 0.75, whiteSpace: 'normal' }}
                    >
                      {subject.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Popover>
    </>
  );
}
