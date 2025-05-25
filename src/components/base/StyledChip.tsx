import { styled, ChipProps, Chip } from "@mui/material"

const StyledChip = styled((props: ChipProps) => <Chip {...props} />)<ChipProps>(
    ({ theme, color = 'default' }) => {
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
    }
)

export default StyledChip