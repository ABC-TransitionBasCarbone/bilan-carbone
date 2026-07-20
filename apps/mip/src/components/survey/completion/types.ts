export interface CategoryResult {
  key: string
  titre: string
  icones: string
  valueKg: number
}

export interface ActionResult {
  key: string
  titre: string
  icones: string
  categoryKey: string
  savingsKg: number
}

export interface CategoryWithActions extends CategoryResult {
  actions: ActionResult[]
}
