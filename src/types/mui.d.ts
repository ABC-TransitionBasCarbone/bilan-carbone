import { CutPost, Post } from '@/services/posts'
import '@mui/material/styles'
import { CSSObject } from '@mui/material/styles'
import { CSSProperties } from 'react'

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
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
    }
  }
}
