<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        variant?: "primary" | "secondary" | "danger" | "ghost";
        size?: "sm" | "md" | "lg";
        loading?: boolean;
        disabled?: boolean;
        type?: "button" | "submit";
        fullWidth?: boolean;
        onclick?: (e: MouseEvent) => void;
        children: Snippet;
    }

    let {
        variant = "primary",
        size = "md",
        loading = false,
        disabled = false,
        type = "button",
        fullWidth = false,
        onclick,
        children,
    }: Props = $props();
</script>

<button
    {type}
    class="btn btn-{variant} btn-{size}"
    class:full-width={fullWidth}
    class:loading
    disabled={disabled || loading}
    {onclick}
>
    {#if loading}
        <span class="spinner"></span>
    {/if}
    <span class="btn-content" class:hidden={loading}>
        {@render children()}
    </span>
</button>

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: none;
        border-radius: 10px;
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        white-space: nowrap;
    }
    .btn:active:not(:disabled) {
        transform: scale(0.97);
    }
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Variants */
    .btn-primary {
        background: linear-gradient(135deg, #6c63ff, #5a52e0);
        color: white;
        box-shadow: 0 2px 8px rgba(108, 99, 255, 0.3);
    }
    .btn-primary:hover:not(:disabled) {
        background: linear-gradient(135deg, #7c74ff, #6c63ff);
        box-shadow: 0 4px 16px rgba(108, 99, 255, 0.4);
        transform: translateY(-1px);
    }

    .btn-secondary {
        background: var(--bg-input);
        color: var(--text-primary);
        border: 1px solid var(--border);
    }
    .btn-secondary:hover:not(:disabled) {
        border-color: var(--accent);
        background: rgba(108, 99, 255, 0.1);
    }

    .btn-danger {
        background: rgba(248, 113, 113, 0.15);
        color: #f87171;
        border: 1px solid rgba(248, 113, 113, 0.3);
    }
    .btn-danger:hover:not(:disabled) {
        background: rgba(248, 113, 113, 0.25);
        border-color: rgba(248, 113, 113, 0.5);
    }

    .btn-ghost {
        background: transparent;
        color: var(--text-secondary);
    }
    .btn-ghost:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
    }

    /* Sizes */
    .btn-sm {
        padding: 0.375rem 0.875rem;
        font-size: 0.8rem;
        border-radius: 8px;
    }
    .btn-md {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
    }
    .btn-lg {
        padding: 0.875rem 1.75rem;
        font-size: 1rem;
    }

    .full-width {
        width: 100%;
    }

    /* Spinner */
    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .btn-content.hidden {
        visibility: hidden;
        height: 0;
        overflow: hidden;
    }
</style>
