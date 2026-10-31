<script lang="ts">
    import { Folder, Trash2 } from "@lucide/svelte";
    import { TASK_STATUSES, updateTask, type Task } from "$lib/api/tasks";
    import type { OrgUser } from "$lib/api/users";
    import { toastError, toastSuccess } from "$lib/stores/toast";
    import { formatDateLong } from "$lib/utils/format";
    import { cn } from "$lib/utils";
    import Button from "$lib/components/ui/Button.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import Input, { fieldClass } from "$lib/components/ui/Input.svelte";
    import Select from "$lib/components/ui/Select.svelte";

    interface Props {
        task: Task | null;
        users: OrgUser[];
        me: { id: string; role: string };
        onclose: () => void;
        onsaved: (task: Task) => void;
        ondelete?: (task: Task) => void;
    }

    let { task, users, me, onclose, onsaved, ondelete }: Props = $props();

    let title = $state("");
    let description = $state("");
    let status = $state("TODO");
    let assignedTo = $state("");
    let saving = $state(false);

    // Reset the form whenever a different task is opened
    $effect(() => {
        if (!task) return;
        title = task.title;
        description = task.description ?? "";
        status = task.status;
        assignedTo = task.assignedTo ?? "";
    });

    // Mirrors the API: OWNER/ADMIN edit everything, a MEMBER only the status of their own tasks
    const canManage = $derived(me.role === "OWNER" || me.role === "ADMIN");
    const canEditStatus = $derived(canManage || task?.assignedTo === me.id);

    const changes = $derived.by(() => {
        if (!task) return {};
        const c: Parameters<typeof updateTask>[1] = {};
        if (canManage && title.trim() && title.trim() !== task.title) c.title = title.trim();
        if (canManage && description !== (task.description ?? "")) c.description = description;
        if (canEditStatus && status !== task.status) c.status = status;
        if (canManage && assignedTo !== (task.assignedTo ?? "")) c.assignedTo = assignedTo || null;
        return c;
    });
    const dirty = $derived(Object.keys(changes).length > 0);

    async function save() {
        if (!task || !dirty) return;
        saving = true;
        try {
            const updated = await updateTask(task.id, changes);
            onsaved(updated);
            toastSuccess("Task updated");
            onclose();
        } catch (e: any) {
            toastError(e.message || "Failed to update task");
        } finally {
            saving = false;
        }
    }
</script>

<Dialog
    open={!!task}
    title={canManage ? "Edit task" : "Task details"}
    {onclose}
    class="mt-0 mr-0 mb-0 h-dvh max-h-dvh w-full max-w-md rounded-none border-y-0 border-r-0 sm:w-full"
>
    {#if task}
        <form
            class="grid gap-4"
            onsubmit={(e) => {
                e.preventDefault();
                save();
            }}
        >
            <Input label="Title" id="sheet-title" bind:value={title} disabled={!canManage} required />
            <div class="grid gap-2">
                <label for="sheet-desc" class="text-sm leading-none font-medium">Description</label>
                <textarea
                    id="sheet-desc"
                    rows="5"
                    class={cn(fieldClass, "h-auto resize-y py-2")}
                    placeholder={canManage ? "Add details about this task..." : "No description"}
                    bind:value={description}
                    disabled={!canManage}
                ></textarea>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
                <Select
                    label="Status"
                    id="sheet-status"
                    bind:value={status}
                    options={TASK_STATUSES}
                    disabled={!canEditStatus}
                />
                <Select
                    label="Assignee"
                    id="sheet-assignee"
                    bind:value={assignedTo}
                    options={users.map((u) => ({ value: u.id, label: u.email }))}
                    placeholder="Unassigned"
                    disabled={!canManage}
                />
            </div>

            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                <dt class="text-muted-foreground">Project</dt>
                <dd>
                    <a href="/dashboard/projects/{task.project.id}" class="inline-flex items-center gap-1 hover:underline">
                        <Folder class="size-3.5" />
                        {task.project.name}
                    </a>
                </dd>
                <dt class="text-muted-foreground">Created</dt>
                <dd>{formatDateLong(task.createdAt)}</dd>
            </dl>

            {#if !canEditStatus}
                <p class="text-sm text-muted-foreground">Only admins and the assignee can change this task.</p>
            {/if}

            <div class="flex items-center gap-2 pt-2">
                {#if canManage && ondelete}
                    <Button
                        variant="ghost"
                        class="text-muted-foreground hover:text-destructive"
                        onclick={() => task && ondelete(task)}
                    >
                        <Trash2 />
                        Delete
                    </Button>
                {/if}
                <div class="ml-auto flex gap-2">
                    <Button variant="outline" onclick={onclose}>Close</Button>
                    {#if canEditStatus}
                        <Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
                    {/if}
                </div>
            </div>
        </form>
    {/if}
</Dialog>
