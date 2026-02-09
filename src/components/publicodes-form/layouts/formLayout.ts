/**
 * Defines the layout of a form, i.e. how the questions should be presented to
 * the user.
 *
 * @template RuleName - The type representing the names of the rules in the
 * form.
 *
 * TODO: we should allow to extends this type with custom layouts from the
 * consumer side.
 */
export type FormLayout<RuleName extends string = string> =
  | InputLayout<RuleName>
  | GroupLayout<RuleName>
  | TableLayout<RuleName>
  | ListLayout<RuleName>

export interface InputLayout<RuleName extends string> {
  type: 'input'
  rule: RuleName
}

export function inputLayout<RuleName extends string>(rule: RuleName): InputLayout<RuleName> {
  return { type: 'input', rule }
}

export interface TableLayout<RuleName extends string> {
  type: 'table'
  title: string
  headers: string[]
  rows: RuleName[][]
}

export function tableLayout<RuleName extends string>(
  title: string,
  headers: string[],
  rows: RuleName[][],
): TableLayout<RuleName> {
  return { type: 'table', title, headers, rows }
}

export interface GroupLayout<RuleName extends string> {
  type: 'group'
  title: string
  rules: RuleName[]
}

export function groupLayout<RuleName extends string>(title: string, rules: RuleName[]): GroupLayout<RuleName> {
  return { type: 'group', title, rules }
}

export interface ListLayout<RuleName extends string> {
  type: 'list'
  targetRule: RuleName
  rules: RuleName[]
}

/**
 * Creates a ListLayout object.
 *
 * @template RuleName - The type representing the names of the rules in the form.
 * @param targetRule - The rule corresonding to the sub-model used to compute values for each row in the list. It also defines the question and description displayed above the list.
 * @param rules - An array of rule names that define the columns of the list. These rules define the individual fields for each item in the list and the corresponding question is displayed as a column header.
 * @returns A ListLayout object.
 */
export function listLayout<RuleName extends string>(targetRule: RuleName, rules: RuleName[]): ListLayout<RuleName> {
  return { type: 'list', targetRule, rules }
}
