<script lang="ts">
    interface Props {
        variant?:
            | "owner"
            | "admin"
            | "member"
            | "todo"
            | "in-progress"
            | "done"
            | "neutral";
        size?: "sm" | "md";
        pulse?: boolean;
    }

    let { variant = "neutral", size = "sm", pulse = false }: Props = $props();
</script>

<span class="badge badge-{variant} badge-{size}" class:pulse>
    <slot />
</span>

<style>
    .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 100px;
        transition: all 0.2s;
    }

    .badge-sm {
        padding: 0.2rem 0.6rem;
        font-size: 0.65rem;
    }
    .badge-md {
        padding: 0.3rem 0.75rem;
        font-size: 0.75rem;
    }

    /* Role badges */
    .badge-owner {
        background: rgba(108, 99, 255, 0.15);
        color: #8b83ff;
        border: 1px solid rgba(108, 99, 255, 0.2);
    }
    .badge-admin {
        background: rgba(251, 191, 36, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.2);
    }
    .badge-member {
        background: rgba(45, 212, 191, 0.12);
        color: #2dd4bf;
        border: 1px solid rgba(45, 212, 191, 0.2);
    }

    /* Status badges */
    .badge-todo {
        background: rgba(148, 163, 184, 0.12);
        color: #94a3b8;
        border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .badge-in-progress {
        background: rgba(251, 191, 36, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.2);
    }
    .badge-done {
        background: rgba(45, 212, 191, 0.12);
        color: #2dd4bf;
        border: 1px solid rgba(45, 212, 191, 0.2);
    }

    .badge-neutral {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-secondary);
        border: 1px solid var(--border);
    }

    .pulse {
        animation: badgePulse 2s ease-in-out infinite;
    }
    @keyframes badgePulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }
</style>
