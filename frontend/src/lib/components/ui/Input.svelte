<script lang="ts">
    interface Props {
        label?: string;
        type?: string;
        placeholder?: string;
        value: string;
        required?: boolean;
        minlength?: number;
        id?: string;
        oninput?: (e: Event) => void;
    }

    let {
        label,
        type = "text",
        placeholder = "",
        value = $bindable(),
        required = false,
        minlength,
        id,
        oninput,
    }: Props = $props();
</script>

<div class="input-group">
    {#if label}
        <label for={id}>{label}</label>
    {/if}
    <input
        {id}
        {type}
        {placeholder}
        {required}
        {minlength}
        bind:value
        {oninput}
    />
</div>

<style>
    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }
    label {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--text-secondary);
        letter-spacing: 0.2px;
    }
    input {
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.875rem;
        width: 100%;
        transition: all 0.2s;
    }
    input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.15);
    }
    input::placeholder {
        color: rgba(153, 153, 187, 0.5);
    }
</style>
