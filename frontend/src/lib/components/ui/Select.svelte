<script lang="ts">
    import type { HTMLSelectAttributes } from "svelte/elements";
    import { ChevronDown } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    interface Option {
        value: string;
        label: string;
    }

    type Props = Omit<HTMLSelectAttributes, "value" | "size"> & {
        label?: string;
        value?: string;
        options: Option[];
        placeholder?: string;
        size?: "default" | "sm";
    };

    let {
        label,
        id,
        value = $bindable(""),
        options,
        placeholder,
        size = "default",
        class: className,
        ...rest
    }: Props = $props();
</script>

<div class={cn("grid gap-2", className)}>
    {#if label}
        <label for={id} class="text-sm leading-none font-medium">{label}</label>
    {/if}
    <div class="relative">
        <select
            {id}
            bind:value
            class={cn(
                "w-full appearance-none rounded-md border border-input bg-transparent pr-8 pl-3 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
                size === "sm" ? "h-8 text-xs" : "h-9 text-sm",
            )}
            {...rest}
        >
            {#if placeholder}
                <option value="">{placeholder}</option>
            {/if}
            {#each options as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
            {/each}
        </select>
        <ChevronDown
            class="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
    </div>
</div>
