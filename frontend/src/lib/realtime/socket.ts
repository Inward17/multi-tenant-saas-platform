import { io, Socket } from 'socket.io-client';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const socketConnected = writable(false);

let socket: Socket | null = null;

// Event callback registries
type Callback = (data: any) => void;
const taskCreatedCallbacks: Callback[] = [];
const taskUpdatedCallbacks: Callback[] = [];
const taskDeletedCallbacks: Callback[] = [];
const activityCallbacks: Callback[] = [];

export function connectSocket() {
    if (!browser || socket?.connected) return;

    const url = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
    socket = io(url, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
        console.log('[WS] Connected:', socket?.id);
        socketConnected.set(true);
    });

    socket.on('disconnect', () => {
        console.log('[WS] Disconnected');
        socketConnected.set(false);
    });

    socket.on('connect_error', (err) => {
        console.warn('[WS] Connection error:', err.message);
    });

    // ─── Task events ───
    socket.on('taskCreated', (data) => {
        taskCreatedCallbacks.forEach((cb) => cb(data));
    });

    socket.on('taskUpdated', (data) => {
        taskUpdatedCallbacks.forEach((cb) => cb(data));
    });

    socket.on('taskDeleted', (data) => {
        taskDeletedCallbacks.forEach((cb) => cb(data));
    });

    // ─── Activity events ───
    socket.on('activityCreated', (data) => {
        activityCallbacks.forEach((cb) => cb(data));
    });
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        socketConnected.set(false);
    }
}

// ─── Subscription helpers (return unsubscribe fn) ───

export function onTaskCreated(cb: Callback): () => void {
    taskCreatedCallbacks.push(cb);
    return () => {
        const i = taskCreatedCallbacks.indexOf(cb);
        if (i > -1) taskCreatedCallbacks.splice(i, 1);
    };
}

export function onTaskUpdated(cb: Callback): () => void {
    taskUpdatedCallbacks.push(cb);
    return () => {
        const i = taskUpdatedCallbacks.indexOf(cb);
        if (i > -1) taskUpdatedCallbacks.splice(i, 1);
    };
}

export function onTaskDeleted(cb: Callback): () => void {
    taskDeletedCallbacks.push(cb);
    return () => {
        const i = taskDeletedCallbacks.indexOf(cb);
        if (i > -1) taskDeletedCallbacks.splice(i, 1);
    };
}

export function onActivity(cb: Callback): () => void {
    activityCallbacks.push(cb);
    return () => {
        const i = activityCallbacks.indexOf(cb);
        if (i > -1) activityCallbacks.splice(i, 1);
    };
}
