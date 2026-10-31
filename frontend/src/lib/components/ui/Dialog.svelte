<script lang="ts">
    import type { Snippet } from "svelte";
    import { X } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    interface Props {
        open: boolean;
        title: string;
        description?: string;
        onclose: () => void;
        children: Snippet;
        class?: string;
    }

    let { open, title, description, onclose, children, class: className }: Props = $props();
    let dialog: HTMLDialogElement;
    const titleId = `dialog-${Math.random().toString(36).slice(2)}`;

    // Native <dialog> gives focus trapping, Esc-to-close and top-layer stacking for free
    $effect(() => {
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    });
</script>

<dialog
    bind:this={dialog}
    {onclose}
    onclick={(e) => e.target === dialog && onclose()}
    aria-labelledby={titleId}
    class={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/60 backdrop:backdrop-blur-[2px] open:animate-fade-in",
        className,
    )}
>
    <div class="grid gap-4 p-6">
        <div class="grid gap-1.5 pr-8">
            <h2 id={titleId} class="text-lg leading-none font-semibold">{title}</h2>
            {#if description}
                <p class="text-sm text-muted-foreground">{description}</p>
            {/if}
        </div>
        {@render children()}
    </div>
    <button
        type="button"
        onclick={onclose}
        aria-label="Close"
        class="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
        <X class="size-4" />
    </button>
</dialog>
