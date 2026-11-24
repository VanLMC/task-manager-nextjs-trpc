'use client';

import Alert, { type AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type FeedbackAction = { label: string; onClick: () => void };

export type Feedback = { message: string; severity: AlertColor; action?: FeedbackAction };

type FeedbackContextValue = { notify: (feedback: Feedback) => void };

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const AUTO_HIDE_MS = 6_000;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<(Feedback & { key: number }) | null>(null);
  const [open, setOpen] = useState(false);

  const notify = useCallback((feedback: Feedback) => {
    setCurrent({ ...feedback, key: Date.now() });
    setOpen(true);
  }, []);

  const close = () => setOpen(false);

  const runAction = (action: FeedbackAction) => {
    close();
    action.onClick();
  };

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        key={current?.key}
        open={open}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={(_, reason) => reason !== 'clickaway' && close()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {current ? (
          <Alert
            severity={current.severity}
            variant="filled"
            onClose={close}
            action={
              current.action ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => runAction(current.action as FeedbackAction)}
                >
                  {current.action.label}
                </Button>
              ) : undefined
            }
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider');
  return context;
}
