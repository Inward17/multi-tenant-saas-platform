<script lang="ts">
    import type { Component } from "svelte";
    import { Inbox } from "@lucide/svelte";
    import Button from "./Button.svelte";

    interface Props {
        icon?: Component<{ class?: string }>;
        title: string;
        message?: string;
        actionLabel?: string;
        onaction?: () => void;
    }

    let { icon: Icon = Inbox, title, message, actionLabel, onaction }: Props = $props();
</script>

<div
    class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
>
    <div class="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon class="size-6 text-muted-foreground" />
    </div>
    <div class="grid gap-1">
        <h3 class="font-semibold">{title}</h3>
        {#if message}
            <p class="max-w-sm text-sm text-muted-foreground">{message}</p>
        {/if}
    </div>
    {#if actionLabel && onaction}
        <Button onclick={onaction} class="mt-2">{actionLabel}</Button>
    {/if}
</div>
