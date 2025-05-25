'use client'
import Label from '@/components/base/Label'
import Leaf from '@mui/icons-material/Spa'
import classNames from 'classnames'
import styles from './StudyName.module.css'
import { alpha, Chip, ChipProps, CommonColors, Palette, PaletteColorOptions, PaletteOptions, styled, Theme } from '@mui/material'
import StyledChip from '@/components/base/StyledChip'

interface Props {
  name: string
}

const StudyName = ({ name }: Props) => <StyledChip color="success" label={name} />

export default StudyName
