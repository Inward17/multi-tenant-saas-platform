<script lang="ts">
    import { ArrowRight, FolderKanban, Layers, ListTodo, ShieldCheck, Users } from "@lucide/svelte";
    import Button from "$lib/components/ui/Button.svelte";

    const features = [
        { icon: FolderKanban, title: "Projects", desc: "Organize work into focused projects." },
        { icon: ListTodo, title: "Tasks", desc: "Assign, track and update work in real time." },
        { icon: Users, title: "Teams", desc: "Owner, admin and member roles for every workspace." },
        { icon: ShieldCheck, title: "Secure", desc: "Isolated workspaces and httpOnly cookie sessions." },
    ];
</script>

<svelte:head>
    <title>TaskFlow — Task Management Built for Teams</title>
    <meta
        name="description"
        content="Organize projects, assign tasks, manage roles — all in one modern platform with real-time multi-tenancy."
    />
</svelte:head>

<div class="relative min-h-dvh overflow-hidden">
    <div
        class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
    ></div>

    <header class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" class="flex items-center gap-2 font-semibold">
            <span class="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Layers class="size-4" />
            </span>
            TaskFlow
        </a>
        <nav class="flex items-center gap-2">
            <Button variant="ghost" href="/login">Sign in</Button>
            <Button href="/register">Get started</Button>
        </nav>
    </header>

    <main class="mx-auto max-w-6xl px-4 sm:px-6">
        <section class="mx-auto flex max-w-3xl animate-fade-in flex-col items-center py-20 text-center sm:py-28">
            <span class="mb-6 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                Multi-tenant · Role-based · Real-time
            </span>
            <h1 class="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
                Task management <span class="text-primary">built for teams</span>
            </h1>
            <p class="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
                Organize projects, assign tasks and manage roles in one workspace, with live updates for
                everyone on your team.
            </p>
            <div class="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" href="/register">
                    Create a workspace
                    <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" href="/login">Sign in</Button>
            </div>
        </section>

        <section class="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
            {#each features as feature (feature.title)}
                <div class="rounded-xl border bg-card p-6 shadow-xs">
                    <div class="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <feature.icon class="size-5" />
                    </div>
                    <h3 class="font-semibold">{feature.title}</h3>
                    <p class="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
                </div>
            {/each}
        </section>
    </main>
</div>
