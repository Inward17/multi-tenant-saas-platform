<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount, onDestroy } from "svelte";
    import {
        Activity,
        FolderKanban,
        Layers,
        LayoutDashboard,
        ListTodo,
        LogOut,
        Menu,
        Monitor,
        Moon,
        Settings,
        Sun,
        UserRound,
        Users,
        X,
    } from "@lucide/svelte";
    import { logout } from "$lib/api/auth";
    import { setUser, clearUser } from "$lib/stores/auth";
    import { theme } from "$lib/stores/theme";
    import { connectSocket, disconnectSocket, socketConnected } from "$lib/realtime/socket";
    import Avatar from "$lib/components/ui/Avatar.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import { cn } from "$lib/utils";
    import type { LayoutData } from "./$types";

    let { data, children }: { data: LayoutData; children: any } = $props();

    $effect(() => {
        if (data.user) setUser(data.user);
    });

    onMount(() => connectSocket());
    onDestroy(() => disconnectSocket());

    let mobileNavOpen = $state(false);

    // Close the mobile drawer whenever the route changes
    $effect(() => {
        $page.url.pathname;
        mobileNavOpen = false;
    });

    const navItems = [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
        { href: "/dashboard/tasks", label: "Tasks", icon: ListTodo },
        { href: "/dashboard/team", label: "Team", icon: Users },
        { href: "/dashboard/activity", label: "Activity", icon: Activity, adminOnly: true },
        { href: "/dashboard/profile", label: "Profile", icon: UserRound },
        { href: "/dashboard/settings", label: "Settings", icon: Settings, ownerOnly: true },
    ];

    const visibleNav = $derived(
        navItems.filter(
            (i) => (!i.adminOnly || data.user.role !== "MEMBER") && (!i.ownerOnly || data.user.role === "OWNER"),
        ),
    );

    function isActive(href: string) {
        const path = $page.url.pathname;
        if (href === "/dashboard") return path === "/dashboard";
        return path.startsWith(href);
    }

    const pageTitle = $derived(
        navItems.find((i) => isActive(i.href))?.label ?? "Dashboard",
    );

    async function handleLogout() {
        try {
            await logout();
        } finally {
            clearUser();
            goto("/login");
        }
    }

    const themeCycle = { light: "dark", dark: "system", system: "light" } as const;
    const themeIcon = { light: Sun, dark: Moon, system: Monitor };
    const ThemeIcon = $derived(themeIcon[$theme]);
</script>

<div class="min-h-dvh bg-background">
    <!-- Mobile drawer backdrop -->
    {#if mobileNavOpen}
        <button
            class="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close navigation"
            onclick={() => (mobileNavOpen = false)}
        ></button>
    {/if}

    <aside
        class={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform duration-200 lg:translate-x-0",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
    >
        <div class="flex h-14 items-center justify-between gap-2 border-b px-4">
            <a href="/dashboard" class="flex items-center gap-2 font-semibold">
                <span
                    class="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
                >
                    <Layers class="size-4" />
                </span>
                TaskFlow
            </a>
            <Button
                variant="ghost"
                size="icon-sm"
                class="lg:hidden"
                aria-label="Close navigation"
                onclick={() => (mobileNavOpen = false)}
            >
                <X />
            </Button>
        </div>

        <div class="px-4 pt-4">
            <div class="rounded-lg border bg-background px-3 py-2">
                <p class="text-xs text-muted-foreground">Workspace</p>
                <p class="truncate text-sm font-medium">{data.user.organizationName}</p>
            </div>
        </div>

        <nav class="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main">
            {#each visibleNav as item (item.href)}
                <a
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    class={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                >
                    <item.icon class="size-4" />
                    {item.label}
                </a>
            {/each}
        </nav>

        <div class="flex items-center gap-3 border-t p-4">
            <Avatar email={data.user.email} />
            <div class="grid min-w-0 flex-1 gap-1">
                <span class="truncate text-sm font-medium">{data.user.email}</span>
                <Badge variant={data.user.role.toLowerCase() as "owner" | "admin" | "member"}>
                    {data.user.role.toLowerCase()}
                </Badge>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Sign out" title="Sign out" onclick={handleLogout}>
                <LogOut />
            </Button>
        </div>
    </aside>

    <div class="flex min-h-dvh flex-col lg:pl-64">
        <header
            class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6"
        >
            <Button
                variant="ghost"
                size="icon-sm"
                class="lg:hidden"
                aria-label="Open navigation"
                onclick={() => (mobileNavOpen = true)}
            >
                <Menu />
            </Button>
            <!-- Desktop shows the active section in the sidebar and as the page heading -->
            <h1 class="text-base font-semibold lg:sr-only">{pageTitle}</h1>

            <div class="ml-auto flex items-center gap-2">
                <span
                    class="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
                    title={$socketConnected ? "Real-time updates connected" : "Connecting to real-time updates"}
                >
                    <span
                        class={cn(
                            "size-2 rounded-full",
                            $socketConnected ? "bg-success" : "animate-pulse bg-muted-foreground",
                        )}
                    ></span>
                    {$socketConnected ? "Live" : "Connecting"}
                </span>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Theme: {$theme}. Switch to {themeCycle[$theme]}"
                    title="Theme: {$theme}"
                    onclick={() => theme.set(themeCycle[$theme])}
                >
                    <ThemeIcon />
                </Button>
            </div>
        </header>

        <main class="mx-auto w-full max-w-6xl flex-1 animate-fade-in p-4 sm:p-6 lg:p-8">
            {@render children()}
        </main>
    </div>
</div>
