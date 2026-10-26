/**
 * @file TagInput.jsx
 * @description Free tags with chips and suggestions, used by the document
 * form (views 9 and 13) and by the filters of the search (view 11).
 */

import { Autocomplete, Chip, TextField } from '@mui/material';

/**
 * @param {object} props
 * @param {string[]} props.value
 * @param {(tags: string[]) => void} props.onChange
 * @param {string[]} [props.options]
 * @param {string} [props.error]
 * @param {boolean} [props.disabled]
 */
export default function TagInput({ value, onChange, options = [], error = '', disabled = false }) {
  const handleChange = (_event, tags) => {
    const clean = tags
      .map((tag) => String(tag).trim())
      .filter((tag, index, list) => tag && list.indexOf(tag) === index);

    onChange(clean);
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      disabled={disabled}
      onChange={handleChange}
      renderValue={(tags, getItemProps) =>
        tags.map((tag, index) => {
          // `key` is pulled out of the props: React 19 warns if it is spread.
          const { key, ...itemProps } = getItemProps({ index });

          return <Chip key={key ?? tag} label={tag} size="small" {...itemProps} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Etiquetas"
          placeholder={value.length > 0 ? '' : 'Escribe una etiqueta y presiona Enter'}
          error={Boolean(error)}
          helperText={error || 'Ayudan a que otros encuentren el documento.'}
        />
      )}
    />
  );
}
