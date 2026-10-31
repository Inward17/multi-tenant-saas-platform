<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { ChevronRight, Folder, ListTodo, Trash2 } from "@lucide/svelte";
    import {
        getProject,
        deleteProject,
        type ProjectDetail,
    } from "$lib/api/projects";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import Avatar from "$lib/components/ui/Avatar.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
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
        return s.replace("_", " ").toLowerCase();
    }

    const canDelete = $derived(data.user.role === "OWNER");
</script>

<svelte:head>
    <title>{project?.name ?? "Project"} — TaskFlow</title>
</svelte:head>

{#if loading}
    <SkeletonLoader variant="row" count={4} />
{:else if project}
    <div class="grid gap-6">
        <div class="grid gap-3">
            <nav class="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
                <a href="/dashboard/projects" class="hover:text-foreground">Projects</a>
                <ChevronRight class="size-3.5" />
                <span class="truncate text-foreground" aria-current="page">{project.name}</span>
            </nav>
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Folder class="size-5" />
                    </div>
                    <div>
                        <h2 class="text-2xl font-semibold tracking-tight">{project.name}</h2>
                        <p class="text-sm text-muted-foreground">
                            {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                {#if canDelete}
                    <Button variant="outline" class="text-destructive hover:text-destructive" onclick={() => (showDeleteConfirm = true)}>
                        <Trash2 />
                        Delete project
                    </Button>
                {/if}
            </div>
        </div>

        {#if project.tasks.length === 0}
            <EmptyState
                icon={ListTodo}
                title="No tasks in this project"
                message="Create tasks from the Tasks page and assign them to this project."
                actionLabel="Go to tasks"
                onaction={() => goto("/dashboard/tasks")}
            />
        {:else}
            <Card class="divide-y">
                {#each project.tasks as task (task.id)}
                    <div class="flex items-center gap-4 px-5 py-3.5">
                        <Badge variant={statusVariant(task.status)} class="w-24 justify-start">
                            {formatStatus(task.status)}
                        </Badge>
                        <span class="flex-1 truncate font-medium">{task.title}</span>
                        {#if task.assignee}
                            <div class="flex items-center gap-2 text-sm text-muted-foreground">
                                <Avatar email={task.assignee.email} class="size-6 text-[10px]" />
                                <span class="hidden sm:inline">{task.assignee.email.split("@")[0]}</span>
                            </div>
                        {:else}
                            <span class="text-sm text-muted-foreground italic">Unassigned</span>
                        {/if}
                    </div>
                {/each}
            </Card>
        {/if}
    </div>
{/if}

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
