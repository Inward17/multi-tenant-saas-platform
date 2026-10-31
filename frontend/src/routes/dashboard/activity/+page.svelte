<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { getAuditLogs, type AuditEntry } from "$lib/api/activity";
    import { onActivity } from "$lib/realtime/socket";
    import {
        Activity,
        CirclePlus,
        FolderPlus,
        KeyRound,
        Lock,
        RefreshCw,
        Trash2,
        UserPlus,
        UserRoundCheck,
    } from "@lucide/svelte";
    import { formatRelativeTime } from "$lib/utils/format";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";
    import { cn } from "$lib/utils";

    let entries = $state<AuditEntry[]>([]);
    let loading = $state(true);

    let unsubActivity: (() => void) | null = null;

    onMount(async () => {
        try {
            const result = await getAuditLogs(1, 50);
            entries = result.data;
        } catch {
            // ignore
        } finally {
            loading = false;
        }

        // Subscribe to live events
        unsubActivity = onActivity((activity: AuditEntry) => {
            // Skip events already returned by the initial fetch (keyed list needs unique ids)
            if (!entries.some((e) => e.id === activity.id)) entries = [activity, ...entries];
        });
    });

    onDestroy(() => {
        unsubActivity?.();
    });

    // ─── Rich Description Builder ────────────────
    function buildDescription(entry: AuditEntry): {
        performer: string;
        verb: string;
        detail: string;
    } {
        const m = entry.metadata || {};
        const performer = m.performerEmail || "Someone";

        switch (entry.action) {
            case "TASK_CREATED":
                return {
                    performer,
                    verb: "created task",
                    detail: m.title ? `"${m.title}"` : "",
                };

            case "TASK_ASSIGNED":
                return {
                    performer,
                    verb: "assigned",
                    detail: [
                        m.taskTitle ? `"${m.taskTitle}"` : "a task",
                        m.assigneeEmail ? `to ${m.assigneeEmail}` : "",
                    ]
                        .filter(Boolean)
                        .join(" "),
                };

            case "TASK_STATUS_CHANGED":
                return {
                    performer,
                    verb: "changed status of",
                    detail: [
                        m.taskTitle ? `"${m.taskTitle}"` : "a task",
                        m.from && m.to
                            ? `from ${formatStatus(m.from)} → ${formatStatus(m.to)}`
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" "),
                };

            case "TASK_DELETED":
                return {
                    performer,
                    verb: "deleted task",
                    detail: m.title ? `"${m.title}"` : "",
                };

            case "PROJECT_CREATED":
                return {
                    performer,
                    verb: "created project",
                    detail: m.name ? `"${m.name}"` : "",
                };

            case "PROJECT_DELETED":
                return {
                    performer,
                    verb: "deleted project",
                    detail: m.name ? `"${m.name}"` : "",
                };

            case "MEMBER_ADDED":
                return {
                    performer,
                    verb: "added member",
                    detail: [m.email || "", m.role ? `as ${m.role}` : ""]
                        .filter(Boolean)
                        .join(" "),
                };

            case "ROLE_CHANGED":
                return {
                    performer,
                    verb: "changed role of",
                    detail: [
                        m.targetEmail || "a user",
                        m.from && m.to ? `from ${m.from} → ${m.to}` : "",
                    ]
                        .filter(Boolean)
                        .join(" "),
                };

            case "PASSWORD_CHANGED":
                return {
                    performer: "User",
                    verb: "changed their password",
                    detail: "",
                };

            case "USER_CREATED":
                return {
                    performer: m.email || "A user",
                    verb: "registered",
                    detail: "",
                };

            default:
                return {
                    performer,
                    verb: entry.action.toLowerCase().replace(/_/g, " "),
                    detail: "",
                };
        }
    }

    function formatStatus(s: string): string {
        return s.replace("_", " ");
    }

    function actionTone(action: string): string {
        if (action.includes("DELETED")) return "bg-destructive/15 text-destructive";
        if (action.includes("CREATED") || action === "MEMBER_ADDED")
            return "bg-success/15 text-success";
        if (action.includes("ASSIGNED") || action.includes("CHANGED"))
            return "bg-primary/15 text-primary";
        return "bg-muted text-muted-foreground";
    }

    const actionIcons = {
        TASK_CREATED: CirclePlus,
        TASK_ASSIGNED: UserRoundCheck,
        TASK_STATUS_CHANGED: RefreshCw,
        TASK_DELETED: Trash2,
        PROJECT_CREATED: FolderPlus,
        PROJECT_DELETED: Trash2,
        MEMBER_ADDED: UserPlus,
        ROLE_CHANGED: KeyRound,
        USER_CREATED: UserPlus,
        PASSWORD_CHANGED: Lock,
    } as Record<string, typeof Activity>;
</script>

<svelte:head>
    <title>Activity — TaskFlow</title>
</svelte:head>

<div class="grid gap-6">
    <div>
        <h2 class="text-2xl font-semibold tracking-tight">Activity</h2>
        <p class="text-sm text-muted-foreground">Everything happening in your organization, live.</p>
    </div>

    {#if loading}
        <SkeletonLoader variant="row" count={6} />
    {:else if entries.length === 0}
        <EmptyState
            icon={Activity}
            title="No activity yet"
            message="Actions in your workspace will show up here in real time."
        />
    {:else}
        <Card class="p-2 sm:p-4">
            <ol class="relative">
                {#each entries as entry, i (entry.id)}
                    {@const desc = buildDescription(entry)}
                    {@const Icon = actionIcons[entry.action] ?? Activity}
                    <li class="relative flex gap-4 px-2 py-3 sm:px-3">
                        {#if i < entries.length - 1}
                            <span class="absolute top-12 bottom-0 left-[1.625rem] w-px bg-border sm:left-[1.875rem]" aria-hidden="true"></span>
                        {/if}
                        <span class={cn("relative flex size-9 shrink-0 items-center justify-center rounded-full", actionTone(entry.action))}>
                            <Icon class="size-4" />
                        </span>
                        <div class="min-w-0 flex-1 pt-1.5">
                            <p class="text-sm">
                                <span class="font-medium">{desc.performer}</span>
                                <span class="text-muted-foreground">{desc.verb}</span>
                                {#if desc.detail}
                                    <span class="font-medium">{desc.detail}</span>
                                {/if}
                            </p>
                            <div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">{entry.entity}</Badge>
                                <time datetime={entry.createdAt}>{formatRelativeTime(entry.createdAt)}</time>
                            </div>
                        </div>
                    </li>
                {/each}
            </ol>
        </Card>
    {/if}
</div>
