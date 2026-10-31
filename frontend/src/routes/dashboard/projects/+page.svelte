<script lang="ts">
    import { onMount } from "svelte";
    import { Folder, ListTodo, Plus, Search, Trash2, X } from "@lucide/svelte";
    import {
        getProjects,
        createProject,
        deleteProject,
        type Project,
    } from "$lib/api/projects";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import { formatDate } from "$lib/utils/format";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import { fieldClass } from "$lib/components/ui/Input.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import type { LayoutData } from "../$types";

    let { data }: { data: LayoutData } = $props();
    let projects = $state<Project[]>([]);
    let loading = $state(true);
    let searchQuery = $state("");
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

    const canCreate = $derived(
        data.user.role === "OWNER" || data.user.role === "ADMIN",
    );
    const canDelete = $derived(data.user.role === "OWNER");

    const filteredProjects = $derived(
        searchQuery.trim()
            ? projects.filter((p) =>
                  p.name
                      .toLowerCase()
                      .includes(searchQuery.trim().toLowerCase()),
              )
            : projects,
    );
</script>

<svelte:head>
    <title>Projects — TaskFlow</title>
</svelte:head>

<div class="grid gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
            <h2 class="text-2xl font-semibold tracking-tight">Projects</h2>
            <p class="text-sm text-muted-foreground">
                {projects.length} project{projects.length !== 1 ? "s" : ""} in your workspace
            </p>
        </div>
        {#if canCreate}
            <Button onclick={() => (showCreate = true)}>
                <Plus />
                New project
            </Button>
        {/if}
    </div>

    <div class="relative max-w-sm">
        <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
            class="{fieldClass} pr-9 pl-9"
            type="text"
            placeholder="Search projects..."
            aria-label="Search projects"
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

    {#if loading}
        <SkeletonLoader variant="card" count={3} />
    {:else if filteredProjects.length === 0}
        <EmptyState
            icon={Folder}
            title={searchQuery ? "No matching projects" : "No projects yet"}
            message={searchQuery
                ? `No results for "${searchQuery}"`
                : "Create your first project to start organizing tasks."}
            actionLabel={!searchQuery && canCreate ? "Create project" : undefined}
            onaction={!searchQuery && canCreate ? () => (showCreate = true) : undefined}
        />
    {:else}
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {#each filteredProjects as project (project.id)}
                <Card class="group relative flex flex-col gap-4 p-5 transition-colors hover:bg-accent/50">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Folder class="size-5" />
                        </div>
                        {#if canDelete}
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                class="relative z-10 text-muted-foreground hover:text-destructive"
                                aria-label="Delete {project.name}"
                                onclick={() => (showDeleteConfirm = project.id)}
                            >
                                <Trash2 />
                            </Button>
                        {/if}
                    </div>
                    <div>
                        <!-- Stretched link makes the whole card clickable while keeping real link semantics -->
                        <a
                            href="/dashboard/projects/{project.id}"
                            class="font-semibold after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                        >
                            {project.name}
                        </a>
                        <p class="mt-1 text-xs text-muted-foreground">Created {formatDate(project.createdAt)}</p>
                    </div>
                    <div class="mt-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ListTodo class="size-4" />
                        {project._count.tasks} task{project._count.tasks !== 1 ? "s" : ""}
                    </div>
                </Card>
            {/each}
        </div>
    {/if}
</div>

<Dialog
    open={showCreate}
    title="New project"
    description="Projects group related tasks together."
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
            label="Project name"
            placeholder="e.g. Marketing website"
            bind:value={newName}
            required
            id="project-name"
        />
        <div class="flex justify-end gap-2">
            <Button variant="outline" onclick={() => (showCreate = false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create project</Button>
        </div>
    </form>
</Dialog>

<Dialog
    open={!!showDeleteConfirm}
    title="Delete project?"
    description="This deletes the project and all of its tasks. This can't be undone."
    onclose={() => (showDeleteConfirm = null)}
>
    <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => (showDeleteConfirm = null)}>Cancel</Button>
        <Button variant="destructive" loading={deleting} onclick={confirmDelete}>Delete project</Button>
    </div>
</Dialog>
