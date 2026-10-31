<script lang="ts">
    import { onMount } from "svelte";
    import {
        getTeamMembers,
        inviteMember,
        updateMemberRole,
        type TeamMember,
    } from "$lib/api/team";
    import { user } from "$lib/stores/auth";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import { formatDate } from "$lib/utils/format";
    import { UserPlus } from "@lucide/svelte";
    import Avatar from "$lib/components/ui/Avatar.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import Select from "$lib/components/ui/Select.svelte";
    import SkeletonLoader from "$lib/components/ui/SkeletonLoader.svelte";

    let members = $state<TeamMember[]>([]);
    let loading = $state(true);
    // Reactive: the dashboard layout sets the user after this page initializes on a hard load
    const currentUser = $derived($user);

    // ─── Invite Form ─────────────────────────────
    let showInvite = $state(false);
    let inviteEmail = $state("");
    let invitePassword = $state("");
    let inviteRole = $state("MEMBER");
    let inviteSaving = $state(false);

    onMount(async () => {
        try {
            members = await getTeamMembers();
        } catch {
            // MEMBER role can't access this endpoint
        } finally {
            loading = false;
        }
    });

    async function handleInvite() {
        if (!inviteEmail || !invitePassword) {
            toastError("Email and password are required");
            return;
        }
        inviteSaving = true;
        try {
            const newMember = await inviteMember({
                email: inviteEmail,
                password: invitePassword,
                role: inviteRole as "ADMIN" | "MEMBER",
            });
            members = [...members, newMember];
            inviteEmail = "";
            invitePassword = "";
            inviteRole = "MEMBER";
            showInvite = false;
            toastSuccess("Member added successfully!");
        } catch (err: any) {
            toastError(err.message || "Failed to add member");
        } finally {
            inviteSaving = false;
        }
    }

    async function handleRoleChange(memberId: string, newRole: string) {
        try {
            const updated = await updateMemberRole(memberId, newRole);
            members = members.map((m) => (m.id === memberId ? updated : m));
            toastSuccess("Role updated");
        } catch (err: any) {
            toastError(err.message || "Failed to update role");
        }
    }

    function roleVariant(role: string): "owner" | "admin" | "member" {
        return role.toLowerCase() as "owner" | "admin" | "member";
    }

    const isOwner = $derived(currentUser?.role === "OWNER");
    const canInvite = $derived(
        currentUser?.role === "OWNER" || currentUser?.role === "ADMIN",
    );

    const roleOptions = [
        { value: "MEMBER", label: "Member" },
        { value: "ADMIN", label: "Admin" },
    ];
</script>

<svelte:head>
    <title>Team — TaskFlow</title>
</svelte:head>

<div class="grid gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
            <h2 class="text-2xl font-semibold tracking-tight">Team</h2>
            <p class="text-sm text-muted-foreground">
                {members.length} member{members.length !== 1 ? "s" : ""} in your organization
            </p>
        </div>
        {#if canInvite}
            <Button onclick={() => (showInvite = true)}>
                <UserPlus />
                Add member
            </Button>
        {/if}
    </div>

    {#if loading}
        <SkeletonLoader variant="row" count={4} />
    {:else}
        <Card class="divide-y">
            {#each members as member (member.id)}
                <div class="flex items-center gap-4 px-5 py-3.5">
                    <Avatar email={member.email} class="size-9 text-sm" />
                    <div class="grid min-w-0 flex-1">
                        <span class="truncate font-medium">
                            {member.email}
                            {#if member.id === currentUser?.id}
                                <span class="font-normal text-muted-foreground">(you)</span>
                            {/if}
                        </span>
                        <span class="text-xs text-muted-foreground">Joined {formatDate(member.createdAt)}</span>
                    </div>
                    {#if isOwner && member.role !== "OWNER" && member.id !== currentUser?.id}
                        <Select
                            size="sm"
                            class="w-28"
                            aria-label="Role for {member.email}"
                            value={member.role}
                            options={roleOptions}
                            onchange={(e) => handleRoleChange(member.id, (e.target as HTMLSelectElement).value)}
                        />
                    {:else}
                        <Badge variant={roleVariant(member.role)}>{member.role.toLowerCase()}</Badge>
                    {/if}
                </div>
            {/each}
        </Card>
    {/if}
</div>

<Dialog
    open={showInvite}
    title="Add member"
    description="Create an account in this workspace. Share the temporary password with them securely."
    onclose={() => (showInvite = false)}
>
    <form
        onsubmit={(e) => {
            e.preventDefault();
            handleInvite();
        }}
        class="grid gap-4"
    >
        <Input
            label="Email"
            id="invEmail"
            type="email"
            autocomplete="off"
            bind:value={inviteEmail}
            placeholder="member@company.com"
            required
        />
        <Input
            label="Temporary password"
            id="invPw"
            type="password"
            autocomplete="new-password"
            bind:value={invitePassword}
            placeholder="At least 8 characters"
            minlength={8}
            required
        />
        <Select label="Role" id="invRole" bind:value={inviteRole} options={roleOptions} />
        <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" onclick={() => (showInvite = false)}>Cancel</Button>
            <Button type="submit" loading={inviteSaving}>Add member</Button>
        </div>
    </form>
</Dialog>
