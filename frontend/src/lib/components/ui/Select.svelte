<script lang="ts">
    interface Option {
        value: string;
        label: string;
    }

    interface Props {
        label?: string;
        id?: string;
        value?: string;
        options: Option[];
        placeholder?: string;
        disabled?: boolean;
        size?: "sm" | "md";
    }

    let {
        label,
        id,
        value = $bindable(""),
        options,
        placeholder,
        disabled = false,
        size = "md",
    }: Props = $props();
</script>

<div class="select-group">
    {#if label}
        <label for={id}>{label}</label>
    {/if}
    <select {id} bind:value class="select select-{size}" {disabled}>
        {#if placeholder}
            <option value="">{placeholder}</option>
        {/if}
        {#each options as opt}
            <option value={opt.value}>{opt.label}</option>
        {/each}
    </select>
</div>

<style>
    .select-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }
    .select-group label {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--text-secondary);
    }
    .select {
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-family: inherit;
        width: 100%;
        cursor: pointer;
        transition:
            border-color var(--transition),
            box-shadow var(--transition);
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        padding-right: 2rem;
    }
    .select-md {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
    }
    .select-sm {
        padding: 0.35rem 0.5rem;
        font-size: 0.75rem;
        border-radius: var(--radius-xs);
    }
    .select:hover:not(:disabled) {
        border-color: var(--accent);
    }
    .select:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.15);
    }
    .select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
