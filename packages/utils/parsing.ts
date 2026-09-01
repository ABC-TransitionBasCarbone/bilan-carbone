export const isYesValue = (value: unknown): boolean => {
    if (value === true) {
        return true
    }

    if (typeof value !== 'string') {
        return false
    }

    const normalized = value.trim().toLowerCase()
    return normalized === 'oui' || normalized === 'yes' || normalized === 'true'
}

export const removeDiacritics = (value: string): string => {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const normalizeCategoryKey = (value: string): string => {
    return removeDiacritics(value.trim().toLocaleLowerCase())
}
