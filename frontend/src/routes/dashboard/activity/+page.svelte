<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { getAuditLogs, type AuditEntry } from "$lib/api/activity";
    import { onActivity, socketConnected } from "$lib/realtime/socket";
    import { formatRelativeTime } from "$lib/utils/format";
    import Badge from "$lib/components/ui/Badge.svelte";

    let entries = $state<AuditEntry[]>([]);
    let loading = $state(true);
    let connected = $state(false);

    socketConnected.subscribe((v) => (connected = v));

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
            entries = [activity, ...entries];
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

    function actionColor(action: string): string {
        if (action.includes("DELETED")) return "var(--danger)";
        if (action.includes("CREATED") || action === "MEMBER_ADDED")
            return "var(--success)";
        if (action.includes("ASSIGNED") || action.includes("CHANGED"))
            return "var(--accent)";
        return "var(--text-secondary)";
    }

    function actionIcon(action: string): string {
        const map: Record<string, string> = {
            TASK_CREATED: "✅",
            TASK_ASSIGNED: "👤",
            TASK_STATUS_CHANGED: "🔄",
            TASK_DELETED: "🗑️",
            PROJECT_CREATED: "📁",
            PROJECT_DELETED: "🗑️",
            MEMBER_ADDED: "➕",
            ROLE_CHANGED: "🔑",
            USER_CREATED: "🆕",
            PASSWORD_CHANGED: "🔒",
        };
        return map[action] || "📋";
    }
</script>

<svelte:head>
    <title>Activity — TaskFlow</title>
</svelte:head>

<div class="activity-page fade-in">
    <div class="activity-header">
        <div>
            <h1>Activity Feed</h1>
            <p class="activity-sub">
                Real-time log of everything happening in your organization
            </p>
        </div>
        <div class="connection-status" class:online={connected}>
            <span class="dot"></span>
            {connected ? "Live" : "Connecting..."}
        </div>
    </div>

    {#if loading}
        <p class="loading-text">Loading activity...</p>
    {:else if entries.length === 0}
        <div class="empty-state">
            <p>No activity yet. Actions will appear here in real-time.</p>
        </div>
    {:else}
        <div class="timeline">
            {#each entries as entry, i}
                {@const desc = buildDescription(entry)}
                <div
                    class="timeline-item"
                    style="animation-delay: {Math.min(i * 0.03, 0.5)}s"
                >
                    <div
                        class="timeline-dot"
                        style="background: {actionColor(entry.action)}"
                    ></div>
                    <div class="timeline-content">
                        <div class="timeline-title">
                            <span class="action-icon"
                                >{actionIcon(entry.action)}</span
                            >
                            <span class="performer">{desc.performer}</span>
                            <span
                                class="action-verb"
                                style="color: {actionColor(entry.action)}"
                            >
                                {desc.verb}
                            </span>
                            {#if desc.detail}
                                <span class="action-detail">{desc.detail}</span>
                            {/if}
                        </div>
                        <div class="timeline-meta">
                            <Badge variant="member">{entry.entity}</Badge>
                            <span class="timeline-time"
                                >{formatRelativeTime(entry.createdAt)}</span
                            >
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .activity-page {
        max-width: 800px;
    }
    .activity-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1.5rem;
    }
    .activity-header h1 {
        font-size: 1.3rem;
        font-weight: 700;
    }
    .activity-sub {
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }

    .connection-status {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        padding: 0.35rem 0.75rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 20px;
    }
    .connection-status.online {
        color: var(--success);
        border-color: rgba(45, 212, 191, 0.3);
    }
    .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--text-muted);
    }
    .connection-status.online .dot {
        background: var(--success);
        box-shadow: 0 0 6px var(--success);
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.4;
        }
    }

    /* ─── Timeline ─── */
    .timeline {
        position: relative;
        display: flex;
        flex-direction: column;
    }
    .timeline::before {
        content: "";
        position: absolute;
        left: 7px;
        top: 4px;
        bottom: 4px;
        width: 2px;
        background: var(--border);
        border-radius: 1px;
    }
    .timeline-item {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 0;
        animation: fadeIn 0.3s ease-out both;
    }
    .timeline-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 2px;
        z-index: 1;
        border: 3px solid var(--bg-primary);
    }
    .timeline-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }
    .timeline-title {
        font-size: 0.88rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
        line-height: 1.5;
    }
    .action-icon {
        font-size: 0.8rem;
    }
    .performer {
        font-weight: 600;
        color: var(--text-primary);
    }
    .action-verb {
        font-weight: 500;
    }
    .action-detail {
        color: var(--text-primary);
        font-size: 0.84rem;
    }
    .timeline-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .timeline-time {
        font-size: 0.72rem;
        color: var(--text-muted);
    }

    .loading-text {
        color: var(--text-muted);
        font-size: 0.85rem;
    }
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-muted);
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
    }
</style>
