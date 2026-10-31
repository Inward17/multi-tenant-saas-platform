<script lang="ts">
    import { onMount } from "svelte";
    import { ChevronLeft, ChevronRight, Folder, ListTodo, Plus, Search, Trash2, X } from "@lucide/svelte";
    import {
        getTasks,
        createTask,
        updateTask,
        deleteTask,
        type Task,
    } from "$lib/api/tasks";
    import { getProjects, type Project } from "$lib/api/projects";
    import { getUsers, type OrgUser } from "$lib/api/users";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import Avatar from "$lib/components/ui/Avatar.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import Input, { fieldClass } from "$lib/components/ui/Input.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import Select from "$lib/components/ui/Select.svelte";
    import { cn } from "$lib/utils";
    import type { LayoutData } from "../$types";

    let { data }: { data: LayoutData } = $props();
    let tasks = $state<Task[]>([]);
    let meta = $state({ total: 0, page: 1, limit: 10, totalPages: 1 });
    let currentPage = $state(1);
    let projects = $state<Project[]>([]);
    let users = $state<OrgUser[]>([]);
    let loading = $state(true);
    let statusFilter = $state("");
    let searchQuery = $state("");
    let showCreate = $state(false);
    let showDeleteConfirm = $state<string | null>(null);

    // Create form
    let newTitle = $state("");
    let newDescription = $state("");
    let newProjectId = $state("");
    let newStatus = $state("TODO");
    let newAssignee = $state("");
    let creating = $state(false);
    let deleting = $state(false);

    onMount(() => {
        loadData();
    });

    async function loadData() {
        loading = true;
        try {
            const [tasksRes, projectsRes, usersRes] = await Promise.all([
                getTasks({
                    page: String(currentPage),
                    limit: "10",
                    status: statusFilter,
                }),
                getProjects(),
                getUsers().catch(() => [] as OrgUser[]),
            ]);
            tasks = tasksRes.data;
            meta = tasksRes.meta;
            projects = projectsRes;
            users = usersRes;
            if (!newProjectId && projectsRes.length)
                newProjectId = projectsRes[0].id;
        } catch (e: any) {
            toastError(e.message || "Failed to load tasks");
        } finally {
            loading = false;
        }
    }

    function filterByStatus(status: string) {
        statusFilter = status;
        currentPage = 1;
        loadData();
    }

    function goToPage(page: number) {
        currentPage = page;
        loadData();
    }

    async function handleCreate() {
        if (!newTitle.trim() || !newProjectId) return;
        creating = true;
        try {
            await createTask({
                title: newTitle,
                description: newDescription || undefined,
                status: newStatus,
                projectId: newProjectId,
                assignedTo: newAssignee || undefined,
            });
            newTitle = "";
            newDescription = "";
            newStatus = "TODO";
            newAssignee = "";
            showCreate = false;
            toastSuccess("Task created successfully");
            loadData();
        } catch (e: any) {
            toastError(e.message || "Failed to create task");
        } finally {
            creating = false;
        }
    }

    async function cycleStatus(task: Task) {
        const cycle: Record<string, string> = {
            TODO: "IN_PROGRESS",
            IN_PROGRESS: "DONE",
            DONE: "TODO",
        };
        const next = cycle[task.status];
        try {
            const updated = await updateTask(task.id, { status: next });
            const idx = tasks.findIndex((t) => t.id === task.id);
            if (idx >= 0) tasks[idx] = updated;
            toastSuccess(`Status → ${formatStatus(next)}`);
        } catch (e: any) {
            toastError(e.message || "Failed to update status");
        }
    }

    async function confirmDelete() {
        if (!showDeleteConfirm) return;
        deleting = true;
        try {
            await deleteTask(showDeleteConfirm);
            showDeleteConfirm = null;
            toastSuccess("Task deleted");
            loadData();
        } catch (e: any) {
            toastError(e.message || "Failed to delete task");
        } finally {
            deleting = false;
        }
    }

    async function reassignTask(task: Task, userId: string) {
        try {
            const updated = await updateTask(task.id, {
                assignedTo: userId || null,
            });
            const idx = tasks.findIndex((t) => t.id === task.id);
            if (idx >= 0) tasks[idx] = updated;
            const assigneeName = userId
                ? users.find((u) => u.id === userId)?.email.split("@")[0]
                : "nobody";
            toastSuccess(`Assigned to ${assigneeName}`);
        } catch (e: any) {
            toastError(e.message || "Failed to reassign");
        }
    }

    function statusVariant(status: string): "todo" | "in-progress" | "done" {
        return status.toLowerCase().replace("_", "-") as any;
    }

    function formatStatus(s: string) {
        return s.replace("_", " ").toLowerCase();
    }

    const canCreate = $derived(
        data.user.role === "OWNER" || data.user.role === "ADMIN",
    );
    const canDelete = $derived(
        data.user.role === "OWNER" || data.user.role === "ADMIN",
    );

    const filters = [
        { value: "", label: "All" },
        { value: "TODO", label: "To do" },
        { value: "IN_PROGRESS", label: "In progress" },
        { value: "DONE", label: "Done" },
    ];

    const statusOptions = [
        { value: "TODO", label: "To do" },
        { value: "IN_PROGRESS", label: "In progress" },
        { value: "DONE", label: "Done" },
    ];

    const projectOptions = $derived(
        projects.map((p) => ({ value: p.id, label: p.name })),
    );

    const userOptions = $derived(
        users.map((u) => ({ value: u.id, label: u.email })),
    );

    const assigneeOptions = $derived(
        users.map((u) => ({ value: u.id, label: u.email.split("@")[0] })),
    );

    const filteredTasks = $derived(
        searchQuery.trim()
            ? tasks.filter((t) =>
                  t.title
                      .toLowerCase()
                      .includes(searchQuery.trim().toLowerCase()),
              )
            : tasks,
    );
