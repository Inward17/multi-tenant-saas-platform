<script lang="ts">
    import { cn } from "$lib/utils";

    let { email, class: className }: { email: string; class?: string } = $props();
</script>

<span
    class={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary uppercase select-none",
        className,
    )}
    title={email}
    aria-hidden="true"
>
    {email[0]}
</span>
