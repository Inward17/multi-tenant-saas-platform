<script lang="ts">
  import { goto } from "$app/navigation";
  import { Layers } from "@lucide/svelte";
  import { register } from "$lib/api/auth";
  import { setUser } from "$lib/stores/auth";
  import { toastError } from "$lib/stores/toast";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
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
        <h1 class="text-xl font-semibold">Create your workspace</h1>
        <p class="text-sm text-muted-foreground">You'll be the owner of a new organization</p>
      </div>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        class="relative grid gap-4"
      >
        <Input
          label="Organization name"
          placeholder="Acme Corp"
          autocomplete="organization"
          bind:value={organizationName}
          required
          id="reg-org"
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          autocomplete="email"
          bind:value={email}
          required
          id="reg-email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          autocomplete="new-password"
          bind:value={password}
          required
          minlength={6}
          id="reg-password"
        />

        <!-- Honeypot field (hidden from humans) -->
        <div class="absolute top-0 left-0 -z-10 size-0 overflow-hidden opacity-0" aria-hidden="true">
          <label for="_gotcha">Do not fill this field</label>
          <input type="text" name="_gotcha" id="_gotcha" bind:value={_gotcha} tabindex="-1" autocomplete="off" />
        </div>

        <Button type="submit" class="mt-2 w-full" {loading}>Create workspace</Button>
      </form>
    </Card>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      Already have an account?
      <a href="/login" class="font-medium text-primary underline-offset-4 hover:underline">Sign in</a>
    </p>
  </div>
</div>
