/**
 * Shared date/time formatting utilities.
 * Single source of truth — replaces inline formatDate / formatTime across pages.
 */

/**
 * Format an ISO date string into a human-readable date.
 * e.g. "Jan 15, 2026"
 */
export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format an ISO date string into a long-form date.
 * e.g. "January 15, 2026"
 */
export function formatDateLong(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format an ISO date string into a relative time string.
 * e.g. "just now", "3m ago", "2h ago", or falls back to "Jan 15, 2:30 PM"
 */
export function formatRelativeTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;

    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
