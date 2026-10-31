<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";
    import { cn } from "$lib/utils";

    let {
        class: className,
        children,
        ...rest
    }: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props();
</script>

<div
    class={cn("rounded-xl border bg-card text-card-foreground shadow-xs", className)}
    {...rest}
>
    {@render children?.()}
</div>
