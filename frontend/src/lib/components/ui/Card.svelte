<script lang="ts">
    interface Props {
        hover?: boolean;
        padding?: "none" | "sm" | "md" | "lg";
        onclick?: () => void;
    }

    let { hover = false, padding = "md", onclick }: Props = $props();
</script>

<div
    class="card pad-{padding}"
    class:hoverable={hover}
    class:clickable={!!onclick}
    role={onclick ? "button" : undefined}
    tabindex={onclick ? 0 : undefined}
    {onclick}
    onkeydown={(e) => {
        if (onclick && (e.key === "Enter" || e.key === " ")) onclick();
    }}
>
    <slot />
</div>

<style>
    .card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pad-none {
        padding: 0;
    }
    .pad-sm {
        padding: 1rem;
    }
    .pad-md {
        padding: 1.5rem;
    }
    .pad-lg {
        padding: 2rem;
    }

    .hoverable:hover {
        border-color: rgba(108, 99, 255, 0.3);
        box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(108, 99, 255, 0.1);
        transform: translateY(-2px);
    }
    .clickable {
        cursor: pointer;
    }
</style>
