<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { logout } from "$lib/api/auth";
    import { setUser, clearUser } from "$lib/stores/auth";
    import Badge from "$lib/components/ui/Badge.svelte";
    import type { LayoutData } from "./$types";

    let { data, children }: { data: LayoutData; children: any } = $props();

    $effect(() => {
        if (data.user) setUser(data.user);
    });

    let sidebarCollapsed = $state(false);

    const navItems = [
        {
            href: "/dashboard",
            label: "Overview",
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
        },
        {
            href: "/dashboard/projects",
            label: "Projects",
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
        },
        {
            href: "/dashboard/tasks",
            label: "Tasks",
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
        },
    ];

    function isActive(href: string) {
        const path = $page.url.pathname;
        if (href === "/dashboard") return path === "/dashboard";
        return path.startsWith(href);
    }

    async function handleLogout() {
        await logout();
        clearUser();
        goto("/login");
    }

    function getPageTitle() {
        const path = $page.url.pathname;
        if (path === "/dashboard") return "Overview";
        if (path.startsWith("/dashboard/projects")) return "Projects";
        if (path.startsWith("/dashboard/tasks")) return "Tasks";
        return "Dashboard";
    }

    function roleVariant(role: string): "owner" | "admin" | "member" {
        return role.toLowerCase() as "owner" | "admin" | "member";
    }
</script>

<div class="dashboard-layout">
    <aside class="sidebar" class:collapsed={sidebarCollapsed}>
        <div class="sidebar-brand">
            <div class="brand-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="url(#grad)" />
                    <path
                        d="M7 13l3 3 7-7"
                        stroke="white"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <defs
                        ><linearGradient id="grad" x1="0" y1="0" x2="24" y2="24"
                            ><stop stop-color="#6c63ff" /><stop
                                offset="1"
                                stop-color="#2dd4bf"
                            /></linearGradient
                        ></defs
                    >
                </svg>
            </div>
            <span class="brand-text">TaskFlow</span>
        </div>

        <div class="sidebar-org">
            <span class="org-label">Workspace</span>
            <span class="org-name">{data.user.organizationName}</span>
        </div>

        <nav class="sidebar-nav">
            {#each navItems as item}
                <a
                    href={item.href}
                    class="nav-link"
                    class:active={isActive(item.href)}
                >
                    <span class="nav-icon">{@html item.icon}</span>
                    <span class="nav-label">{item.label}</span>
                    {#if isActive(item.href)}
                        <span class="active-dot"></span>
                    {/if}
                </a>
            {/each}
        </nav>

        <div class="sidebar-footer">
            <div class="user-profile">
                <div class="avatar">
                    {data.user.email[0].toUpperCase()}
                </div>
                <div class="user-details">
                    <span class="user-email">{data.user.email}</span>
                    <Badge variant={roleVariant(data.user.role)}
                        >{data.user.role}</Badge
                    >
                </div>
            </div>
            <button class="logout-btn" onclick={handleLogout} title="Sign out">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>
        </div>
    </aside>

    <main class="main-area">
        <header class="topbar">
            <div class="topbar-left">
                <h1 class="page-title">{getPageTitle()}</h1>
            </div>
        </header>
        <div class="page-content fade-in">
            {@render children()}
        </div>
    </main>
</div>

<style>
    .dashboard-layout {
        display: flex;
        min-height: 100vh;
    }

    /* ─── Sidebar ─── */
    .sidebar {
        width: 260px;
        background: var(--bg-secondary);
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 20;
        transition: width var(--transition);
    }

    .sidebar-brand {
        padding: 1.25rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .brand-icon {
        display: flex;
        flex-shrink: 0;
    }
    .brand-text {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: -0.3px;
    }

    .sidebar-org {
        margin: 0 1rem;
        padding: 0.75rem 1rem;
        background: rgba(108, 99, 255, 0.06);
        border: 1px solid rgba(108, 99, 255, 0.1);
        border-radius: var(--radius-sm);
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }
    .org-label {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-muted);
        font-weight: 600;
    }
    .org-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sidebar-nav {
        flex: 1;
        padding: 1rem 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.65rem 1rem;
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        transition: all var(--transition);
        position: relative;
        text-decoration: none;
    }
    .nav-link:hover {
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-primary);
    }
    .nav-link.active {
        background: rgba(108, 99, 255, 0.1);
        color: var(--accent);
    }
    .nav-icon {
        display: flex;
        align-items: center;
        opacity: 0.7;
    }
    .nav-link.active .nav-icon {
        opacity: 1;
    }
    .active-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--accent);
        margin-left: auto;
        box-shadow: 0 0 8px var(--accent);
    }

    .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .user-profile {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
    }
    .avatar {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: linear-gradient(135deg, #6c63ff, #2dd4bf);
        color: white;
        font-weight: 700;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .user-details {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
    }
    .user-email {
        font-size: 0.75rem;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .logout-btn {
        background: none;
        border: 1px solid transparent;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.4rem;
        border-radius: var(--radius-xs);
        display: flex;
        transition: all var(--transition);
    }
    .logout-btn:hover {
        color: var(--danger);
        border-color: rgba(248, 113, 113, 0.2);
        background: rgba(248, 113, 113, 0.06);
    }

    /* ─── Main ─── */
    .main-area {
        flex: 1;
        margin-left: 260px;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }
    .topbar {
        position: sticky;
        top: 0;
        z-index: 10;
        background: rgba(11, 11, 26, 0.8);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border);
        padding: 0 2rem;
        height: 56px;
        display: flex;
        align-items: center;
    }
    .page-title {
        font-size: 1rem;
        font-weight: 600;
    }
    .page-content {
        padding: 2rem;
        flex: 1;
        max-width: 1200px;
        width: 100%;
    }
</style>
