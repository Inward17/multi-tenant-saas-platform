<script lang="ts">
    import { onMount, untrack } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import {
        ChevronLeft,
        ChevronRight,
        Columns3,
        Folder,
        List,
        ListTodo,
        Plus,
        Search,
        Trash2,
        TriangleAlert,
        X,
    } from "@lucide/svelte";
    import {
        getTasks,
        createTask,
        updateTask,
        deleteTask,
        statusMeta,
        TASK_STATUSES,
        type Task,
        type TaskStatus,
    } from "$lib/api/tasks";
    import { getProjects, type Project } from "$lib/api/projects";
    import { getUsers, type OrgUser } from "$lib/api/users";
    import { onAnyTaskChange } from "$lib/realtime/socket";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import TaskSheet from "$lib/components/TaskSheet.svelte";
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

    const LIST_LIMIT = 20;
    // ponytail: board shows the first 100 tasks (API max); add per-column paging if workspaces outgrow it
    const BOARD_LIMIT = 100;

    // ─── URL state: refresh, back and shared links keep the view ───
    const params = $derived($page.url.searchParams);
    const view = $derived(params.get("view") === "board" ? "board" : "list");
    const statusFilter = $derived(view === "board" ? "" : (params.get("status") ?? ""));
    const query = $derived(params.get("q") ?? "");
    const currentPage = $derived(Math.max(1, Number(params.get("page")) || 1));

    function setParams(next: Record<string, string | number | null>) {
        const url = new URL($page.url);
        for (const [key, value] of Object.entries(next)) {
            if (value === null || value === "") url.searchParams.delete(key);
            else url.searchParams.set(key, String(value));
        }
        goto(url, { replaceState: true, keepFocus: true, noScroll: true });
    }

    let searchInput = $state($page.url.searchParams.get("q") ?? "");
    let searchTimer: ReturnType<typeof setTimeout>;
    function onSearchInput() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => setParams({ q: searchInput.trim(), page: null }), 300);
    }
    function clearSearch() {
        searchInput = "";
        setParams({ q: null, page: null });
    }

    // ─── Data ───
    let tasks = $state<Task[]>([]);
    let meta = $state({ total: 0, page: 1, limit: LIST_LIMIT, totalPages: 1 });
    let projects = $state<Project[]>([]);
    let users = $state<OrgUser[]>([]);
    let loading = $state(true);
    let loadError = $state<string | null>(null);
    let requestSeq = 0;

    // silent = background refresh: keep showing current rows, don't toast on failure
    async function loadTasks(silent = false) {
        const seq = ++requestSeq;
        if (!silent) loading = true;
        try {
            const res = await getTasks({
                page: view === "board" ? "1" : String(currentPage),
                limit: String(view === "board" ? BOARD_LIMIT : LIST_LIMIT),
                status: statusFilter,
                search: query,
            });
            if (seq !== requestSeq) return; // a newer request superseded this one
            tasks = res.data;
            meta = res.meta;
            loadError = null;
        } catch (e: any) {
            if (seq !== requestSeq || silent) return;
            loadError = e.message || "Failed to load tasks";
        } finally {
            if (seq === requestSeq) loading = false;
        }
    }

    $effect(() => {
        view;
        statusFilter;
        query;
        currentPage;
        untrack(() => loadTasks());
    });

    onMount(() => {
        Promise.all([getProjects(), getUsers().catch(() => [] as OrgUser[])])
            .then(([p, u]) => {
                projects = p;
                users = u;
                if (!newProjectId && p.length) newProjectId = p[0].id;
            })
            .catch((e: any) => toastError(e.message || "Failed to load projects"));

        // ?new=<projectId> opens the create dialog (linked from a project page)
        const preset = $page.url.searchParams.get("new");
        if (preset !== null) {
            if (preset) newProjectId = preset;
            showCreate = canManage;
            setParams({ new: null });
        }

        return onAnyTaskChange(() => loadTasks(true));
    });

    // ─── Permissions (mirror the API) ───
    const canManage = $derived(data.user.role === "OWNER" || data.user.role === "ADMIN");
    const canEditStatus = (t: Task) => canManage || t.assignedTo === data.user.id;

    // ─── Updates: apply locally first, roll back if the API refuses ───
    async function patchTask(
        task: Task,
        changes: Parameters<typeof updateTask>[1],
        local: Partial<Task>,
        successMessage?: string,
    ) {
        const previous = { status: task.status, assignedTo: task.assignedTo, assignee: task.assignee };
        Object.assign(task, local);
        try {
            Object.assign(task, await updateTask(task.id, changes));
            if (successMessage) toastSuccess(successMessage);
        } catch (e: any) {
            Object.assign(task, previous);
            toastError(e.message || "Failed to update task");
        }
    }

    function setStatus(task: Task, status: TaskStatus) {
        if (task.status === status) return;
        patchTask(task, { status }, { status }, `Moved to ${statusMeta(status).label.toLowerCase()}`);
    }

    const nextStatus: Record<TaskStatus, TaskStatus> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO" };

    function reassign(task: Task, userId: string) {
        const user = users.find((u) => u.id === userId);
        patchTask(
            task,
            { assignedTo: userId || null },
            { assignedTo: userId || null, assignee: user ? { id: user.id, email: user.email } : null },
            `Assigned to ${user ? user.email.split("@")[0] : "nobody"}`,
        );
    }

    // ─── Side panel ───
    let openTask = $state<Task | null>(null);

    function onSheetSaved(updated: Task) {
        const i = tasks.findIndex((t) => t.id === updated.id);
        if (i >= 0) tasks[i] = updated;
    }

    // ─── Create ───
    let showCreate = $state(false);
    let newTitle = $state("");
    let newDescription = $state("");
    let newProjectId = $state("");
    let newStatus = $state("TODO");
    let newAssignee = $state("");
    let creating = $state(false);

    async function handleCreate() {
        if (!newTitle.trim() || !newProjectId) return;
        creating = true;
        try {
            await createTask({
                title: newTitle.trim(),
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
            toastSuccess("Task created");
            loadTasks(true);
        } catch (e: any) {
            toastError(e.message || "Failed to create task");
        } finally {
            creating = false;
        }
    }

    // ─── Delete ───
    let pendingDelete = $state<Task | null>(null);
    let deleting = $state(false);

    async function confirmDelete() {
        if (!pendingDelete) return;
        deleting = true;
        try {
            await deleteTask(pendingDelete.id);
            pendingDelete = null;
            toastSuccess("Task deleted");
            loadTasks(true);
        } catch (e: any) {
            toastError(e.message || "Failed to delete task");
        } finally {
            deleting = false;
        }
    }

    // ─── Board drag and drop (keyboard and touch users change status in the side panel) ───
    let dragId = $state<string | null>(null);
    let dropTarget = $state<string | null>(null);

    function drop(status: TaskStatus) {
        const task = tasks.find((t) => t.id === dragId);
        dragId = null;
        dropTarget = null;
        if (task) setStatus(task, status);
    }

    const columns = $derived(TASK_STATUSES.map((s) => ({ ...s, tasks: tasks.filter((t) => t.status === s.value) })));

    const filters = [{ value: "", label: "All" }, ...TASK_STATUSES];
    const projectOptions = $derived(projects.map((p) => ({ value: p.id, label: p.name })));
    const assigneeOptions = $derived(users.map((u) => ({ value: u.id, label: u.email.split("@")[0] })));
    const userOptions = $derived(users.map((u) => ({ value: u.id, label: u.email })));
</script>

<svelte:head>
    <title>Tasks — TaskFlow</title>
</svelte:head>

<!-- grid-cols-1 is minmax(0,1fr): long titles truncate instead of widening the page -->
<div class="grid grid-cols-1 gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
            <h2 class="text-2xl font-semibold tracking-tight">Tasks</h2>
            <p class="text-sm text-muted-foreground">
                {meta.total} task{meta.total !== 1 ? "s" : ""}{query ? ` matching "${query}"` : ""}
                {#if view === "board" && meta.total > BOARD_LIMIT}
                    · showing the {BOARD_LIMIT} newest
                {/if}
            </p>
        </div>
        {#if canManage}
            <Button onclick={() => (showCreate = true)}>
                <Plus />
                New task
            </Button>
        {/if}
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="inline-flex w-fit rounded-lg bg-muted p-1" role="group" aria-label="View">
            {#each [{ value: "list", label: "List", icon: List }, { value: "board", label: "Board", icon: Columns3 }] as v (v.value)}
                <button
                    class={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors [&>svg]:size-4",
                        view === v.value
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={view === v.value}
                    onclick={() => setParams({ view: v.value === "list" ? null : v.value, page: null })}
                >
                    <v.icon />
                    {v.label}
                </button>
            {/each}
        </div>

        {#if view === "list"}
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
                        onclick={() => setParams({ status: f.value, page: null })}
                    >
                        {f.label}
                    </button>
                {/each}
            </div>
        {/if}

        <div class="relative w-full sm:ml-auto sm:max-w-xs">
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
                class="{fieldClass} pr-9 pl-9"
                type="search"
                placeholder="Search all tasks..."
                aria-label="Search tasks"
                bind:value={searchInput}
                oninput={onSearchInput}
            />
            {#if searchInput}
                <button
                    class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground"
                    onclick={clearSearch}
                    aria-label="Clear search"
                >
                    <X class="size-4" />
                </button>
            {/if}
        </div>
    </div>

    {#if loading}
        <SkeletonLoader variant="row" count={6} />
    {:else if loadError}
        <EmptyState
            icon={TriangleAlert}
            title="Couldn't load tasks"
            message={loadError}
            actionLabel="Try again"
            onaction={() => loadTasks()}
        />
    {:else if tasks.length === 0}
        <EmptyState
            icon={ListTodo}
            title={query ? "No matching tasks" : statusFilter ? "No tasks with this status" : "No tasks yet"}
            message={query
                ? `Nothing matches "${query}".`
                : statusFilter
                  ? "Try another filter to see more tasks."
                  : "Create your first task to get started."}
            actionLabel={!statusFilter && !query && canManage ? "Create task" : undefined}
            onaction={!statusFilter && !query && canManage ? () => (showCreate = true) : undefined}
        />
    {:else if view === "list"}
        <Card class="divide-y">
            {#each tasks as task (task.id)}
                <div class="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                    <div class="flex min-w-0 flex-1 items-center gap-3">
                        <button
                            class="flex w-[6.5rem] shrink-0 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default"
                            disabled={!canEditStatus(task)}
                            onclick={() => setStatus(task, nextStatus[task.status])}
                            title={canEditStatus(task) ? "Click to advance status" : undefined}
                            aria-label="Status: {statusMeta(task.status).label}{canEditStatus(task) ? '. Click to advance' : ''}"
                        >
                            <Badge variant={statusMeta(task.status).variant} class="transition-opacity hover:opacity-80">
                                {statusMeta(task.status).label}
                            </Badge>
                        </button>
                        <button
                            class="min-w-0 flex-1 truncate rounded-sm text-left text-sm font-medium hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                            title={task.description ?? undefined}
                            onclick={() => (openTask = task)}
                        >
                            {task.title}
                        </button>
                    </div>

                    <div class="flex items-center gap-2">
                        <a
                            href="/dashboard/projects/{task.project.id}"
                            class="inline-flex min-w-0 flex-1 items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:mr-2 sm:max-w-40 sm:flex-none"
                        >
                            <Folder class="size-3 shrink-0" />
                            <span class="truncate">{task.project.name}</span>
                        </a>
                        {#if canManage}
                            <Select
                                size="sm"
                                class="w-32 shrink-0"
                                aria-label="Assignee for {task.title}"
                                value={task.assignedTo || ""}
                                placeholder="Unassigned"
                                options={assigneeOptions}
                                onchange={(e) => reassign(task, (e.target as HTMLSelectElement).value)}
                            />
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                class="text-muted-foreground hover:text-destructive"
                                aria-label="Delete {task.title}"
                                onclick={() => (pendingDelete = task)}
                            >
                                <Trash2 />
                            </Button>
                        {:else if task.assignee}
                            <span class="flex items-center gap-2 text-sm text-muted-foreground">
                                <Avatar email={task.assignee.email} class="size-6 text-[10px]" />
                                {task.assignee.email.split("@")[0]}
                            </span>
                        {:else}
                            <span class="text-sm text-muted-foreground italic">Unassigned</span>
                        {/if}
                    </div>
                </div>
            {/each}
        </Card>

        {#if meta.totalPages > 1}
            <div class="flex items-center justify-between gap-4">
                <p class="text-sm text-muted-foreground">Page {currentPage} of {meta.totalPages}</p>
                <div class="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onclick={() => setParams({ page: currentPage - 1 > 1 ? currentPage - 1 : null })}
                    >
                        <ChevronLeft />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= meta.totalPages}
                        onclick={() => setParams({ page: currentPage + 1 })}
                    >
                        Next
                        <ChevronRight />
                    </Button>
                </div>
            </div>
        {/if}
    {:else}
        <div class="grid items-start gap-4 md:grid-cols-3">
            {#each columns as col (col.value)}
                <section
                    aria-label="{col.label} column"
                    class={cn(
                        "grid gap-2 rounded-xl border bg-muted/40 p-2 transition-colors",
                        dropTarget === col.value && "border-primary bg-primary/5",
                    )}
                    ondragover={(e) => {
                        if (!dragId) return;
                        e.preventDefault();
                        dropTarget = col.value;
                    }}
                    ondragleave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) dropTarget = null;
                    }}
                    ondrop={(e) => {
                        e.preventDefault();
                        drop(col.value);
                    }}
                >
                    <header class="flex items-center justify-between px-2 py-1">
                        <Badge variant={col.variant}>{col.label}</Badge>
                        <span class="text-xs text-muted-foreground tabular-nums">{col.tasks.length}</span>
                    </header>
                    {#each col.tasks as task (task.id)}
                        <div
                            role="group"
                            aria-label={task.title}
                            draggable={canEditStatus(task)}
                            ondragstart={(e) => {
                                dragId = task.id;
                                e.dataTransfer?.setData("text/plain", task.id);
                            }}
                            ondragend={() => {
                                dragId = null;
                                dropTarget = null;
                            }}
                            class={cn(
                                "relative grid gap-2 rounded-lg border bg-card p-3 shadow-xs transition-shadow hover:shadow-sm",
                                canEditStatus(task) && "cursor-grab active:cursor-grabbing",
                                dragId === task.id && "opacity-50",
                            )}
                        >
                            <button
                                class="text-left text-sm font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                                onclick={() => (openTask = task)}
                            >
                                {task.title}
                            </button>
                            <div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span class="inline-flex min-w-0 items-center gap-1">
                                    <Folder class="size-3 shrink-0" />
                                    <span class="truncate">{task.project.name}</span>
                                </span>
                                {#if task.assignee}
                                    <Avatar email={task.assignee.email} class="size-6 text-[10px]" />
                                {/if}
                            </div>
                        </div>
                    {:else}
                        <p class="px-2 py-6 text-center text-xs text-muted-foreground">
                            {dragId ? "Drop here" : "No tasks"}
                        </p>
                    {/each}
                </section>
            {/each}
        </div>
    {/if}
</div>

<TaskSheet
    task={openTask}
    {users}
    me={data.user}
    onclose={() => (openTask = null)}
    onsaved={onSheetSaved}
    ondelete={(t) => {
        openTask = null;
        pendingDelete = t;
    }}
/>

<Dialog open={showCreate} title="New task" onclose={() => (showCreate = false)}>
    <form
        onsubmit={(e) => {
            e.preventDefault();
            handleCreate();
        }}
        class="grid gap-4"
    >
        <Input label="Title" placeholder="e.g. Design landing page" bind:value={newTitle} required id="task-title" />
        <div class="grid gap-2">
            <label for="task-desc" class="text-sm leading-none font-medium">Description (optional)</label>
            <textarea
                id="task-desc"
                rows="3"
                class={cn(fieldClass, "h-auto resize-y py-2")}
                placeholder="Add details about this task..."
                bind:value={newDescription}
            ></textarea>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
            <Select label="Project" id="task-project" bind:value={newProjectId} options={projectOptions} />
            <Select label="Status" id="task-status" bind:value={newStatus} options={TASK_STATUSES} />
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
    open={!!pendingDelete}
    title="Delete task?"
    description={`"${pendingDelete?.title ?? ""}" will be removed. This can't be undone.`}
    onclose={() => (pendingDelete = null)}
>
    <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => (pendingDelete = null)}>Cancel</Button>
        <Button variant="destructive" loading={deleting} onclick={confirmDelete}>Delete task</Button>
    </div>
</Dialog>
