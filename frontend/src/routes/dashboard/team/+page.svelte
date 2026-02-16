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
    import Badge from "$lib/components/ui/Badge.svelte";
    import Card from "$lib/components/ui/Card.svelte";

    let members = $state<TeamMember[]>([]);
    let loading = $state(true);
    const currentUser = get(user);

    // ─── Invite Form ─────────────────────────────
    let showInvite = $state(false);
    let inviteEmail = $state("");
    let invitePassword = $state("");
    let inviteRole = $state<"ADMIN" | "MEMBER">("MEMBER");
    let inviteSaving = $state(false);
    let inviteMsg = $state("");
    let inviteError = $state("");

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
        inviteMsg = "";
        inviteError = "";
        if (!inviteEmail || !invitePassword) {
            inviteError = "Email and password are required";
            return;
        }
        inviteSaving = true;
        try {
            const newMember = await inviteMember({
                email: inviteEmail,
                password: invitePassword,
                role: inviteRole,
            });
            members = [...members, newMember];
            inviteEmail = "";
            invitePassword = "";
            inviteRole = "MEMBER";
            inviteMsg = "Member added successfully!";
            showInvite = false;
        } catch (err: any) {
            inviteError = err.message || "Failed to add member";
        } finally {
            inviteSaving = false;
        }
    }

    async function handleRoleChange(memberId: string, newRole: string) {
        try {
            const updated = await updateMemberRole(memberId, newRole);
            members = members.map((m) => (m.id === memberId ? updated : m));
        } catch (err: any) {
            alert(err.message || "Failed to update role");
        }
    }

    function roleVariant(role: string): "owner" | "admin" | "member" {
        return role.toLowerCase() as "owner" | "admin" | "member";
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    const isOwner = $derived(currentUser?.role === "OWNER");
    const canInvite = $derived(
        currentUser?.role === "OWNER" || currentUser?.role === "ADMIN",
    );
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
            <button
                class="btn btn-primary"
                onclick={() => (showInvite = !showInvite)}
            >
                {showInvite ? "Cancel" : "+ Add Member"}
            </button>
        {/if}
    </div>

    {#if showInvite}
        <Card>
            <div class="invite-form">
                <h3>Add New Member</h3>
                <div class="invite-fields">
                    <div class="field">
                        <label for="invEmail">Email</label>
                        <input
                            id="invEmail"
                            type="email"
                            bind:value={inviteEmail}
                            class="input"
                            placeholder="member@company.com"
                        />
                    </div>
                    <div class="field">
                        <label for="invPw">Temporary Password</label>
                        <input
                            id="invPw"
                            type="password"
                            bind:value={invitePassword}
                            class="input"
                            placeholder="Min 8 characters"
                        />
                    </div>
                    <div class="field">
                        <label for="invRole">Role</label>
                        <select
                            id="invRole"
                            class="input"
                            bind:value={inviteRole}
                        >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                </div>
                <div class="invite-actions">
                    <button
                        class="btn btn-primary"
                        onclick={handleInvite}
                        disabled={inviteSaving}
                    >
                        {inviteSaving ? "Adding..." : "Add Member"}
                    </button>
                    {#if inviteMsg}<span class="msg success">{inviteMsg}</span
                        >{/if}
                    {#if inviteError}<span class="msg error">{inviteError}</span
                        >{/if}
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

    .btn {
        padding: 0.55rem 1.2rem;
        border-radius: var(--radius-sm);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all var(--transition);
    }
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .btn-primary {
        background: var(--accent);
        color: white;
    }
    .btn-primary:hover:not(:disabled) {
        filter: brightness(1.1);
        box-shadow: 0 0 16px rgba(108, 99, 255, 0.3);
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
        grid-template-columns: 1fr 1fr 120px;
        gap: 0.75rem;
    }
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }
    .field label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--text-muted);
        font-weight: 600;
    }
    .input {
        padding: 0.5rem 0.75rem;
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-size: 0.85rem;
        outline: none;
        transition: border-color var(--transition);
    }
    .input:focus {
        border-color: var(--accent);
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
    }
    .role-select:focus {
        border-color: var(--accent);
    }

    .msg {
        font-size: 0.78rem;
    }
    .msg.success {
        color: var(--success);
    }
    .msg.error {
        color: var(--danger);
    }
    .loading-text {
        color: var(--text-muted);
        font-size: 0.85rem;
    }
</style>
