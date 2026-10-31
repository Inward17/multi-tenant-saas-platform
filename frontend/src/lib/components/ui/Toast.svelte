<script lang="ts">
    import { CircleCheck, CircleX, Info } from "@lucide/svelte";
    import { toasts } from "$lib/stores/toast";

    const icons = { success: CircleCheck, error: CircleX, info: Info };
    const tones = { success: "text-success", error: "text-destructive", info: "text-primary" };
</script>

<div
    class="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
    aria-live="polite"
    role="status"
>
    {#each $toasts as toast (toast.id)}
        {@const Icon = icons[toast.type]}
        <div
            class="pointer-events-auto flex animate-fade-in items-start gap-3 rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-lg"
        >
            <Icon class="mt-0.5 size-4 shrink-0 {tones[toast.type]}" />
            <span class="flex-1">{toast.message}</span>
        </div>
    {/each}
</div>
