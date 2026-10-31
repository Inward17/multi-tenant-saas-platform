<script lang="ts" module>
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        todo: "border-transparent bg-muted text-muted-foreground",
        "in-progress": "border-transparent bg-warning/15 text-warning",
        done: "border-transparent bg-success/15 text-success",
        owner: "border-transparent bg-primary/15 text-primary",
        admin: "border-primary/30 text-primary",
        member: "border-transparent bg-secondary text-secondary-foreground",
    };

    export type BadgeVariant = keyof typeof variants;

    const STATUS_VARIANTS = new Set<BadgeVariant>(["todo", "in-progress", "done"]);
</script>

<script lang="ts">
    import type { Snippet } from "svelte";
    import { cn } from "$lib/utils";

    let {
        variant = "secondary",
        class: className,
        children,
    }: { variant?: BadgeVariant; class?: string; children?: Snippet } = $props();
</script>

<span
    class={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap capitalize [&>svg]:size-3",
        variants[variant],
        className,
    )}
>
    {#if STATUS_VARIANTS.has(variant)}
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
    {/if}
    {@render children?.()}
</span>
