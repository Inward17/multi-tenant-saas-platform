<script lang="ts" module>
    export const buttonVariants = {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
            "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/40",
        outline:
            "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
    };

    export const buttonSizes = {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
    };
</script>

<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
    import { LoaderCircle } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    type Props = HTMLButtonAttributes &
        HTMLAnchorAttributes & {
            variant?: keyof typeof buttonVariants;
            size?: keyof typeof buttonSizes;
            loading?: boolean;
            children?: Snippet;
        };

    let {
        variant = "default",
        size = "default",
        loading = false,
        href,
        type = "button",
        disabled,
        class: className,
        children,
        ...rest
    }: Props = $props();

    const classes = $derived(
        cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            buttonVariants[variant],
            buttonSizes[size],
            className,
        ),
    );
</script>

{#if href}
    <a {href} class={classes} {...rest}>
        {@render children?.()}
    </a>
{:else}
    <button {type} class={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
        {#if loading}
            <LoaderCircle class="animate-spin" />
        {/if}
        {@render children?.()}
    </button>
{/if}
