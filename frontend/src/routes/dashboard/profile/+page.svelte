<script lang="ts">
    import { goto } from "$app/navigation";
    import { updateProfile, changePassword } from "$lib/api/profile";
    import { logout } from "$lib/api/auth";
    import { setUser, clearUser } from "$lib/stores/auth";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import { theme, type Theme } from "$lib/stores/theme";
    import { formatDateLong } from "$lib/utils/format";
    import { KeyRound, LogOut, Monitor, Moon, Palette, Sun, UserRound } from "@lucide/svelte";
    import Avatar from "$lib/components/ui/Avatar.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import { cn } from "$lib/utils";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let profile = $derived(data.profile);

    // ─── Email Update ────────────────────────────
    let editEmail = $state(data.profile.email);
    let emailSaving = $state(false);

    async function handleUpdateEmail() {
        if (editEmail === profile.email) return;
        emailSaving = true;
        try {
            const updated = await updateProfile({ email: editEmail });
            profile = updated;
            setUser({
                id: updated.id,
                email: updated.email,
                role: updated.role,
                organizationId: updated.organizationId,
                organizationName: updated.organizationName,
            });
            toastSuccess("Email updated successfully");
        } catch (err: any) {
            toastError(err.message || "Failed to update email");
        } finally {
            emailSaving = false;
        }
    }

    // ─── Password Change ─────────────────────────
    let currentPassword = $state("");
    let newPassword = $state("");
    let confirmPassword = $state("");
    let pwSaving = $state(false);

    async function handleChangePassword() {
        if (newPassword.length < 8) {
            toastError("New password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toastError("Passwords do not match");
            return;
        }
        pwSaving = true;
        try {
            const result = await changePassword({
                currentPassword,
                newPassword,
            });
            // The API revokes all sessions on password change, including this one
            toastSuccess(`${result.message}. Please sign in again.`);
            clearUser();
            goto("/login");
        } catch (err: any) {
            toastError(err.message || "Failed to change password");
        } finally {
            pwSaving = false;
        }
    }

    // ─── Logout ──────────────────────────────────
    async function handleLogout() {
        try {
            await logout();
        } finally {
            clearUser();
            goto("/login");
        }
    }

    function roleVariant(role: string): "owner" | "admin" | "member" {
        return role.toLowerCase() as "owner" | "admin" | "member";
    }

    const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ];
</script>

<svelte:head>
    <title>Profile — TaskFlow</title>
</svelte:head>

<div class="mx-auto grid max-w-3xl gap-6">
    <Card>
        <div class="flex items-center gap-4 border-b p-6">
            <Avatar email={profile.email} class="size-12 text-lg" />
            <div class="grid min-w-0 gap-1">
                <h2 class="truncate text-lg font-semibold">{profile.email}</h2>
                <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={roleVariant(profile.role)}>{profile.role.toLowerCase()}</Badge>
                    {profile.organizationName} · Member since {formatDateLong(profile.createdAt)}
                </div>
            </div>
        </div>
        <form
            class="grid gap-3 p-6"
            onsubmit={(e) => {
                e.preventDefault();
                handleUpdateEmail();
            }}
        >
            <div class="flex items-center gap-2 font-medium">
                <UserRound class="size-4 text-muted-foreground" />
                Email address
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
                <Input
                    id="profileEmail"
                    type="email"
                    autocomplete="email"
                    aria-label="Email address"
                    bind:value={editEmail}
                    class="flex-1"
                />
                <Button type="submit" loading={emailSaving} disabled={editEmail === profile.email}>Save</Button>
            </div>
        </form>
    </Card>

    <Card class="grid gap-4 p-6">
        <div>
            <div class="flex items-center gap-2 font-medium">
                <Palette class="size-4 text-muted-foreground" />
                Appearance
            </div>
            <p class="mt-1 text-sm text-muted-foreground">Pick a theme or follow your system setting.</p>
        </div>
        <div class="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
            {#each themeOptions as opt (opt.value)}
                <button
                    role="radio"
                    aria-checked={$theme === opt.value}
                    class={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors",
                        $theme === opt.value
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    onclick={() => theme.set(opt.value)}
                >
                    <opt.icon class="size-5" />
                    {opt.label}
                </button>
            {/each}
        </div>
    </Card>

    <Card class="p-6">
        <form
            class="grid gap-4"
            onsubmit={(e) => {
                e.preventDefault();
                handleChangePassword();
            }}
        >
            <div>
                <div class="flex items-center gap-2 font-medium">
                    <KeyRound class="size-4 text-muted-foreground" />
                    Change password
                </div>
                <p class="mt-1 text-sm text-muted-foreground">You will be signed out on all devices afterwards.</p>
            </div>
            <Input
                label="Current password"
                id="currentPw"
                type="password"
                autocomplete="current-password"
                bind:value={currentPassword}
            />
            <div class="grid gap-4 sm:grid-cols-2">
                <Input
                    label="New password"
                    id="newPw"
                    type="password"
                    autocomplete="new-password"
                    bind:value={newPassword}
                    placeholder="At least 8 characters"
                />
                <Input
                    label="Confirm new password"
                    id="confirmPw"
                    type="password"
                    autocomplete="new-password"
                    bind:value={confirmPassword}
                />
            </div>
            <Button
                type="submit"
                class="w-fit"
                loading={pwSaving}
                disabled={!currentPassword || !newPassword || !confirmPassword}
            >
                Change password
            </Button>
        </form>
    </Card>

    <Card class="flex flex-col gap-4 border-destructive/30 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <p class="font-medium">Sign out</p>
            <p class="text-sm text-muted-foreground">Ends your sessions on every device.</p>
        </div>
        <Button variant="destructive" onclick={handleLogout}>
            <LogOut />
            Sign out
        </Button>
    </Card>
</div>
