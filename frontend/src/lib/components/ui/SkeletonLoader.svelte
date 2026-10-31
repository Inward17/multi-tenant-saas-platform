<script lang="ts">
    interface Props {
        variant?: "card" | "row" | "stat";
        count?: number;
    }

    let { variant = "card", count = 3 }: Props = $props();

    const layout = {
        card: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
        row: "grid gap-3",
        stat: "grid gap-4 sm:grid-cols-3",
    };
</script>

<div class={layout[variant]} aria-busy="true" aria-label="Loading">
    {#each Array(count) as _}
        <div class="animate-pulse rounded-xl border bg-card p-5">
            {#if variant === "row"}
                <div class="flex items-center gap-4">
                    <div class="h-5 w-20 rounded-md bg-muted"></div>
                    <div class="grid flex-1 gap-2">
                        <div class="h-4 w-1/2 rounded bg-muted"></div>
                        <div class="h-3 w-1/3 rounded bg-muted"></div>
                    </div>
                    <div class="size-8 rounded-full bg-muted"></div>
                </div>
            {:else if variant === "stat"}
                <div class="grid gap-3">
                    <div class="h-4 w-24 rounded bg-muted"></div>
                    <div class="h-8 w-16 rounded bg-muted"></div>
                </div>
            {:else}
                <div class="grid gap-3">
                    <div class="size-10 rounded-lg bg-muted"></div>
                    <div class="h-4 w-2/3 rounded bg-muted"></div>
                    <div class="h-3 w-1/3 rounded bg-muted"></div>
                </div>
            {/if}
        </div>
    {/each}
</div>
