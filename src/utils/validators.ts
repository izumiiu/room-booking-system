

export const isValidPrice = (p: unknown): p is number => {
    return typeof p === 'number' && Number.isFinite(p) && p > 0;
}

export const isValidMenuname = (m: unknown): m is string => {
    return typeof m === 'string' && m.trim().length > 0;
}

export const isValidUsername = (u: unknown): u is string => {
    return typeof u === 'string' && u.length >= 3 && !/\s/.test(u);
}

export const isValidPassword = (p: unknown): p is string => {
    return typeof p === 'string' && p.length >= 8 && !/\s/.test(p);
}

export const isValidStatus = (s: unknown): s is 'pending' | 'cooking' | 'done' | 'cancelled' => {
    return s === 'pending' || s === 'cooking' || s === 'done' || s === 'cancelled';
}

