'use client'
import { CUT, useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Alert, List, ListItem, ListItemText, Typography } from '@mui/material'
import { useMemo } from 'react'
import styles from './StudyHomeMessage.module.css'

const StudyHomeMessage = () => {
  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])
  return (
    isCut && (
      <Alert color="info" className={styles.mb1}>
        <Typography>
          Bienvenue sur COUNT le premier calculateur d'impact écologique dédié aux salles de cinéma. Cet outil a été
          développé par l'association CUT ! Cinéma Uni pour la transition, en coopération avec l'ABC, association pour
          la transition bas carbone Opération soutenue par l'État dans le cadre du dispositif « Soutenir les
          alternatives vertes 2 » de France 2030, opéré par la Banque des territoires (Caisse des Dépôts) (avec logo
          France 2030 : bit.ly/France2030_KitCommunication) CUT bénéficie du soutien du CNC + logo CNC
        </Typography>
        <List dense>
          <ListItem disablePadding>
            <ListItemText>Faire votre bilan d'impact vous permettra de :</ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText>Comprendre la mesure d'impact de votre établissement</ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText>Identifier les priorités d'action</ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText>Construire une trajectoire de réduction</ListItemText>
          </ListItem>
        </List>
      </Alert>
    )
  )
}

export default StudyHomeMessage
