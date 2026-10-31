<script lang="ts">
    import { onMount } from "svelte";
    import { ArrowRight, Folder, FolderKanban, ListTodo, Users } from "@lucide/svelte";
    import { getOrganization, type Organization } from "$lib/api/organizations";
    import { getTasks, statusMeta, TASK_STATUSES, type Task } from "$lib/api/tasks";
    import { onAnyTaskChange } from "$lib/realtime/socket";
    import { toastError } from "$lib/stores/toast";
    import { formatRelativeTime } from "$lib/utils/format";
    import Avatar from "$lib/components/ui/Avatar.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import type { LayoutData } from "./$types";

    let { data }: { data: LayoutData } = $props();
    let org = $state<Organization | null>(null);
    let statusCounts = $state<number[]>([0, 0, 0]);
    let recent = $state<Task[]>([]);
    let loading = $state(true);

    async function load() {
        try {
            // limit=1 per status: only meta.total is needed, and /metrics is OWNER-only
            const [o, r, ...byStatus] = await Promise.all([
                getOrganization(),
                getTasks({ limit: "5" }),
                ...TASK_STATUSES.map((s) => getTasks({ limit: "1", status: s.value })),
            ]);
            org = o;
            recent = r.data;
            statusCounts = byStatus.map((res) => res.meta.total);
        } catch (e: any) {
            if (!org) toastError(e.message || "Failed to load dashboard"); // background refreshes fail quietly
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        load();
        return onAnyTaskChange(load, 1500); // 5 requests per refresh, so batch bursts of edits
    });

    const totalTasks = $derived(statusCounts.reduce((a, b) => a + b, 0));
    const donePct = $derived(totalTasks ? Math.round((statusCounts[2] / totalTasks) * 100) : 0);
    const barColors = ["bg-muted-foreground/40", "bg-warning", "bg-success"];

    const stats = $derived(
        org
            ? [
                  { icon: FolderKanban, value: org._count.projects, label: "Projects", href: "/dashboard/projects" },
                  { icon: ListTodo, value: org._count.tasks, label: "Tasks", href: "/dashboard/tasks" },
                  { icon: Users, value: org._count.users, label: "Members", href: "/dashboard/team" },
              ]
            : [],
    );
</script>

<svelte:head>
    <title>Dashboard — TaskFlow</title>
</svelte:head>

<div class="grid grid-cols-1 gap-6 sm:gap-8">
    <div>
        <h2 class="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p class="text-muted-foreground">
            Here's what's happening in <span class="font-medium text-foreground">{data.user.organizationName}</span>
        </p>
    </div>

    {#if loading}
        <SkeletonLoader variant="stat" count={3} />
    {:else if org}
        <div class="grid grid-cols-3 gap-3 sm:gap-4">
            {#each stats as stat (stat.label)}
                <a href={stat.href} class="group rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                    <Card class="p-3 transition-colors group-hover:bg-accent/50 sm:p-5">
                        <div class="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                            {stat.label}
                            <stat.icon class="hidden size-4 sm:block" />
                        </div>
                        <p class="mt-1 text-2xl font-semibold tabular-nums sm:mt-2 sm:text-3xl">{stat.value}</p>
                    </Card>
                </a>
            {/each}
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card class="grid content-start gap-4 p-5 lg:col-span-2">
                <div class="flex items-baseline justify-between">
                    <h3 class="font-medium">Progress</h3>
                    <span class="text-sm text-muted-foreground"><span class="font-semibold text-foreground tabular-nums">{donePct}%</span> done</span>
                </div>
                <div
                    class="flex h-2.5 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={TASK_STATUSES.map((s, i) => `${statusCounts[i]} ${s.label.toLowerCase()}`).join(", ")}
                >
                    {#each TASK_STATUSES as s, i (s.value)}
                        {#if statusCounts[i]}
                            <div class={barColors[i]} style:width="{(statusCounts[i] / totalTasks) * 100}%"></div>
                        {/if}
                    {/each}
                </div>
                <ul class="grid gap-2">
                    {#each TASK_STATUSES as s, i (s.value)}
                        <li>
                            <a
                                href="/dashboard/tasks?status={s.value}"
                                class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                            >
                                <Badge variant={s.variant}>{s.label}</Badge>
                                <span class="tabular-nums">{statusCounts[i]}</span>
                            </a>
                        </li>
                    {/each}
                </ul>
            </Card>

            <Card class="lg:col-span-3">
                <div class="flex items-center justify-between border-b px-5 py-3.5">
                    <h3 class="font-medium">Recent tasks</h3>
                    <a href="/dashboard/tasks" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        View all
                        <ArrowRight class="size-3.5" />
                    </a>
                </div>
                {#if recent.length === 0}
                    <p class="px-5 py-8 text-center text-sm text-muted-foreground">No tasks yet.</p>
                {:else}
                    <ul class="divide-y">
                        {#each recent as task (task.id)}
                            <li class="flex items-center gap-3 px-5 py-2.5">
                                <span class="w-[6.5rem] shrink-0">
                                    <Badge variant={statusMeta(task.status).variant}>{statusMeta(task.status).label}</Badge>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-medium">{task.title}</p>
                                    <p class="truncate text-xs text-muted-foreground">
                                        <Folder class="inline size-3 align-[-2px]" />
                                        {task.project.name} · {formatRelativeTime(task.createdAt)}
                                    </p>
                                </div>
                                {#if task.assignee}
                                    <Avatar email={task.assignee.email} class="size-6 text-[10px]" />
                                {/if}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </Card>
        </div>
    {/if}
</div>
