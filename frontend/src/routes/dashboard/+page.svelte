<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
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
                  {
                      icon: "📁",
                      value: org._count.projects,
                      label: "Projects",
                      href: "/dashboard/projects",
                      color: "#6c63ff",
                  },
                  {
                      icon: "✅",
                      value: org._count.tasks,
                      label: "Tasks",
                      href: "/dashboard/tasks",
                      color: "#2dd4bf",
                  },
                  {
                      icon: "👥",
                      value: org._count.users,
                      label: "Members",
                      href: null,
                      color: "#fbbf24",
                  },
              ]
            : [],
    );
</script>

<svelte:head>
    <title>Dashboard — TaskFlow</title>
</svelte:head>

<div class="overview fade-in">
    <div class="welcome-section">
        <h1>Welcome back 👋</h1>
        <p class="welcome-sub">
            Here's what's happening in <strong
                >{data.user.organizationName}</strong
            >
        </p>
    </div>

    {#if loading}
        <SkeletonLoader variant="stat" count={3} />
    {:else if org}
        <div class="stats-row">
            {#each stats as stat, i}
                <a
                    href={stat.href ?? "#"}
                    class="stat-link"
                    style="animation-delay: {i * 0.08}s"
                >
                    <Card hover={!!stat.href}>
                        <div class="stat-inner">
                            <div
                                class="stat-icon-wrap"
                                style="--stat-color: {stat.color}"
                            >
                                <span class="stat-emoji">{stat.icon}</span>
                            </div>
                            <div class="stat-data">
                                <span class="stat-value">{stat.value}</span>
                                <span class="stat-label">{stat.label}</span>
                            </div>
                        </div>
                    </Card>
                </a>
            {/each}
        </div>

        <div class="section">
            <h2>Quick Actions</h2>
            <div class="actions-grid">
                <Card hover onclick={() => goto("/dashboard/projects")}>
                    <div class="action-card">
                        <div class="action-icon">📁</div>
                        <div>
                            <strong>View Projects</strong>
                            <p>Manage your team's projects</p>
                        </div>
                        <span class="action-arrow">→</span>
                    </div>
                </Card>
                <Card hover onclick={() => goto("/dashboard/tasks")}>
                    <div class="action-card">
                        <div class="action-icon">✅</div>
                        <div>
                            <strong>View Tasks</strong>
                            <p>Track and assign work items</p>
                        </div>
                        <span class="action-arrow">→</span>
                    </div>
                </Card>
            </div>
        </div>
    {/if}
</div>

<style>
    .overview h1 {
        font-size: 1.5rem;
        font-weight: 700;
    }
    .welcome-section {
        margin-bottom: 2rem;
    }
    .welcome-sub {
        color: var(--text-secondary);
        margin-top: 0.35rem;
        font-size: 0.95rem;
    }
    .welcome-sub strong {
        color: var(--text-primary);
    }

    .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2.5rem;
    }
    .stat-link {
        text-decoration: none;
        color: inherit;
        animation: fadeIn 0.35s ease-out both;
    }
    .stat-inner {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .stat-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--stat-color) 12%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .stat-emoji {
        font-size: 1.25rem;
    }
    .stat-data {
        display: flex;
        flex-direction: column;
    }
    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
    }
    .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }

    .section h2 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--text-secondary);
    }
    .actions-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
    .action-card {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .action-icon {
        font-size: 1.5rem;
    }
    .action-card strong {
        font-size: 0.9rem;
        display: block;
        margin-bottom: 0.15rem;
    }
    .action-card p {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin: 0;
    }
    .action-arrow {
        margin-left: auto;
        color: var(--text-muted);
        font-size: 1.2rem;
        transition: transform var(--transition);
    }
    :global(.action-card:hover .action-arrow) {
        transform: translateX(3px);
    }
</style>
