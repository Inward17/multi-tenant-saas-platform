<script lang="ts">
    import Button from "./Button.svelte";

    interface Props {
        icon?: string;
        title: string;
        message?: string;
        actionLabel?: string;
        onaction?: () => void;
    }

    let {
        icon = "📋",
        title,
        message,
        actionLabel,
        onaction,
    }: Props = $props();
</script>

<div class="empty-state">
    <div class="empty-icon">{icon}</div>
    <h3>{title}</h3>
    {#if message}
        <p>{message}</p>
    {/if}
    {#if actionLabel && onaction}
        <div class="empty-action">
            <Button variant="primary" onclick={onaction}>{actionLabel}</Button>
        </div>
    {/if}
</div>

<style>
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 3rem 2rem;
        animation: fadeIn 0.3s ease-out;
    }
    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.8;
    }
    h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.4rem;
    }
    p {
        color: var(--text-secondary);
        font-size: 0.9rem;
        max-width: 320px;
        line-height: 1.5;
    }
    .empty-action {
        margin-top: 1.25rem;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
