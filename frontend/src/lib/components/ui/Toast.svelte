<script lang="ts">
    import { toasts, type Toast } from "$lib/stores/toast";

    function icon(type: Toast["type"]) {
        if (type === "success") return "✓";
        if (type === "error") return "✕";
        return "ℹ";
    }
</script>

{#if $toasts.length > 0}
    <div class="toast-container">
        {#each $toasts as toast (toast.id)}
            <div class="toast toast-{toast.type}">
                <span class="toast-icon">{icon(toast.type)}</span>
                <span class="toast-msg">{toast.message}</span>
            </div>
        {/each}
    </div>
{/if}

<style>
    .toast-container {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 200;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 380px;
    }
    .toast {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.25rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .toast-icon {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 700;
        flex-shrink: 0;
    }

    .toast-success {
        background: rgba(16, 44, 39, 0.95);
        border: 1px solid rgba(45, 212, 191, 0.3);
        color: #5eead4;
    }
    .toast-success .toast-icon {
        background: rgba(45, 212, 191, 0.2);
        color: #2dd4bf;
    }

    .toast-error {
        background: rgba(50, 20, 20, 0.95);
        border: 1px solid rgba(248, 113, 113, 0.3);
        color: #fca5a5;
    }
    .toast-error .toast-icon {
        background: rgba(248, 113, 113, 0.2);
        color: #f87171;
    }

    .toast-info {
        background: rgba(20, 20, 50, 0.95);
        border: 1px solid rgba(108, 99, 255, 0.3);
        color: #c4b5fd;
    }
    .toast-info .toast-icon {
        background: rgba(108, 99, 255, 0.2);
        color: #6c63ff;
    }

    @keyframes toastIn {
        from {
            opacity: 0;
            transform: translateX(24px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
</style>
