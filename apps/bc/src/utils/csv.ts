import fs from 'fs'

export const getEncoding = (file: string) => {
  const buffer = fs.readFileSync(file, { encoding: 'binary' })
  /**
   * https://www.w3schools.com/charsets/ref_html_8859.asp
   * \xE8 and \xE9 are the hexadecimal codes for "è" (232) and "é" (233) in Latin-1 (ISO-8859-1).
   */
  return buffer.includes('\xE9') || buffer.includes('\xE8') ? 'latin1' : 'utf-8'
}
