<script lang="ts" module>
    export const fieldClass =
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30";
</script>

<script lang="ts">
    import type { HTMLInputAttributes } from "svelte/elements";
    import { cn } from "$lib/utils";

    type Props = Omit<HTMLInputAttributes, "value"> & { label?: string; value?: string };

    let {
        label,
        id,
        type = "text",
        value = $bindable(""),
        class: className,
        ...rest
    }: Props = $props();
</script>

<div class={cn("grid gap-2", className)}>
    {#if label}
        <label for={id} class="text-sm leading-none font-medium">{label}</label>
    {/if}
    <input {id} {type} bind:value class={fieldClass} {...rest} />
</div>
