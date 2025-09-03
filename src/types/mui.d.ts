import { CutPost, Post } from '@/services/posts'
import '@mui/material/styles'
import { CSSObject } from '@mui/material/styles'
import { CSSProperties } from 'react'

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      palette: {
        error: {
          background: string
        }
      }
      box: CSSObject
      postColors: {
        [key in Post]: { light: string; dark?: string }
      }
      roles: {
        validator: string
        editor: string
        reader: string
        contributor: string
      }
      navbar: {
        organizationToolbar?: {
          border?: string
        }
        text: CSSProperties
      }
      publicContainer: {
        background?: string
      }
    }
  }

  interface ThemeOptions {
    custom?: {
      palette?: {
        error?: {
          background?: string
        }
      }
      box: CSSObject
      postColors?: {
        [key in CutPost]: { light: string; dark?: string }
      }
      roles: {
        validator: string
        editor: string
        reader: string
        contributor: string
      }
      navbar: {
        organizationToolbar?: {
          border?: string
        }
        text: CSSProperties
      }
      beges?: {
        category?: {
          1?: string
          2?: string
          3?: string
          4?: string
          5?: string
          6?: string
        }
        categoryLight?: {
          1?: string
          2?: string
          3?: string
          4?: string
          5?: string
          6?: string
        }
      }
    }
  }

  interface PaletteOptions {
    beges1?: {
      main?: string
      light?: string
    }
    beges2?: {
      main?: string
      light?: string
    }
    beges3?: {
      main?: string
      light?: string
    }
    beges4?: {
      main?: string
      light?: string
    }
    beges5?: {
      main?: string
      light?: string
    }
    beges6?: {
      main?: string
      light?: string
    }
  }
}
