<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Check, ChevronRight, Folder, ListTodo, Pencil, Plus, Trash2, X } from "@lucide/svelte";
    import { getProject, updateProject, deleteProject, type ProjectDetail } from "$lib/api/projects";
    import { getTask, TASK_STATUSES, type Task } from "$lib/api/tasks";
    import { getUsers, type OrgUser } from "$lib/api/users";
    import { onAnyTaskChange } from "$lib/realtime/socket";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import TaskSheet from "$lib/components/TaskSheet.svelte";
    import Avatar from "$lib/components/ui/Avatar.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import { fieldClass } from "$lib/components/ui/Input.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import { cn } from "$lib/utils";
    import type { LayoutData } from "../../$types";

    let { data }: { data: LayoutData } = $props();
    const projectId = $page.params.id as string;

    let project = $state<ProjectDetail | null>(null);
    let users = $state<OrgUser[]>([]);
    let loading = $state(true);

    async function load() {
        try {
            project = await getProject(projectId);
        } catch (e: any) {
            toastError(e.message || "Failed to load project");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        load();
        getUsers()
            .then((u) => (users = u))
            .catch(() => {});
        return onAnyTaskChange(load);
    });

    const canManage = $derived(data.user.role === "OWNER" || data.user.role === "ADMIN");
    const canDelete = $derived(data.user.role === "OWNER");

    const groups = $derived(
        TASK_STATUSES.map((s) => ({ ...s, tasks: project?.tasks.filter((t) => t.status === s.value) ?? [] })).filter(
            (g) => g.tasks.length,
        ),
    );

    // ─── Rename ───
    let editingName = $state(false);
    let nameDraft = $state("");
    let renaming = $state(false);

    async function saveName() {
        const name = nameDraft.trim();
        if (!project || !name || name === project.name) {
            editingName = false;
            return;
        }
        renaming = true;
        try {
            const updated = await updateProject(project.id, { name });
            project.name = updated.name;
            editingName = false;
            toastSuccess("Project renamed");
        } catch (e: any) {
            toastError(e.message || "Failed to rename project");
        } finally {
            renaming = false;
        }
    }

    // ─── Task side panel (project payload is partial, so fetch the full task) ───
    let openTask = $state<Task | null>(null);

    async function showTask(id: string) {
        try {
            openTask = await getTask(id);
        } catch (e: any) {
            toastError(e.message || "Failed to load task");
        }
    }

    // ─── Delete ───
    let showDeleteConfirm = $state(false);
    let deleting = $state(false);

    async function handleDelete() {
        if (!project) return;
        deleting = true;
        try {
            await deleteProject(project.id);
            toastSuccess("Project deleted");
            goto("/dashboard/projects");
        } catch (e: any) {
            toastError(e.message || "Failed to delete project");
        } finally {
            deleting = false;
        }
    }
</script>

<svelte:head>
    <title>{project?.name ?? "Project"} — TaskFlow</title>
</svelte:head>

{#if loading}
    <SkeletonLoader variant="row" count={4} />
{:else if project}
    <div class="grid grid-cols-1 gap-6">
        <div class="grid gap-3">
            <nav class="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
                <a href="/dashboard/projects" class="hover:text-foreground">Projects</a>
                <ChevronRight class="size-3.5" />
                <span class="truncate text-foreground" aria-current="page">{project.name}</span>
            </nav>
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex min-w-0 items-center gap-3">
                    <div class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Folder class="size-5" />
                    </div>
                    <div class="min-w-0">
                        {#if editingName}
                            <form
                                class="flex items-center gap-1"
                                onsubmit={(e) => {
                                    e.preventDefault();
                                    saveName();
                                }}
                            >
                                <!-- svelte-ignore a11y_autofocus -->
                                <input
                                    class={cn(fieldClass, "h-9 text-lg font-semibold md:text-lg")}
                                    aria-label="Project name"
                                    bind:value={nameDraft}
                                    onkeydown={(e) => e.key === "Escape" && (editingName = false)}
                                    autofocus
                                />
                                <Button type="submit" size="icon-sm" variant="ghost" aria-label="Save name" loading={renaming}>
                                    <Check />
                                </Button>
                                <Button size="icon-sm" variant="ghost" aria-label="Cancel rename" onclick={() => (editingName = false)}>
                                    <X />
                                </Button>
                            </form>
                        {:else}
                            <div class="flex items-center gap-1">
                                <h2 class="truncate text-2xl font-semibold tracking-tight">{project.name}</h2>
                                {#if canManage}
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        class="text-muted-foreground"
                                        aria-label="Rename project"
                                        onclick={() => {
                                            nameDraft = project?.name ?? "";
                                            editingName = true;
                                        }}
                                    >
                                        <Pencil />
                                    </Button>
                                {/if}
                            </div>
                        {/if}
                        <p class="text-sm text-muted-foreground">
                            {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <div class="flex gap-2">
                    {#if canManage}
                        <Button href="/dashboard/tasks?new={project.id}">
                            <Plus />
                            New task
                        </Button>
                    {/if}
                    {#if canDelete}
                        <Button
                            variant="outline"
                            class="text-destructive hover:text-destructive"
                            onclick={() => (showDeleteConfirm = true)}
                        >
                            <Trash2 />
                            Delete
                        </Button>
                    {/if}
                </div>
            </div>
        </div>

        {#if project.tasks.length === 0}
            <EmptyState
                icon={ListTodo}
                title="No tasks in this project"
                message={canManage ? "Add the first task to get this project moving." : "Tasks added to this project will show up here."}
                actionLabel={canManage ? "Create task" : undefined}
                onaction={canManage ? () => goto(`/dashboard/tasks?new=${projectId}`) : undefined}
            />
        {:else}
            {#each groups as group (group.value)}
                <section class="grid gap-2">
                    <h3 class="flex items-center gap-2 text-sm font-medium">
                        <Badge variant={group.variant}>{group.label}</Badge>
                        <span class="text-muted-foreground tabular-nums">{group.tasks.length}</span>
                    </h3>
                    <Card class="divide-y">
                        {#each group.tasks as task (task.id)}
                            <button
                                class="flex w-full items-center gap-4 px-5 py-2.5 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
                                onclick={() => showTask(task.id)}
                            >
                                <span class="flex-1 truncate text-sm font-medium">{task.title}</span>
                                {#if task.assignee}
                                    <span class="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Avatar email={task.assignee.email} class="size-6 text-[10px]" />
                                        <span class="hidden sm:inline">{task.assignee.email.split("@")[0]}</span>
                                    </span>
                                {:else}
                                    <span class="text-sm text-muted-foreground italic">Unassigned</span>
                                {/if}
                            </button>
                        {/each}
                    </Card>
                </section>
            {/each}
        {/if}
    </div>
{/if}

<TaskSheet task={openTask} {users} me={data.user} onclose={() => (openTask = null)} onsaved={() => load()} />

<Dialog
    open={showDeleteConfirm}
    title="Delete project?"
    description="This deletes {project?.name ?? 'the project'} and all of its tasks. This can't be undone."
    onclose={() => (showDeleteConfirm = false)}
>
    <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => (showDeleteConfirm = false)}>Cancel</Button>
        <Button variant="destructive" loading={deleting} onclick={handleDelete}>Delete project</Button>
    </div>
</Dialog>
