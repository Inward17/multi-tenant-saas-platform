<script lang="ts">
    import { untrack } from "svelte";
    import { goto, invalidateAll } from "$app/navigation";
    import { Building2, TriangleAlert } from "@lucide/svelte";
    import { updateOrganization, deleteOrganization } from "$lib/api/organizations";
    import { clearUser } from "$lib/stores/auth";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import type { LayoutData } from "../$types";

    let { data }: { data: LayoutData } = $props();
    const isOwner = $derived(data.user.role === "OWNER");

    // Draft starts from the loaded name; it is not meant to follow later changes
    let name = $state(untrack(() => data.user.organizationName));
    let saving = $state(false);

    async function rename() {
        const trimmed = name.trim();
        if (!trimmed || trimmed === data.user.organizationName) return;
        saving = true;
        try {
            await updateOrganization({ name: trimmed });
            await invalidateAll(); // refreshes the workspace name in the sidebar
            toastSuccess("Workspace renamed");
        } catch (e: any) {
            toastError(e.message || "Failed to rename workspace");
        } finally {
            saving = false;
        }
    }

    let showDelete = $state(false);
    let confirmText = $state("");
    let deleting = $state(false);

    async function destroy() {
        deleting = true;
        try {
            await deleteOrganization();
            clearUser();
            toastSuccess("Workspace deleted");
            goto("/");
        } catch (e: any) {
            toastError(e.message || "Failed to delete workspace");
            deleting = false;
        }
    }
</script>

<svelte:head>
    <title>Settings — TaskFlow</title>
</svelte:head>

<div class="mx-auto grid max-w-3xl gap-6">
    <div>
        <h2 class="text-2xl font-semibold tracking-tight">Workspace settings</h2>
        <p class="text-sm text-muted-foreground">Manage {data.user.organizationName}.</p>
    </div>

    {#if !isOwner}
        <Card class="p-6 text-sm text-muted-foreground">Only the workspace owner can change these settings.</Card>
    {:else}
        <Card class="p-6">
            <form
                class="grid gap-3"
                onsubmit={(e) => {
                    e.preventDefault();
                    rename();
                }}
            >
                <div class="flex items-center gap-2 font-medium">
                    <Building2 class="size-4 text-muted-foreground" />
                    Workspace name
                </div>
                <div class="flex flex-col gap-2 sm:flex-row">
                    <Input id="orgName" aria-label="Workspace name" bind:value={name} class="flex-1" required />
                    <Button
                        type="submit"
                        loading={saving}
                        disabled={!name.trim() || name.trim() === data.user.organizationName}
                    >
                        Save
                    </Button>
                </div>
            </form>
        </Card>

        <Card class="flex flex-col gap-4 border-destructive/30 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p class="flex items-center gap-2 font-medium text-destructive">
                    <TriangleAlert class="size-4" />
                    Delete workspace
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                    Permanently deletes every project, task, member account and activity log.
                </p>
            </div>
            <Button
                variant="destructive"
                onclick={() => {
                    confirmText = "";
                    showDelete = true;
                }}
            >
                Delete workspace
            </Button>
        </Card>
    {/if}
</div>

<Dialog
    open={showDelete}
    title="Delete {data.user.organizationName}?"
    description="This can't be undone. All members lose access immediately."
    onclose={() => (showDelete = false)}
>
    <form
        class="grid gap-4"
        onsubmit={(e) => {
            e.preventDefault();
            if (confirmText === data.user.organizationName) destroy();
        }}
    >
        <Input
            id="confirmDelete"
            label="Type the workspace name to confirm"
            placeholder={data.user.organizationName}
            autocomplete="off"
            bind:value={confirmText}
        />
        <div class="flex justify-end gap-2">
            <Button variant="outline" onclick={() => (showDelete = false)}>Cancel</Button>
            <Button
                type="submit"
                variant="destructive"
                loading={deleting}
                disabled={confirmText !== data.user.organizationName}
            >
                Delete forever
            </Button>
        </div>
    </form>
</Dialog>
