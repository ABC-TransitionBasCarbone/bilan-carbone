const EXCEL_EPOCH_IN_UTC = Date.UTC(1899, 11, 30)
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000

export const convertExcelSerialDateToISODate = (serialDate: number): string => {
    return new Date(EXCEL_EPOCH_IN_UTC + serialDate * MILLISECONDS_IN_DAY).toISOString().slice(0, 10)
}
