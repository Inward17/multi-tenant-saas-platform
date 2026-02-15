import { writable } from 'svelte/store';
import type { User } from '$lib/api/auth';

export const user = writable<User | null>(null);
export const isAuthenticated = writable(false);

export function setUser(u: User) {
    user.set(u);
    isAuthenticated.set(true);
}

export function clearUser() {
    user.set(null);
    isAuthenticated.set(false);
}
