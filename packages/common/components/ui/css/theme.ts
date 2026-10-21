// Global theme for the monorepo
// Place shared theme config here for all apps/packages
// Gilroy font family is enforced globally

import { createTheme } from '@mui/material/styles'

const base = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: 'gilroy-regular, sans-serif',
    button: {
      fontSize: '1rem',
      textTransform: 'none',
      fontFamily: 'gilroy-regular, sans-serif',
    },
    h1: {
      fontSize: '2.5rem',
      lineHeight: '3.25rem',
      fontWeight: 800,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: '2.75rem',
    },
    h3: {
      fontSize: '1.75rem',
      lineHeight: '2.25rem',
    },
    h4: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
    },
    h5: {
      fontSize: '1.375rem',
      lineHeight: '1.75rem',
    },
    h6: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
    },
  },
})

const globalTheme = createTheme(base, {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1360,
      xl: 1536,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
        },
        outlined: {
          backgroundColor: base.palette.common.white,
          borderStyle: 'solid',
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#002D7A',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        '& .MuiLinearProgress-bar1': {
          backgroundColor: base.palette.success.main,
        },
        '& .MuiLinearProgress-bar2': {
          backgroundColor: base.palette.grey[200],
        },
        '& .MuiLinearProgress-barColorPrimary': {
          backgroundColor: base.palette.success.main,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',
            '& fieldset': {
              borderRadius: '0.5rem',
            },
          },
          '& input': {
            '&:-webkit-autofill': {
              WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
              WebkitTextFillColor: 'inherit',
            },
          },
        },
      },
    },
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
          '& fieldset': {
            borderRadius: '0.5rem',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
          '& fieldset': {
            borderRadius: '0.5rem',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
          '& fieldset': {
            borderRadius: '0.5rem',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '1rem',
          lineHeight: 'normal',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '1rem !important',
        },
      },
    },
  },
  custom: {
    palette: {
      error: {
        background: '#f6b8b8',
      },
    },
    box: {
      backgroundColor: base.palette.background.paper,
      color: base.palette.text.primary,
      borderRadius: '1rem',
      borderStyle: 'solid',
      borderWidth: '0.0625rem',
      borderColor: base.palette.grey[300],
      padding: '1rem',
    },
    navbar: {
      organizationToolbar: {
        border: '0.125rem solid rgba(27, 91, 245, 0.1)',
      },
      text: {
        fontFamily: 'gilroy-regular, sans-serif',
        color: '#FFFFFF',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '1rem',
        '&:hover': {
          color: base.palette.secondary.main,
        },
      },
    },
  },
})

export default globalTheme
