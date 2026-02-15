<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        open: boolean;
        title: string;
        onclose: () => void;
        children: Snippet;
    }

    let { open, title, onclose, children }: Props = $props();

    function handleBackdrop(e: MouseEvent) {
        if (e.target === e.currentTarget) onclose();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onclose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
    <div
        class="modal-backdrop"
        onclick={handleBackdrop}
        role="dialog"
        aria-modal="true"
    >
        <div class="modal-content">
            <div class="modal-header">
                <h2>{title}</h2>
                <button
                    class="modal-close"
                    onclick={onclose}
                    aria-label="Close"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                {@render children()}
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        animation: fadeIn 0.2s ease-out;
    }
    .modal-content {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 16px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
        animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border);
    }
    .modal-header h2 {
        font-size: 1.1rem;
        font-weight: 700;
    }
    .modal-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 6px;
        transition: all 0.15s;
        display: flex;
    }
    .modal-close:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.06);
    }
    .modal-body {
        padding: 1.5rem;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
</style>
