import { Post } from '@/services/posts'
import { createTheme } from '@mui/material/styles'
import { SubPost } from '@prisma/client'

const base = createTheme({
  cssVariables: true,
  palette: {
    background: {
      default: '#3880ff0d',
      paper: '#ffffff',
    },
    primary: {
      main: '#272768',
      light: '#ebf2ff',
    },
    secondary: {
      main: '#346fef',
    },
    grey: {
      50: '#e9eff9',
      100: '#dbe5f6',
      200: '#eae5e8',
      300: '#c6d8f5',
      400: '#9fbff3',
      500: '#0a0317',
      600: '#080212',
      800: '#040109',
      900: '#020105',
    },
    success: {
      main: '#94EBBF',
      light: '#E0FBE8',
      dark: '#1d9c5c',
    },
    error: {
      light: '#e04949',
      main: '#cd2323',
      dark: '#641111',
    },
    warning: {
      main: '#fc8514',
    },
    info: {
      main: '#F6AD34',
      light: '#FFF8EB',
    },
    divider: '#1b5bf51a',
    beges1: {
      main: '#f15f57',
      light: '#FEF6F3',
    },
    beges2: {
      main: '#29ba91',
      light: '#F4FAF8',
    },
    beges3: {
      main: '#c89181',
      light: '#FBF8F6',
    },
    beges4: {
      main: '#4a79bd',
      light: '#F3F5FA',
    },
    beges5: {
      main: '#2dabcd',
      light: '#F1F9FB',
    },
    beges6: {
      main: '#57585a',
      light: '#F2F3F4',
    },
  },
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

const theme = createTheme(base, {
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
    postColors: {
      [Post.Energies]: { light: '#3F5488', dark: '#0C2155' },
      [Post.AutresEmissionsNonEnergetiques]: { light: '#3F5488', dark: '#0C2155' },
      [Post.DechetsDirects]: { light: '#3F5488', dark: '#0C2155' },
      [Post.Immobilisations]: { light: '#3F5488', dark: '#0C2155' },
      [Post.IntrantsBiensEtMatieres]: { light: '#5E97CB', dark: '#2C6498' },
      [Post.IntrantsServices]: { light: '#5E97CB', dark: '#2C6498' },
      [Post.Deplacements]: { light: '#79C7AB', dark: '#469478' },
      [Post.Fret]: { light: '#79C7AB', dark: '#469478' },
      [Post.FinDeVie]: { light: '#FBBC6B', dark: '#C88938' },
      [Post.UtilisationEtDependance]: { light: '#FBBC6B', dark: '#C88938' },
    },
    subPostColors: {
      // Energies subposts - variations of #3F5488
      [SubPost.CombustiblesFossiles]: '#526594',
      [SubPost.CombustiblesOrganiques]: '#6576a0',
      [SubPost.ReseauxDeChaleurEtDeVapeur]: '#7987ac',
      [SubPost.ReseauxDeFroid]: '#8c98b8',
      [SubPost.Electricite]: '#9faac4',

      // AutresEmissionsNonEnergetiques subposts - variations of #3F5488
      [SubPost.Agriculture]: '#526594',
      [SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas]: '#6576a0',
      [SubPost.EmissionsLieesALaProductionDeFroid]: '#7987ac',
      [SubPost.EmissionsLieesAuxProcedesIndustriels]: '#8c98b8',
      [SubPost.AutresEmissionsNonEnergetiques]: '#9faac4',

      // IntrantsBiensEtMatieres subposts - variations of #5E97CB
      [SubPost.MetauxPlastiquesEtVerre]: '#6ea1d0',
      [SubPost.PapiersCartons]: '#7eacd5',
      [SubPost.MateriauxDeConstruction]: '#8eb6db',
      [SubPost.ProduitsChimiquesEtHydrogene]: '#9ec1e0',
      [SubPost.NourritureRepasBoissons]: '#afcbe5',
      [SubPost.MatiereDestineeAuxEmballages]: '#bfd5ea',
      [SubPost.AutresIntrants]: '#cfe0ef',
      [SubPost.BiensEtMatieresEnApprocheMonetaire]: '#dfeaf5',

      // IntrantsServices subposts - variations of #5E97CB
      [SubPost.AchatsDeServices]: '#5588b7',
      [SubPost.UsagesNumeriques]: '#4b79a2',
      [SubPost.ServicesEnApprocheMonetaire]: '#426a8e',

      // DechetsDirects subposts - variations of #3F5488
      [SubPost.DechetsDEmballagesEtPlastiques]: '#394c7a',
      [SubPost.DechetsOrganiques]: '#32436d',
      [SubPost.DechetsOrduresMenageres]: '#2c3b5f',
      [SubPost.DechetsDangereux]: '#263252',
      [SubPost.DechetsBatiments]: '#202a44',
      [SubPost.DechetsFuitesOuEmissionsNonEnergetiques]: '#192236',
      [SubPost.EauxUsees]: '#131929',
      [SubPost.AutresDechets]: '#0d111b',

      // Fret subposts - variations of #79C7AB
      [SubPost.FretEntrant]: '#94d2bc',
      [SubPost.FretInterne]: '#afddcd',
      [SubPost.FretSortant]: '#c9e9dd',

      // Deplacements subposts - variations of #79C7AB
      [SubPost.DeplacementsDomicileTravail]: '#94d2bc',
      [SubPost.DeplacementsProfessionnels]: '#afddcd',
      [SubPost.DeplacementsVisiteurs]: '#c9e9dd',

      // Immobilisations subposts - variations of #3F5488
      [SubPost.Batiments]: '#7987ac',
      [SubPost.AutresInfrastructures]: '#8c98b8',
      [SubPost.Equipements]: '#9faac4',
      [SubPost.Informatique]: '#b2bbcf',

      // UtilisationEtDependance subposts - variations of #FBBC6B
      [SubPost.UtilisationEnResponsabilite]: '#fbc37a',
      [SubPost.UtilisationEnDependance]: '#fcc989',
      [SubPost.InvestissementsFinanciersRealises]: '#fcd097',

      // FinDeVie subposts - variations of #FBBC6B
      [SubPost.ConsommationDEnergieEnFinDeVie]: '#fbc37a',
      [SubPost.TraitementDesDechetsEnFinDeVie]: '#fcc989',
      [SubPost.FuitesOuEmissionsNonEnergetiques]: '#fcd097',
      [SubPost.TraitementDesEmballagesEnFinDeVie]: '#fdd7a6',

      // CUT subposts - unique colors
      [SubPost.Batiment]: '#8B5A3C',
      [SubPost.Equipe]: '#A0522D',
      [SubPost.Energie]: '#CD853F',
      [SubPost.ActivitesDeBureau]: '#DEB887',
      [SubPost.MobiliteSpectateurs]: '#F4A460',
      [SubPost.EquipesRecues]: '#D2B48C',
      [SubPost.MaterielTechnique]: '#BC8F8F',
      [SubPost.AutreMateriel]: '#F5DEB3',
      [SubPost.Achats]: '#FFE4B5',
      [SubPost.Fret]: '#FFDEAD',
      [SubPost.Electromenager]: '#F5DEB3',
      [SubPost.DechetsOrdinaires]: '#DDA0DD',
      [SubPost.DechetsExceptionnels]: '#DA70D6',
      [SubPost.MaterielDistributeurs]: '#FF69B4',
      [SubPost.MaterielCinema]: '#FF1493',
      [SubPost.CommunicationDigitale]: '#DC143C',
      [SubPost.CaissesEtBornes]: '#B22222',

      // TILT subposts - unique colors
      [SubPost.FroidEtClim]: '#87CEEB',
      [SubPost.ActivitesAgricoles]: '#9ACD32',
      [SubPost.ActivitesIndustrielles]: '#8FBC8F',
      [SubPost.DeplacementsDomicileTravailSalaries]: '#20B2AA',
      [SubPost.DeplacementsDomicileTravailBenevoles]: '#48D1CC',
      [SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries]: '#00CED1',
      [SubPost.DeplacementsDansLeCadreDUneMissionAssociativeBenevoles]: '#5F9EA0',
      [SubPost.DeplacementsDesBeneficiaires]: '#4682B4',
      [SubPost.DeplacementsFabricationDesVehicules]: '#6495ED',
      [SubPost.Entrant]: '#7B68EE',
      [SubPost.Interne]: '#9370DB',
      [SubPost.Sortant]: '#8A2BE2',
      [SubPost.TransportFabricationDesVehicules]: '#9932CC',
      [SubPost.RepasPrisParLesSalaries]: '#FF6347',
      [SubPost.RepasPrisParLesBenevoles]: '#FF7F50',
      [SubPost.RepasPrisParLesBeneficiaires]: '#FF8C69',
      [SubPost.UtilisationEnResponsabiliteConsommationDeBiens]: '#FFA07A',
      [SubPost.UtilisationEnResponsabiliteConsommationNumerique]: '#FA8072',
      [SubPost.UtilisationEnResponsabiliteConsommationDEnergie]: '#F08080',
      [SubPost.UtilisationEnResponsabiliteFuitesEtAutresConsommations]: '#CD5C5C',
      [SubPost.UtilisationEnDependanceConsommationDeBiens]: '#DC143C',
      [SubPost.UtilisationEnDependanceConsommationNumerique]: '#B22222',
      [SubPost.UtilisationEnDependanceConsommationDEnergie]: '#A52A2A',
      [SubPost.UtilisationEnDependanceFuitesEtAutresConsommations]: '#8B0000',
      [SubPost.TeletravailSalaries]: '#FFD700',
      [SubPost.TeletravailBenevoles]: '#FFA500',
      [SubPost.EquipementsDesSalaries]: '#FF8C00',
      [SubPost.ParcInformatiqueDesSalaries]: '#FF4500',
      [SubPost.EquipementsDesBenevoles]: '#FF6347',
      [SubPost.ParcInformatiqueDesBenevoles]: '#FF0000',
    },
    // Variants of secondary color
    tagFamilyColors: ['#85a9f5', '#9ab7f7', '#aec5f9', '#c2d4fa', '#d6e2fc'],
  },
})

export default theme
