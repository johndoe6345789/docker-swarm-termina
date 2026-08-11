'use client';

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4a5568', // slate
      light: '#718096',
      dark: '#2d3748',
    },
    secondary: {
      main: '#38b2ac', // cyan/teal
      light: '#4fd1c5',
      dark: '#319795',
    },
    background: {
      default: '#1a202c',
      paper: '#2d3748',
    },
    text: {
      primary: '#f7fafc',
      secondary: '#cbd5e0',
    },
    success: {
      main: '#38b2ac',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
    h1: {
      fontWeight: 700,
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
    },
    h3: {
      fontWeight: 500,
      fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
    },
    body1: {
      fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 'clamp(0.75rem, 1.3vw, 0.8125rem)',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          transition: 'all 0.15s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(56, 178, 172, 0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          padding: '8px 16px',
          transition: 'all 0.1s ease',
          '&:hover': {
            boxShadow: '0 0 8px rgba(56, 178, 172, 0.3)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          '&.Mui-disabled': {
            opacity: 0.5,
            backgroundColor: 'rgba(74, 85, 104, 0.3)',
            borderColor: 'rgba(74, 85, 104, 0.5)',
            color: 'rgba(247, 250, 252, 0.5)',
          },
        },
      },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
