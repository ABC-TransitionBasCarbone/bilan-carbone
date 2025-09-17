import { calculateDistanceFromParis } from './distance'

/**
 * CNC data interface for the minimal fields we need for StudySite mapping
 */
export interface CncData {
  seances?: number | null
  entrees2023?: number | null
  semainesActivite?: number | null
  latitude?: number | null
  longitude?: number | null
  cncVersionId?: string | null
}

/**
 * Current StudySite data interface for checking what fields are already set
 */
export interface StudySiteData {
  numberOfSessions?: number | null
  numberOfTickets?: number | null
  numberOfOpenDays?: number | null
  distanceToParis?: number | null
  cncVersionId?: string | null
}

/**
 * Maps CNC data to StudySite fields
 */
export interface CncToStudySiteMapping {
  numberOfSessions?: number
  numberOfTickets?: number
  numberOfOpenDays?: number
  distanceToParis?: number
  cncVersionId?: string | null
}

const DEFAULT_STUDY_SITE_DATA: StudySiteData = {
  numberOfSessions: null,
  numberOfTickets: null,
  numberOfOpenDays: null,
  distanceToParis: null,
}

/**
 * Maps CNC data to StudySite fields, but only for fields that are null/undefined in the target
 */
export const mapCncToStudySite = (
  cncData: CncData | null | undefined,
  currentData: StudySiteData = DEFAULT_STUDY_SITE_DATA,
): CncToStudySiteMapping => {
  if (!cncData) {
    return {}
  }

  const mapping: CncToStudySiteMapping = {}

  if (currentData.numberOfSessions == null && cncData.seances != null) {
    mapping.numberOfSessions = cncData.seances
  }

  if (currentData.numberOfTickets == null && cncData.entrees2023 != null) {
    mapping.numberOfTickets = cncData.entrees2023
  }

  if (currentData.numberOfOpenDays == null && cncData.semainesActivite != null) {
    mapping.numberOfOpenDays = cncData.semainesActivite * 7
  }

  if (currentData.distanceToParis == null && cncData.latitude && cncData.longitude) {
    mapping.distanceToParis = calculateDistanceFromParis({
      latitude: cncData.latitude,
      longitude: cncData.longitude,
    })
  }

  if (currentData.cncVersionId == null && cncData.cncVersionId != null) {
    mapping.cncVersionId = cncData.cncVersionId
  }

  return mapping
}
