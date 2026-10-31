<script lang="ts">
  import { goto } from "$app/navigation";
  import { Layers } from "@lucide/svelte";
  import { login } from "$lib/api/auth";
  import { setUser } from "$lib/stores/auth";
  import { toastError } from "$lib/stores/toast";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Input from "$lib/components/ui/Input.svelte";

  let email = $state("");
  let password = $state("");
  let loading = $state(false);

  async function handleSubmit() {
    loading = true;
    try {
      const res = await login({ email, password });
      setUser(res.user);
      goto("/dashboard");
    } catch (e: any) {
      toastError(e.message || "Invalid credentials");
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign In — TaskFlow</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
  <div class="w-full max-w-sm animate-fade-in">
    <a href="/" class="mb-6 flex items-center justify-center gap-2 font-semibold">
      <span class="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Layers class="size-4" />
      </span>
      TaskFlow
    </a>

    <Card class="p-6 sm:p-8">
      <div class="mb-6 grid gap-1.5 text-center">
        <h1 class="text-xl font-semibold">Welcome back</h1>
        <p class="text-sm text-muted-foreground">Sign in to your workspace</p>
      </div>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        class="grid gap-4"
      >
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          autocomplete="email"
          bind:value={email}
          required
          id="login-email"
        />
        <Input
          label="Password"
          type="password"
          autocomplete="current-password"
          bind:value={password}
          required
          id="login-password"
        />
        <Button type="submit" class="mt-2 w-full" {loading}>Sign in</Button>
      </form>
    </Card>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      Don't have an account?
      <a href="/register" class="font-medium text-primary underline-offset-4 hover:underline">Create one</a>
    </p>
  </div>
</div>
