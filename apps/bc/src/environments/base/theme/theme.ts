import { SubPost } from '@abc-transitionbascarbone/common/db/enums'
import { Post } from '@abc-transitionbascarbone/common/utils/charts'
import { globalTheme } from '@abc-transitionbascarbone/css'
import { createTheme } from '@mui/material/styles'

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
    ghgp: {
      main: '#0a7e76',
      light: '#daeef3',
      totalColumn: '#00c6b9',
      complementary: '#913a97',
      complementaryLight: '#d5b5d8',
      complementaryTotalColumn: '#ac6cb1',
    },
  },
  typography: globalTheme.typography,
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
      [SubPost.EnergieSimplified]: '#6576a0',

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
      [SubPost.FroidEtClim]: '#3F5488',
      [SubPost.ActivitesAgricoles]: '#3F5488',
      [SubPost.ActivitesIndustrielles]: '#192d62',
      [SubPost.DeplacementsDomicileTravailSalaries]: '#94d2bc',
      [SubPost.DeplacementsDomicileTravailBenevoles]: '#6bc0a2',
      [SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries]: '#2c7d60',
      [SubPost.DeplacementsDansLeCadreDUneMissionAssociativeBenevoles]: '#5bddb0',
      [SubPost.DeplacementsDesBeneficiaires]: '#136044',
      [SubPost.DeplacementsFabricationDesVehicules]: '#07472f',
      [SubPost.Entrant]: '#94d2bc',
      [SubPost.Interne]: '#6bc0a2',
      [SubPost.Sortant]: '#2c7d60',
      [SubPost.TransportFabricationDesVehicules]: '#07472f',
      [SubPost.RepasPrisParLesSalaries]: '#5E97CB',
      [SubPost.RepasPrisParLesBenevoles]: '#3876b0',
      [SubPost.RepasPrisParLesBeneficiaires]: '#1c4f7f',
      [SubPost.UtilisationEnResponsabiliteConsommationDeBiens]: '#FBBC6B',
      [SubPost.UtilisationEnResponsabiliteConsommationNumerique]: '#FFA07A',
      [SubPost.UtilisationEnResponsabiliteConsommationDEnergie]: '#FA8072',
      [SubPost.UtilisationEnResponsabiliteFuitesEtAutresConsommations]: '#F08080',
      [SubPost.UtilisationEnDependanceConsommationDeBiens]: '#CD5C5C',
      [SubPost.UtilisationEnDependanceConsommationNumerique]: '#DC143C',
      [SubPost.UtilisationEnDependanceConsommationDEnergie]: '#B22222',
      [SubPost.UtilisationEnDependanceFuitesEtAutresConsommations]: '#A52A2A',
      [SubPost.TeletravailSalaries]: '#3F5488',
      [SubPost.TeletravailBenevoles]: '#192d62',
      [SubPost.EquipementsDesSalaries]: '#5E97CB',
      [SubPost.ParcInformatiqueDesSalaries]: '#3876b0',
      [SubPost.EquipementsDesBenevoles]: '#1c4f7f',
      [SubPost.ParcInformatiqueDesBenevoles]: '#0b355c',
      [SubPost.Evenement]: '#FF5C5C',
    },
    // Variants of secondary color
    tagFamilyColors: ['#85a9f5', '#9ab7f7', '#aec5f9', '#c2d4fa', '#d6e2fc'],
  },
})

export default theme
