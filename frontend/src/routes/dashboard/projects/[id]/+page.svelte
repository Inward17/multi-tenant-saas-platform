<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import {
        getProject,
        deleteProject,
        type ProjectDetail,
    } from "$lib/api/projects";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import type { LayoutData } from "../../$types";

    let { data }: { data: LayoutData } = $props();
    let project = $state<ProjectDetail | null>(null);
    let loading = $state(true);
    let showDeleteConfirm = $state(false);
    let deleting = $state(false);

    onMount(() => {
        const id = $page.params.id;
        if (id) {
            getProject(id)
                .then((p) => {
                    project = p;
                })
                .catch((e: any) => {
                    toastError(e.message || "Failed to load project");
                })
                .finally(() => {
                    loading = false;
                });
        }
    });

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

    function statusVariant(status: string): "todo" | "in-progress" | "done" {
        return status.toLowerCase().replace("_", "-") as any;
    }
    function formatStatus(s: string) {
        return s.replace("_", " ");
    }
    function getInitial(email: string) {
        return email[0].toUpperCase();
    }

    const canDelete = $derived(data.user.role === "OWNER");
</script>

<svelte:head>
    <title>{project?.name ?? "Project"} — TaskFlow</title>
</svelte:head>

{#if loading}
    <SkeletonLoader variant="row" count={4} />
{:else if project}
    <div class="project-detail fade-in">
        <div class="page-header">
            <div>
                <nav class="breadcrumb" aria-label="Breadcrumb">
                    <a href="/dashboard/projects" class="breadcrumb-link"
                        >Projects</a
                    >
                    <span class="breadcrumb-sep">/</span>
                    <span class="breadcrumb-current">{project.name}</span>
                </nav>
                <div class="title-row">
                    <div class="project-icon-lg">📁</div>
                    <div>
                        <h1>{project.name}</h1>
                        <p class="subtitle">
                            {project.tasks.length} task{project.tasks.length !==
                            1
                                ? "s"
                                : ""}
                        </p>
                    </div>
                </div>
            </div>
            {#if canDelete}
                <Button
                    variant="danger"
                    onclick={() => (showDeleteConfirm = true)}
                    >Delete Project</Button
                >
            {/if}
        </div>

        {#if project.tasks.length === 0}
            <Card>
                <EmptyState
                    icon="✅"
                    title="No tasks in this project"
                    message="Create tasks from the Tasks page and assign them to this project"
                    actionLabel="Go to Tasks"
                    onaction={() => goto("/dashboard/tasks")}
                />
            </Card>
        {:else}
            <div class="tasks-list">
                {#each project.tasks as task, i (task.id)}
                    <div
                        class="stagger-in"
                        style="animation-delay: {i * 0.04}s"
                    >
                        <Card>
                            <div class="task-row">
                                <Badge
                                    variant={statusVariant(task.status)}
                                    size="md">{formatStatus(task.status)}</Badge
                                >
                                <span class="task-title">{task.title}</span>
                                <div class="task-end">
                                    {#if task.assignee}
                                        <div class="assignee-chip">
                                            <span class="assignee-avatar"
                                                >{getInitial(
                                                    task.assignee.email,
                                                )}</span
                                            >
                                            <span class="assignee-name"
                                                >{task.assignee.email.split(
                                                    "@",
                                                )[0]}</span
                                            >
                                        </div>
                                    {:else}
                                        <span class="unassigned"
                                            >Unassigned</span
                                        >
                                    {/if}
                                </div>
                            </div>
                        </Card>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<Modal
    open={showDeleteConfirm}
    title="Delete Project"
    onclose={() => (showDeleteConfirm = false)}
>
    <div class="delete-confirm">
        <p>
            This will permanently delete <strong>{project?.name}</strong> and all
            its tasks. This action cannot be undone.
        </p>
        <div class="modal-actions">
            <Button
                variant="secondary"
                onclick={() => (showDeleteConfirm = false)}>Cancel</Button
            >
            <Button variant="danger" loading={deleting} onclick={handleDelete}
                >Delete Project</Button
            >
        </div>
    </div>
</Modal>

<style>
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
    }
    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
    }
    .breadcrumb-link {
        color: var(--text-muted);
        transition: color var(--transition);
    }
    .breadcrumb-link:hover {
        color: var(--accent);
    }
    .breadcrumb-sep {
        color: var(--text-muted);
        opacity: 0.5;
    }
    .breadcrumb-current {
        color: var(--text-primary);
        font-weight: 600;
    }
    .title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .project-icon-lg {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(108, 99, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;
    }
    h1 {
        font-size: 1.5rem;
        font-weight: 700;
    }
    .subtitle {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-top: 0.1rem;
    }

    .tasks-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .task-row {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .task-title {
        flex: 1;
        font-weight: 500;
        font-size: 0.9rem;
    }
    .task-end {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .assignee-chip {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.2rem 0.5rem 0.2rem 0.2rem;
        border-radius: 100px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border);
    }
    .assignee-avatar {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6c63ff, #2dd4bf);
        color: white;
        font-size: 0.65rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .assignee-name {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    .unassigned {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-style: italic;
    }
    .delete-confirm p {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }
    .delete-confirm strong {
        color: var(--text-primary);
    }
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
</style>
