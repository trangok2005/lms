import { formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 (e.g., "5 phút trước")
 * @param {string} isoString 
 * @returns {string}
 */
export const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
        return formatDistanceToNow(parseISO(isoString), { 
            addSuffix: true, 
            locale: vi
        });
    } catch (error) {
        console.error("Date formatting error:", error);
        return '';
    }
};
