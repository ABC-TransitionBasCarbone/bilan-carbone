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
