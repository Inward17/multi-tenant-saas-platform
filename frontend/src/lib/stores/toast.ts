import { writable } from 'svelte/store';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

let nextId = 0;

export const toasts = writable<Toast[]>([]);

function addToast(message: string, type: Toast['type'], duration = 3500) {
    const id = nextId++;
    toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => {
        toasts.update((t) => t.filter((toast) => toast.id !== id));
    }, duration);
}

export function toastSuccess(message: string) { addToast(message, 'success'); }
export function toastError(message: string) { addToast(message, 'error'); }
export function toastInfo(message: string) { addToast(message, 'info'); }
