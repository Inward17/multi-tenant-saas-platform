<script lang="ts">
    import { onMount } from "svelte";
    import { ArrowRight, FolderKanban, ListTodo, Users } from "@lucide/svelte";
    import { getOrganization, type Organization } from "$lib/api/organizations";
    import Card from "$lib/components/ui/Card.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import type { LayoutData } from "./$types";

    let { data }: { data: LayoutData } = $props();
    let org = $state<Organization | null>(null);
    let loading = $state(true);

    onMount(async () => {
        try {
            org = await getOrganization();
        } finally {
            loading = false;
        }
    });

    const stats = $derived(
        org
            ? [
                  { icon: FolderKanban, value: org._count.projects, label: "Projects", href: "/dashboard/projects" },
                  { icon: ListTodo, value: org._count.tasks, label: "Tasks", href: "/dashboard/tasks" },
                  { icon: Users, value: org._count.users, label: "Members", href: "/dashboard/team" },
              ]
            : [],
    );

    const actions = [
        { icon: FolderKanban, title: "View projects", desc: "Manage your team's projects", href: "/dashboard/projects" },
        { icon: ListTodo, title: "View tasks", desc: "Track and assign work items", href: "/dashboard/tasks" },
    ];
</script>

<svelte:head>
    <title>Dashboard — TaskFlow</title>
</svelte:head>

<div class="grid gap-8">
    <div>
        <h2 class="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p class="text-muted-foreground">
            Here's what's happening in <span class="font-medium text-foreground">{data.user.organizationName}</span>
        </p>
    </div>

    {#if loading}
        <SkeletonLoader variant="stat" count={3} />
    {:else if org}
        <div class="grid gap-4 sm:grid-cols-3">
            {#each stats as stat (stat.label)}
                <a href={stat.href} class="group rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                    <Card class="p-5 transition-colors group-hover:bg-accent/50">
                        <div class="flex items-center justify-between text-sm text-muted-foreground">
                            {stat.label}
                            <stat.icon class="size-4" />
                        </div>
                        <p class="mt-2 text-3xl font-semibold tabular-nums">{stat.value}</p>
                    </Card>
                </a>
            {/each}
        </div>

        <section class="grid gap-3">
            <h3 class="text-sm font-medium text-muted-foreground">Quick actions</h3>
            <div class="grid gap-4 sm:grid-cols-2">
                {#each actions as action (action.href)}
                    <a href={action.href} class="group rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                        <Card class="flex items-center gap-4 p-5 transition-colors group-hover:bg-accent/50">
                            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <action.icon class="size-5" />
                            </div>
                            <div class="flex-1">
                                <p class="font-medium">{action.title}</p>
                                <p class="text-sm text-muted-foreground">{action.desc}</p>
                            </div>
                            <ArrowRight class="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Card>
                    </a>
                {/each}
            </div>
        </section>
    {/if}
</div>
