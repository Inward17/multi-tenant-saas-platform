<script lang="ts">
    import { onMount } from "svelte";
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
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import type { LayoutData } from "../$types";

    let { data }: { data: LayoutData } = $props();
    let tasks = $state<Task[]>([]);
    let meta = $state({ total: 0, page: 1, limit: 10, totalPages: 1 });
    let currentPage = $state(1);
    let projects = $state<Project[]>([]);
    let users = $state<OrgUser[]>([]);
    let loading = $state(true);
    let statusFilter = $state("");
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
            toastSuccess(`Status → ${next.replace("_", " ")}`);
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
                assignedTo: userId || undefined,
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
        return s.replace("_", " ");
    }

    function getInitial(email: string) {
        return email[0].toUpperCase();
    }

    const canCreate = $derived(
        data.user.role === "OWNER" || data.user.role === "ADMIN",
    );
    const canDelete = $derived(
        data.user.role === "OWNER" || data.user.role === "ADMIN",
    );

    const filters = [
        { value: "", label: "All" },
        { value: "TODO", label: "To Do" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "DONE", label: "Done" },
    ];
</script>

<svelte:head>
    <title>Tasks — TaskFlow</title>
</svelte:head>

<div class="tasks-page fade-in">
    <div class="page-header">
        <div>
            <h1>Tasks</h1>
            <p class="subtitle">
                {meta.total} total task{meta.total !== 1 ? "s" : ""}
            </p>
        </div>
        {#if canCreate}
            <Button variant="primary" onclick={() => (showCreate = true)}>
                + New Task
            </Button>
        {/if}
    </div>

    <!-- Filters -->
    <div class="filters">
        {#each filters as f}
            <button
                class="filter-pill"
                class:active={statusFilter === f.value}
                onclick={() => filterByStatus(f.value)}
            >
                {#if f.value}
                    <span
                        class="filter-dot"
                        class:dot-todo={f.value === "TODO"}
                        class:dot-progress={f.value === "IN_PROGRESS"}
                        class:dot-done={f.value === "DONE"}
                    ></span>
                {/if}
                {f.label}
            </button>
        {/each}
    </div>

    {#if loading}
        <SkeletonLoader variant="row" count={5} />
    {:else if tasks.length === 0}
        <Card>
            <EmptyState
                icon="✅"
                title={statusFilter
                    ? "No tasks matching filter"
                    : "No tasks yet"}
                message={statusFilter
                    ? "Try removing the filter to see all tasks"
                    : "Create your first task to get started"}
                actionLabel={!statusFilter && canCreate
                    ? "Create Task"
                    : undefined}
                onaction={!statusFilter && canCreate
                    ? () => (showCreate = true)
                    : undefined}
            />
        </Card>
    {:else}
        <div class="tasks-list">
            {#each tasks as task, i (task.id)}
                <div
                    class="task-row stagger-in"
                    style="animation-delay: {i * 0.04}s"
                >
                    <Card>
                        <div class="task-inner">
                            <button
                                class="status-btn"
                                onclick={() => cycleStatus(task)}
                                title="Click to cycle status"
                            >
                                <Badge
                                    variant={statusVariant(task.status)}
                                    size="md">{formatStatus(task.status)}</Badge
                                >
                            </button>

                            <div class="task-body">
                                <h3 class="task-title">{task.title}</h3>
                                {#if task.description}
                                    <p class="task-desc">{task.description}</p>
                                {/if}
                                <div class="task-meta">
                                    <span class="meta-chip">
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            ><path
                                                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                                            /></svg
                                        >
                                        {task.project.name}
                                    </span>
                                </div>
                            </div>

                            <div class="task-end">
                                <div class="assignee-select-wrap">
                                    <select
                                        class="assignee-select"
                                        value={task.assignedTo || ""}
                                        onchange={(e) =>
                                            reassignTask(
                                                task,
                                                (e.target as HTMLSelectElement)
                                                    .value,
                                            )}
                                    >
                                        <option value="">Unassigned</option>
                                        {#each users as u}
                                            <option value={u.id}
                                                >{u.email.split("@")[0]}</option
                                            >
                                        {/each}
                                    </select>
                                    {#if task.assignee}
                                        <span class="assignee-avatar-sm"
                                            >{getInitial(
                                                task.assignee.email,
                                            )}</span
                                        >
                                    {/if}
                                </div>
                                {#if canDelete}
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onclick={() =>
                                            (showDeleteConfirm = task.id)}
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            ><path d="M3 6h18" /><path
                                                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                                            /><path
                                                d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                            /></svg
                                        >
                                    </Button>
                                {/if}
                            </div>
                        </div>
                    </Card>
                </div>
            {/each}
        </div>

        {#if meta.totalPages > 1}
            <div class="pagination">
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onclick={() => goToPage(currentPage - 1)}
                >
                    ← Previous
                </Button>
                <div class="page-dots">
                    {#each Array(meta.totalPages) as _, i}
                        <button
                            class="page-dot"
                            class:current={currentPage === i + 1}
                            onclick={() => goToPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    {/each}
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= meta.totalPages}
                    onclick={() => goToPage(currentPage + 1)}
                >
                    Next →
                </Button>
            </div>
        {/if}
    {/if}
</div>

<!-- Create Task Modal -->
<Modal
    open={showCreate}
    title="Create New Task"
    onclose={() => (showCreate = false)}
>
    <form
        onsubmit={(e) => {
            e.preventDefault();
            handleCreate();
        }}
        class="modal-form"
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
        <div class="form-row">
            <div class="select-group">
                <label for="task-project">Project</label>
                <select id="task-project" bind:value={newProjectId}>
                    {#each projects as p}
                        <option value={p.id}>{p.name}</option>
                    {/each}
                </select>
            </div>
            <div class="select-group">
                <label for="task-status">Status</label>
                <select id="task-status" bind:value={newStatus}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                </select>
            </div>
        </div>
        <div class="select-group">
            <label for="task-assignee">Assign To (optional)</label>
            <select id="task-assignee" bind:value={newAssignee}>
                <option value="">Unassigned</option>
                {#each users as u}
                    <option value={u.id}>{u.email}</option>
                {/each}
            </select>
        </div>
        <div class="modal-actions">
            <Button variant="secondary" onclick={() => (showCreate = false)}
                >Cancel</Button
            >
            <Button variant="primary" type="submit" loading={creating}
                >Create Task</Button
            >
        </div>
    </form>
</Modal>

<!-- Delete Confirmation -->
<Modal
    open={!!showDeleteConfirm}
    title="Delete Task"
    onclose={() => (showDeleteConfirm = null)}
>
    <div class="delete-confirm">
        <p>
            Are you sure you want to delete this task? This action cannot be
            undone.
        </p>
        <div class="modal-actions">
            <Button
                variant="secondary"
                onclick={() => (showDeleteConfirm = null)}>Cancel</Button
            >
            <Button variant="danger" loading={deleting} onclick={confirmDelete}
                >Delete Task</Button
            >
        </div>
    </div>
</Modal>

<style>
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.25rem;
    }
    .page-header h1 {
        font-size: 1.5rem;
        font-weight: 700;
    }
    .subtitle {
        color: var(--text-secondary);
        margin-top: 0.2rem;
        font-size: 0.875rem;
    }

    /* Filters */
    .filters {
        display: flex;
        gap: 0.375rem;
        margin-bottom: 1.5rem;
    }
    .filter-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text-secondary);
        padding: 0.4rem 0.9rem;
        border-radius: 100px;
        font-size: 0.8rem;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        transition: all var(--transition);
    }
    .filter-pill:hover {
        border-color: var(--accent);
        color: var(--text-primary);
    }
    .filter-pill.active {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
    }
    .filter-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
    }
    .dot-todo {
        background: #94a3b8;
    }
    .dot-progress {
        background: #fbbf24;
    }
    .dot-done {
        background: #2dd4bf;
    }
    .filter-pill.active .filter-dot {
        background: white;
    }

    /* Task List */
    .tasks-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .task-inner {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .status-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: transform var(--transition);
        flex-shrink: 0;
    }
    .status-btn:hover {
        transform: scale(1.08);
    }
    .status-btn:active {
        transform: scale(0.95);
    }

    .task-body {
        flex: 1;
        min-width: 0;
    }
    .task-title {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.15rem;
    }
    .task-desc {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: 0.4rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 400px;
    }
    .task-meta {
        display: flex;
        gap: 0.5rem;
    }
    .meta-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.7rem;
        color: var(--text-muted);
    }

    .task-end {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
    }
    .assignee-select-wrap {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        position: relative;
    }
    .assignee-select {
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text-secondary);
        font-family: inherit;
        font-size: 0.75rem;
        padding: 0.3rem 0.5rem;
        cursor: pointer;
        transition: all var(--transition);
        min-width: 110px;
    }
    .assignee-select:hover {
        border-color: var(--accent);
        color: var(--text-primary);
    }
    .assignee-select:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.15);
    }
    .assignee-avatar-sm {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6c63ff, #2dd4bf);
        color: white;
        font-size: 0.6rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    /* Pagination */
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.75rem;
        margin-top: 2rem;
    }
    .page-dots {
        display: flex;
        gap: 0.25rem;
    }
    .page-dot {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-family: inherit;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition);
    }
    .page-dot:hover {
        border-color: var(--accent);
        color: var(--accent);
    }
    .page-dot.current {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
    }

    /* Modal form */
    .modal-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .form-row {
        display: flex;
        gap: 0.75rem;
    }
    .select-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }
    .select-group label {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--text-secondary);
    }
    .select-group select {
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.875rem;
        width: 100%;
        transition: border-color var(--transition);
    }
    .select-group select:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.15);
    }
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }
    .delete-confirm p {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }
</style>
