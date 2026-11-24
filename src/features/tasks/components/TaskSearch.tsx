'use client';

import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useTaskSearch } from '../hooks/useTaskSearch';
import { TITLE_MAX_LENGTH } from '../task.schema';

export function TaskSearch({ query }: { query: string }) {
  const { value, setValue, isSearching } = useTaskSearch(query);

  return (
    <TextField
      type="search"
      label="Search by title"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      fullWidth
      size="small"
      slotProps={{
        htmlInput: { maxLength: TITLE_MAX_LENGTH },
        input: {
          endAdornment: isSearching ? (
            <InputAdornment position="end">
              <CircularProgress size={18} aria-label="Searching" />
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}
