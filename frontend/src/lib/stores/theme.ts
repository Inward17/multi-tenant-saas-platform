import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'taskflow-theme';

function getInitialTheme(): Theme {
    if (!browser) return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'dark';
}

function getSystemPreference(): 'light' | 'dark' {
    if (!browser) return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
    if (!browser) return;
    const resolved = theme === 'system' ? getSystemPreference() : theme;
    document.documentElement.setAttribute('data-theme', resolved);
}

export const theme = writable<Theme>(getInitialTheme());

theme.subscribe((value) => {
    if (!browser) return;
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
});

// Listen for system preference changes when theme is 'system'
if (browser) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored === 'system') applyTheme('system');
    });

    // Apply on initial load
    applyTheme(getInitialTheme());
}
