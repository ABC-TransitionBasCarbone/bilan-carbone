import '@mui/material/styles'
import { CSSObject } from '@mui/material/styles'
import { CSSProperties } from 'react'

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      box: CSSObject
      postColors: {
        functioning: { light: string }
        mobility: { light: string }
        tour: { light: string }
        candyStore: { light: string }
        garbage: { light: string }
        ticketOffice: { light: string }
        movieTheater: { light: string }
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

  interface ThemeOptions {
    custom?: {
      box: CSSObject
      postColors?: {
        functioning: { light: string }
        mobility: { light: string }
        tour: { light: string }
        candyStore: { light: string }
        garbage: { light: string }
        ticketOffice: { light: string }
        movieTheater: { light: string }
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
