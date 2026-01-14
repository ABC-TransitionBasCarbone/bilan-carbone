/**
 * The structure is not designed to handle 3.X rules separated into two scopes.
 * So it's separated into 3.X and 4.X and then corrected them to display what we want.
 * That way, the processing is done automatically (cf allRules).
 */
export const getGHGPRuleName = (rule: string) => {
  let res = rule
  if (res.substring(0, 1) === '4') {
    res = `3${res.substring(1)}`
  }
  // specific case 3.09 (0 is added to put it before 3.10)
  if (res.substring(2, 3) === '0') {
    res = `3.${res.substring(3)}`
  }
  if (res.split('.')[1].includes('other')) {
    res = ''
  }
  return res
}
