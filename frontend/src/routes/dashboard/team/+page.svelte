<script lang="ts">
    import { onMount } from "svelte";
    import {
        getTeamMembers,
        inviteMember,
        updateMemberRole,
        type TeamMember,
    } from "$lib/api/team";
    import { user } from "$lib/stores/auth";
    import { get } from "svelte/store";
    import { toastSuccess, toastError } from "$lib/stores/toast";
    import { formatDate } from "$lib/utils/format";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import Card from "$lib/components/ui/Card.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import Select from "$lib/components/ui/Select.svelte";

    let members = $state<TeamMember[]>([]);
    let loading = $state(true);
    const currentUser = get(user);

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

<div class="team-page fade-in">
    <div class="team-header">
        <div>
            <h1>Team Members</h1>
            <p class="team-sub">
                {members.length} member{members.length !== 1 ? "s" : ""} in your
                organization
            </p>
        </div>
        {#if canInvite}
            <Button
                variant={showInvite ? "secondary" : "primary"}
                onclick={() => (showInvite = !showInvite)}
            >
                {showInvite ? "Cancel" : "+ Add Member"}
            </Button>
        {/if}
    </div>

    {#if showInvite}
        <Card>
            <div class="invite-form">
                <h3>Add New Member</h3>
                <div class="invite-fields">
                    <Input
                        label="Email"
                        id="invEmail"
                        type="email"
                        bind:value={inviteEmail}
                        placeholder="member@company.com"
                    />
                    <Input
                        label="Temporary Password"
                        id="invPw"
                        type="password"
                        bind:value={invitePassword}
                        placeholder="Min 8 characters"
                    />
                    <Select
                        label="Role"
                        id="invRole"
                        bind:value={inviteRole}
                        options={roleOptions}
                    />
                </div>
                <div class="invite-actions">
                    <Button
                        variant="primary"
                        onclick={handleInvite}
                        loading={inviteSaving}
                    >
                        Add Member
                    </Button>
                </div>
            </div>
        </Card>
    {/if}

    {#if loading}
        <p class="loading-text">Loading team...</p>
    {:else}
        <div class="members-list">
            {#each members as member}
                <div class="member-row">
                    <div class="member-avatar">
                        {member.email[0].toUpperCase()}
                    </div>
                    <div class="member-info">
                        <span class="member-email">{member.email}</span>
                        <span class="member-date"
                            >Joined {formatDate(member.createdAt)}</span
                        >
                    </div>
                    <div class="member-role">
                        {#if isOwner && member.role !== "OWNER" && member.id !== currentUser?.id}
                            <select
                                class="role-select"
                                value={member.role}
                                onchange={(e) =>
                                    handleRoleChange(
                                        member.id,
                                        (e.target as HTMLSelectElement).value,
                                    )}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                            </select>
                        {:else}
                            <Badge variant={roleVariant(member.role)}
                                >{member.role}</Badge
                            >
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .team-page {
        max-width: 800px;
    }
    .team-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1.5rem;
    }
    .team-header h1 {
        font-size: 1.3rem;
        font-weight: 700;
    }
    .team-sub {
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }

    /* ─── Invite Form ─── */
    .invite-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .invite-form h3 {
        font-size: 0.95rem;
        font-weight: 600;
    }
    .invite-fields {
        display: grid;
        grid-template-columns: 1fr 1fr 140px;
        gap: 0.75rem;
    }
    .invite-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    /* ─── Members List ─── */
    .members-list {
        display: flex;
        flex-direction: column;
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        overflow: hidden;
    }
    .member-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.85rem 1.25rem;
        border-bottom: 1px solid var(--border);
        transition: background var(--transition);
    }
    .member-row:last-child {
        border-bottom: none;
    }
    .member-row:hover {
        background: var(--bg-card-hover);
    }
    .member-avatar {
        width: 36px;
        height: 36px;
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
    .member-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
    }
    .member-email {
        font-size: 0.88rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .member-date {
        font-size: 0.72rem;
        color: var(--text-muted);
    }
    .member-role {
        flex-shrink: 0;
    }
    .role-select {
        padding: 0.35rem 0.5rem;
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: var(--radius-xs);
        color: var(--text-primary);
        font-size: 0.78rem;
        cursor: pointer;
        outline: none;
        transition: border-color var(--transition);
    }
    .role-select:focus {
        border-color: var(--accent);
    }

    .loading-text {
        color: var(--text-muted);
        font-size: 0.85rem;
    }
</style>
