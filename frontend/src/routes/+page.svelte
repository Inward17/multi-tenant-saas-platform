<script lang="ts">
    import { goto } from "$app/navigation";
    import Button from "$lib/components/ui/Button.svelte";
</script>

<svelte:head>
    <title>TaskFlow — Task Management Built for Teams</title>
    <meta
        name="description"
        content="Organize projects, assign tasks, manage roles — all in one modern platform with real-time multi-tenancy."
    />
</svelte:head>

<div class="landing">
    <nav class="landing-nav">
        <div class="nav-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="url(#lg)" />
                <path
                    d="M7 13l3 3 7-7"
                    stroke="white"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <defs
                    ><linearGradient id="lg" x1="0" y1="0" x2="24" y2="24"
                        ><stop stop-color="#6c63ff" /><stop
                            offset="1"
                            stop-color="#2dd4bf"
                        /></linearGradient
                    ></defs
                >
            </svg>
            <span>TaskFlow</span>
        </div>
        <div class="nav-actions">
            <Button variant="ghost" onclick={() => goto("/login")}
                >Sign In</Button
            >
            <Button
                variant="primary"
                size="sm"
                onclick={() => goto("/register")}>Get Started</Button
            >
        </div>
    </nav>

    <div class="hero fade-in">
        <div class="hero-badge">Multi-Tenant SaaS Platform</div>
        <h1>
            Task Management<br /><span class="gradient-text"
                >Built for Teams</span
            >
        </h1>
        <p class="hero-sub">
            Organize projects, assign tasks, and manage roles — all in one
            modern platform with real-time multi-tenancy and role-based access
            control.
        </p>
        <div class="hero-cta">
            <Button
                variant="primary"
                size="lg"
                onclick={() => goto("/register")}>Get Started Free</Button
            >
            <Button variant="secondary" size="lg" onclick={() => goto("/login")}
                >Sign In</Button
            >
        </div>
    </div>

    <div class="features fade-in">
        {#each [{ icon: "📁", title: "Projects", desc: "Organize work into focused projects" }, { icon: "✅", title: "Tasks", desc: "Assign, track, and manage tasks" }, { icon: "👥", title: "Teams", desc: "Role-based access for every member" }, { icon: "🔒", title: "Secure", desc: "Enterprise-grade cookie-based auth" }] as feature}
            <div class="feature-card">
                <span class="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
            </div>
        {/each}
    </div>
</div>

<style>
    .landing {
        min-height: 100vh;
        background: radial-gradient(
                ellipse at 30% 0%,
                rgba(108, 99, 255, 0.1) 0%,
                transparent 50%
            ),
            radial-gradient(
                ellipse at 70% 100%,
                rgba(45, 212, 191, 0.08) 0%,
                transparent 50%
            ),
            var(--bg-primary);
    }

    .landing-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 2rem;
        max-width: 1100px;
        margin: 0 auto;
    }
    .nav-brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-weight: 800;
        font-size: 1.1rem;
    }
    .nav-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .hero {
        text-align: center;
        padding: 4rem 2rem 3rem;
        max-width: 700px;
        margin: 0 auto;
    }
    .hero-badge {
        display: inline-block;
        background: rgba(108, 99, 255, 0.1);
        color: var(--accent);
        padding: 0.35rem 1rem;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 1.5rem;
        border: 1px solid rgba(108, 99, 255, 0.15);
    }
    .hero h1 {
        font-size: 3rem;
        font-weight: 800;
        line-height: 1.15;
        margin-bottom: 1.25rem;
        letter-spacing: -0.5px;
    }
    .gradient-text {
        background: linear-gradient(135deg, #6c63ff 0%, #2dd4bf 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .hero-sub {
        color: var(--text-secondary);
        font-size: 1.1rem;
        line-height: 1.7;
        margin-bottom: 2.5rem;
        max-width: 520px;
        margin-left: auto;
        margin-right: auto;
    }
    .hero-cta {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
    }

    .features {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
    }
    .feature-card {
        text-align: center;
        padding: 1.5rem 1rem;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        transition: all var(--transition);
    }
    .feature-card:hover {
        border-color: var(--border-hover);
        transform: translateY(-2px);
    }
    .feature-icon {
        font-size: 1.75rem;
        display: block;
        margin-bottom: 0.75rem;
    }
    .feature-card h3 {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.3rem;
    }
    .feature-card p {
        font-size: 0.8rem;
        color: var(--text-secondary);
        line-height: 1.4;
    }
</style>
