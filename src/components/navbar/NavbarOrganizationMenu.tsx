'use client'
import { Menu, MenuProps, styled } from "@mui/material";


const NavbarOrganizationMenu = styled((props: MenuProps) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        backgroundColor: theme.palette.primary.main,
        padding: '1rem'
    },
    '& .MuiMenuItem-root': {
        color: theme.custom.navbar.text.color,
        fontWeight: theme.custom.navbar.text.fontWeight,
        textTransform: theme.custom.navbar.text.textTransform,
        textAlign: 'center',
        justifyContent: 'center',
        '& a': {

            color: theme.custom.navbar.text.color,
            textDecoration: 'none',
        },
    },
}))

export default NavbarOrganizationMenu