</script>

<svelte:head>
    <title>Tasks — TaskFlow</title>
</svelte:head>

<div class="grid gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
            <h2 class="text-2xl font-semibold tracking-tight">Tasks</h2>
            <p class="text-sm text-muted-foreground">
                {meta.total} task{meta.total !== 1 ? "s" : ""}
            </p>
        </div>
        {#if canCreate}
            <Button onclick={() => (showCreate = true)}>
                <Plus />
                New task
            </Button>
        {/if}
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="inline-flex w-fit rounded-lg bg-muted p-1" role="group" aria-label="Filter by status">
            {#each filters as f (f.value)}
                <button
                    class={cn(
                        "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                        statusFilter === f.value
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={statusFilter === f.value}
                    onclick={() => filterByStatus(f.value)}
                >
                    {f.label}
                </button>
            {/each}
        </div>

        <div class="relative w-full sm:max-w-xs">
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
                class="{fieldClass} pr-9 pl-9"
                type="text"
                placeholder="Search this page..."
                aria-label="Search tasks"
                bind:value={searchQuery}
            />
            {#if searchQuery}
                <button
                    class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground"
                    onclick={() => (searchQuery = "")}
                    aria-label="Clear search"
                >
                    <X class="size-4" />
                </button>
            {/if}
        </div>
    </div>

    {#if loading}
        <SkeletonLoader variant="row" count={5} />
    {:else if filteredTasks.length === 0}
        <EmptyState
            icon={ListTodo}
            title={searchQuery
                ? "No matching tasks"
                : statusFilter
                  ? "No tasks with this status"
                  : "No tasks yet"}
            message={searchQuery
                ? `No results for "${searchQuery}"`
                : statusFilter
                  ? "Try another filter to see more tasks."
                  : "Create your first task to get started."}
            actionLabel={!statusFilter && !searchQuery && canCreate ? "Create task" : undefined}
            onaction={!statusFilter && !searchQuery && canCreate ? () => (showCreate = true) : undefined}
        />
    {:else}
        <Card class="divide-y">
            {#each filteredTasks as task (task.id)}
                <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                    <button
                        class="flex w-fit rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:w-28"
                        onclick={() => cycleStatus(task)}
                        title="Click to change status"
                        aria-label="Status: {formatStatus(task.status)}. Click to change"
                    >
                        <Badge variant={statusVariant(task.status)} class="transition-opacity hover:opacity-80">
                            {formatStatus(task.status)}
                        </Badge>
                    </button>

                    <div class="min-w-0 flex-1">
                        <p class="truncate font-medium">{task.title}</p>
                        {#if task.description}
                            <p class="truncate text-sm text-muted-foreground">{task.description}</p>
                        {/if}
                        <a
                            href="/dashboard/projects/{task.project.id}"
                            class="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <Folder class="size-3" />
                            {task.project.name}
                        </a>
                    </div>

                    <div class="flex items-center gap-2">
                        {#if task.assignee}
                            <Avatar email={task.assignee.email} class="size-7" />
                        {/if}
                        <Select
                            size="sm"
                            class="w-36"
                            aria-label="Assignee"
                            disabled={!canCreate}
                            value={task.assignedTo || ""}
                            placeholder="Unassigned"
                            options={assigneeOptions}
                            onchange={(e) => reassignTask(task, (e.target as HTMLSelectElement).value)}
                        />
                        {#if canDelete}
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                class="text-muted-foreground hover:text-destructive"
                                aria-label="Delete {task.title}"
                                onclick={() => (showDeleteConfirm = task.id)}
                            >
                                <Trash2 />
                            </Button>
                        {/if}
                    </div>
                </div>
            {/each}
        </Card>

        {#if meta.totalPages > 1}
            <div class="flex items-center justify-between gap-4">
                <p class="text-sm text-muted-foreground">
                    Page {currentPage} of {meta.totalPages}
                </p>
                <div class="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onclick={() => goToPage(currentPage - 1)}
                    >
                        <ChevronLeft />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= meta.totalPages}
                        onclick={() => goToPage(currentPage + 1)}
                    >
                        Next
                        <ChevronRight />
                    </Button>
                </div>
            </div>
        {/if}
    {/if}
</div>

<Dialog
    open={showCreate}
    title="New task"
    onclose={() => (showCreate = false)}
>
    <form
        onsubmit={(e) => {
            e.preventDefault();
            handleCreate();
        }}
        class="grid gap-4"
    >
        <Input
            label="Title"
            placeholder="e.g. Design landing page"
            bind:value={newTitle}
            required
            id="task-title"
        />
        <Input
            label="Description (optional)"
            placeholder="Add details about this task..."
            bind:value={newDescription}
            id="task-desc"
        />
        <div class="grid gap-4 sm:grid-cols-2">
            <Select
                label="Project"
                id="task-project"
                bind:value={newProjectId}
                options={projectOptions}
            />
            <Select
                label="Status"
                id="task-status"
                bind:value={newStatus}
                options={statusOptions}
            />
        </div>
        <Select
            label="Assignee (optional)"
            id="task-assignee"
            bind:value={newAssignee}
            options={userOptions}
            placeholder="Unassigned"
        />
        <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" onclick={() => (showCreate = false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create task</Button>
        </div>
    </form>
</Dialog>

<Dialog
    open={!!showDeleteConfirm}
    title="Delete task?"
    description="This task will be removed. This can't be undone."
    onclose={() => (showDeleteConfirm = null)}
>
    <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => (showDeleteConfirm = null)}>Cancel</Button>
        <Button variant="destructive" loading={deleting} onclick={confirmDelete}>Delete task</Button>
    </div>
</Dialog>
