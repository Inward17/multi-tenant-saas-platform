<script lang="ts">
    interface Props {
        variant?: "card" | "row" | "stat";
        count?: number;
    }

    let { variant = "card", count = 3 }: Props = $props();
</script>

<div class="skeleton-container skeleton-{variant}">
    {#each Array(count) as _}
        {#if variant === "card"}
            <div class="skel-card">
                <div class="skel-line skel-title"></div>
                <div class="skel-line skel-text"></div>
                <div class="skel-line skel-text short"></div>
            </div>
        {:else if variant === "row"}
            <div class="skel-row">
                <div class="skel-circle"></div>
                <div class="skel-row-content">
                    <div class="skel-line skel-title"></div>
                    <div class="skel-line skel-text"></div>
                </div>
                <div class="skel-line skel-badge"></div>
            </div>
        {:else if variant === "stat"}
            <div class="skel-stat">
                <div class="skel-circle large"></div>
                <div class="skel-line skel-value"></div>
                <div class="skel-line skel-label"></div>
            </div>
        {/if}
    {/each}
</div>

<style>
    .skeleton-container {
        display: flex;
        gap: 1rem;
    }
    .skeleton-card {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        width: 100%;
    }
    .skeleton-row {
        flex-direction: column;
        width: 100%;
    }
    .skeleton-stat {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
        width: 100%;
    }

    .skel-card,
    .skel-row,
    .skel-stat {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 1.5rem;
    }

    .skel-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }

    .skel-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 2rem;
    }

    .skel-row-content {
        flex: 1;
    }

    .skel-line {
        height: 12px;
        background: linear-gradient(
            90deg,
            var(--bg-input) 25%,
            rgba(108, 99, 255, 0.06) 50%,
            var(--bg-input) 75%
        );
        background-size: 200% 100%;
        border-radius: 6px;
        animation: shimmer 1.5s ease-in-out infinite;
    }

    .skel-title {
        width: 60%;
        height: 14px;
        margin-bottom: 0.75rem;
    }
    .skel-text {
        width: 90%;
        margin-bottom: 0.5rem;
    }
    .skel-text.short {
        width: 40%;
    }
    .skel-badge {
        width: 64px;
        height: 24px;
        border-radius: 100px;
    }
    .skel-value {
        width: 48px;
        height: 28px;
    }
    .skel-label {
        width: 80px;
    }
    .skel-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(
            90deg,
            var(--bg-input) 25%,
            rgba(108, 99, 255, 0.06) 50%,
            var(--bg-input) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
        flex-shrink: 0;
    }
    .skel-circle.large {
        width: 48px;
        height: 48px;
    }

    @keyframes shimmer {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
</style>
