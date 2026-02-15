<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import {
        getProjects,
        createProject,
        deleteProject,
        type Project,
    } from "$lib/api/projects";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import type { LayoutData } from "../$types";

    let { data }: { data: LayoutData } = $props();
    let projects = $state<Project[]>([]);
    let loading = $state(true);
    let showCreate = $state(false);
    let showDeleteConfirm = $state<string | null>(null);
    let newName = $state("");
    let creating = $state(false);
    let deleting = $state(false);

    onMount(() => {
        loadProjects();
    });

    async function loadProjects() {
        loading = true;
        try {
            projects = await getProjects();
        } catch (e: any) {
            toastError(e.message || "Failed to load projects");
        } finally {
            loading = false;
        }
    }

    async function handleCreate() {
        if (!newName.trim()) return;
        creating = true;
        try {
            await createProject({ name: newName });
            newName = "";
            showCreate = false;
            toastSuccess("Project created successfully");
            loadProjects();
        } catch (e: any) {
            toastError(e.message || "Failed to create project");
        } finally {
            creating = false;
        }
    }

    async function confirmDelete() {
        if (!showDeleteConfirm) return;
        deleting = true;
        try {
            await deleteProject(showDeleteConfirm);
            showDeleteConfirm = null;
            toastSuccess("Project deleted");
            loadProjects();
        } catch (e: any) {
            toastError(e.message || "Failed to delete project");
        } finally {
            deleting = false;
        }
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    const canCreate = $derived(
        data.user.role === "OWNER" || data.user.role === "ADMIN",
    );
    const canDelete = $derived(data.user.role === "OWNER");
</script>

<svelte:head>
    <title>Projects — TaskFlow</title>
</svelte:head>

<div class="projects-page fade-in">
    <div class="page-header">
        <div>
            <h1>Projects</h1>
            <p class="subtitle">
                {projects.length} project{projects.length !== 1 ? "s" : ""} in your
                workspace
            </p>
        </div>
        {#if canCreate}
            <Button variant="primary" onclick={() => (showCreate = true)}>
                + New Project
            </Button>
        {/if}
    </div>

    {#if loading}
        <SkeletonLoader variant="card" count={4} />
    {:else if projects.length === 0}
        <Card>
            <EmptyState
                icon="📁"
                title="No projects yet"
                message="Create your first project to start organizing tasks"
                actionLabel={canCreate ? "Create Project" : undefined}
                onaction={canCreate ? () => (showCreate = true) : undefined}
            />
        </Card>
    {:else}
        <div class="projects-grid">
            {#each projects as project, i (project.id)}
                <div style="animation-delay: {i * 0.05}s" class="stagger-in">
                    <Card
                        hover
                        onclick={() =>
                            goto(`/dashboard/projects/${project.id}`)}
                    >
                        <div class="project-inner">
                            <div class="project-header">
                                <div class="project-icon">📁</div>
                                <h3>{project.name}</h3>
                            </div>
                            <div class="project-stats">
                                <span class="task-chip">
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        ><path d="M9 11l3 3L22 4" /><path
                                            d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                                        /></svg
                                    >
                                    {project._count.tasks} task{project._count
                                        .tasks !== 1
                                        ? "s"
                                        : ""}
                                </span>
                                <span class="date-chip">
                                    {formatDate(project.createdAt)}
                                </span>
                            </div>
                            <div class="project-footer">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        goto(
                                            `/dashboard/projects/${project.id}`,
                                        );
                                    }}
                                >
                                    View Details →
                                </Button>
                                {#if canDelete}
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            showDeleteConfirm = project.id;
                                        }}
                                    >
                                        Delete
                                    </Button>
                                {/if}
                            </div>
                        </div>
                    </Card>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Create Modal -->
<Modal
    open={showCreate}
    title="Create New Project"
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
            label="Project Name"
            placeholder="e.g. Marketing Website"
            bind:value={newName}
            required
            id="project-name"
        />
        <div class="modal-actions">
            <Button variant="secondary" onclick={() => (showCreate = false)}
                >Cancel</Button
            >
            <Button variant="primary" type="submit" loading={creating}
                >Create Project</Button
            >
        </div>
    </form>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal
    open={!!showDeleteConfirm}
    title="Delete Project"
    onclose={() => (showDeleteConfirm = null)}
>
    <div class="delete-confirm">
        <p>
            This will permanently delete this project and all its tasks. This
            action cannot be undone.
        </p>
        <div class="modal-actions">
            <Button
                variant="secondary"
                onclick={() => (showDeleteConfirm = null)}>Cancel</Button
            >
            <Button variant="danger" loading={deleting} onclick={confirmDelete}
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
    .page-header h1 {
        font-size: 1.5rem;
        font-weight: 700;
    }
    .subtitle {
        color: var(--text-secondary);
        margin-top: 0.2rem;
        font-size: 0.875rem;
    }

    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }
    .project-inner {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .project-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .project-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(108, 99, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
    }
    .project-header h3 {
        font-size: 1rem;
        font-weight: 600;
    }
    .project-stats {
        display: flex;
        gap: 0.75rem;
    }
    .task-chip,
    .date-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.03);
        padding: 0.25rem 0.6rem;
        border-radius: 100px;
        border: 1px solid var(--border);
    }
    .project-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.25rem;
    }

    .modal-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
    .delete-confirm p {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }
</style>
