<script lang="ts">
  import { goto } from "$app/navigation";
  import { register } from "$lib/api/auth";
  import { setUser } from "$lib/stores/auth";
  import { toastError } from "$lib/stores/toast";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";

  let organizationName = $state("");
  let email = $state("");
  let password = $state("");
  let _gotcha = $state(""); // Honeypot
  let loading = $state(false);

  async function handleSubmit() {
    loading = true;
    try {
      const res = await register({ organizationName, email, password, _gotcha });
      setUser(res.user);
      goto("/dashboard");
    } catch (e: any) {
      toastError(e.message || "Registration failed");
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Create Workspace — TaskFlow</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-card fade-in">
    <div class="auth-brand">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="url(#g)" />
        <path
          d="M7 13l3 3 7-7"
          stroke="white"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <defs
          ><linearGradient id="g" x1="0" y1="0" x2="24" y2="24"
            ><stop stop-color="#6c63ff" /><stop
              offset="1"
              stop-color="#2dd4bf"
            /></linearGradient
          ></defs
        >
      </svg>
    </div>
    <h1>Create your workspace</h1>
    <p class="auth-sub">Start managing your team's tasks</p>

    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      class="auth-form"
    >
      <Input
        label="Organization Name"
        placeholder="Acme Corp"
        bind:value={organizationName}
        required
        id="reg-org"
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        bind:value={email}
        required
        id="reg-email"
      />
      <Input
        label="Password"
        type="password"
        placeholder="Min 6 characters"
        bind:value={password}
        required
        minlength={6}
        id="reg-password"
      />

      <!-- Honeypot field (hidden from humans) -->
      <div style="opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1;">
        <label for="_gotcha">Do not fill this field</label>
        <input
          type="text"
          name="_gotcha"
          id="_gotcha"
          bind:value={_gotcha}
          tabindex="-1"
          autocomplete="off"
        />
      </div>
      <Button variant="primary" type="submit" fullWidth {loading}
        >Create Workspace</Button
      >
    </form>

    <p class="auth-footer">
      Already have an account? <a href="/login">Sign in</a>
    </p>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: radial-gradient(
        ellipse at 30% 20%,
        rgba(108, 99, 255, 0.08) 0%,
        transparent 60%
      ),
      radial-gradient(
        ellipse at 70% 80%,
        rgba(45, 212, 191, 0.06) 0%,
        transparent 60%
      ),
      var(--bg-primary);
  }
  .auth-card {
    width: 100%;
    max-width: 400px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2.5rem;
    text-align: center;
  }
  .auth-brand {
    margin-bottom: 1.25rem;
  }
  h1 {
    font-size: 1.4rem;
    font-weight: 700;
  }
  .auth-sub {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-top: 0.3rem;
    margin-bottom: 2rem;
  }
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: left;
  }
  .auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
</style>
