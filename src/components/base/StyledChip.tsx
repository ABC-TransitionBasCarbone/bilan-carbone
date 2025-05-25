import { styled, Chip, ChipProps } from "@mui/material"
import { JSX } from "react"

const StyledChip = styled(Chip)(({ theme, color = 'default' }) => {
    if (color === 'default') {
        return {
            backgroundColor: theme.palette.grey[300],
            color: theme.palette.text.primary,
            '& .MuiChip-icon, & .MuiChip-deleteIcon': {
                color: theme.palette.text.primary,
            },
        }
    }
    const palette = theme.palette[color as Exclude<typeof color, 'default'>]
    return {
        backgroundColor: palette.main,
        color: palette.dark,
        '& .MuiChip-icon, & .MuiChip-deleteIcon': {
            color: palette.dark,
        },
    }
})

type PolymorphicChip = <C extends React.ElementType = 'div'>(
    props: ChipProps<C> & { component?: C }
) => JSX.Element

export default StyledChip as PolymorphicChip