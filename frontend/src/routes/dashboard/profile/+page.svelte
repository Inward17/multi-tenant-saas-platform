<script lang="ts">
    import { goto } from "$app/navigation";
    import { updateProfile, changePassword } from "$lib/api/profile";
    import { logout } from "$lib/api/auth";
    import { setUser, clearUser } from "$lib/stores/auth";
    import { theme, type Theme } from "$lib/stores/theme";
    import Badge from "$lib/components/ui/Badge.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let profile = $derived(data.profile);

    // ─── Email Update ────────────────────────────
    let editEmail = $state(data.profile.email);
    let emailSaving = $state(false);
    let emailMsg = $state("");
    let emailError = $state("");

    async function handleUpdateEmail() {
        if (editEmail === profile.email) return;
        emailSaving = true;
        emailMsg = "";
        emailError = "";
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
            emailMsg = "Email updated successfully";
        } catch (err: any) {
            emailError = err.message || "Failed to update email";
        } finally {
            emailSaving = false;
        }
    }

    // ─── Password Change ─────────────────────────
    let currentPassword = $state("");
    let newPassword = $state("");
    let confirmPassword = $state("");
    let pwSaving = $state(false);
    let pwMsg = $state("");
    let pwError = $state("");

    async function handleChangePassword() {
        pwMsg = "";
        pwError = "";
        if (newPassword.length < 8) {
            pwError = "New password must be at least 8 characters";
            return;
        }
        if (newPassword !== confirmPassword) {
            pwError = "Passwords do not match";
            return;
        }
        pwSaving = true;
        try {
            const result = await changePassword({
                currentPassword,
                newPassword,
            });
            pwMsg = result.message;
            currentPassword = "";
            newPassword = "";
            confirmPassword = "";
        } catch (err: any) {
            pwError = err.message || "Failed to change password";
        } finally {
            pwSaving = false;
        }
    }

    // ─── Logout ──────────────────────────────────
    async function handleLogout() {
        await logout();
        clearUser();
        goto("/login");
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function roleVariant(role: string): "owner" | "admin" | "member" {
        return role.toLowerCase() as "owner" | "admin" | "member";
    }
</script>

<div class="profile-page">
    <!-- ─── Account Information ─── -->
    <section class="profile-card">
        <div class="card-header">
            <div class="card-icon">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    /><circle cx="12" cy="7" r="4" />
                </svg>
            </div>
            <h2>Account Information</h2>
        </div>

        <div class="info-grid">
            <div class="info-item">
                <label for="profileEmail">Email Address</label>
                <div class="input-row">
                    <input
                        id="profileEmail"
                        type="email"
                        bind:value={editEmail}
                        class="input"
                        placeholder="you@example.com"
                    />
                    <button
                        class="btn btn-sm btn-primary"
                        onclick={handleUpdateEmail}
                        disabled={emailSaving || editEmail === profile.email}
                    >
                        {emailSaving ? "Saving..." : "Save"}
                    </button>
                </div>
                {#if emailMsg}<p class="msg success">{emailMsg}</p>{/if}
                {#if emailError}<p class="msg error">{emailError}</p>{/if}
            </div>

            <div class="info-item">
                <span class="info-label">Role</span>
                <div>
                    <Badge variant={roleVariant(profile.role)}
                        >{profile.role}</Badge
                    >
                </div>
            </div>

            <div class="info-item">
                <span class="info-label">Organization</span>
                <span class="info-value">{profile.organizationName}</span>
            </div>

            <div class="info-item">
                <span class="info-label">Member Since</span>
                <span class="info-value">{formatDate(profile.createdAt)}</span>
            </div>
        </div>
    </section>

    <!-- ─── Appearance ─── -->
    <section class="profile-card">
        <div class="card-header">
            <div class="card-icon">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="12" cy="12" r="5" /><line
                        x1="12"
                        y1="1"
                        x2="12"
                        y2="3"
                    /><line x1="12" y1="21" x2="12" y2="23" /><line
                        x1="4.22"
                        y1="4.22"
                        x2="5.64"
                        y2="5.64"
                    /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line
                        x1="1"
                        y1="12"
                        x2="3"
                        y2="12"
                    /><line x1="21" y1="12" x2="23" y2="12" /><line
                        x1="4.22"
                        y1="19.78"
                        x2="5.64"
                        y2="18.36"
                    /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            </div>
            <h2>Appearance</h2>
        </div>

        <div class="theme-section">
            <p class="theme-desc">
                Choose how TaskFlow looks for you. Select a single theme or sync
                with your system settings.
            </p>
            <div class="theme-options">
                {#each [{ value: "light", label: "Light", icon: "☀️" }, { value: "dark", label: "Dark", icon: "🌙" }, { value: "system", label: "System", icon: "💻" }] as opt}
                    <button
                        class="theme-option"
                        class:selected={$theme === opt.value}
                        onclick={() => theme.set(opt.value as Theme)}
                    >
                        <span class="theme-emoji">{opt.icon}</span>
                        <span class="theme-label">{opt.label}</span>
                    </button>
                {/each}
            </div>
        </div>
    </section>

    <!-- ─── Change Password ─── -->
    <section class="profile-card">
        <div class="card-header">
            <div class="card-icon">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                    /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            </div>
            <h2>Change Password</h2>
        </div>

        <div class="password-form">
            <div class="form-field">
                <label for="currentPw">Current Password</label>
                <input
                    id="currentPw"
                    type="password"
                    bind:value={currentPassword}
                    class="input"
                    placeholder="Enter current password"
                />
            </div>
            <div class="form-field">
                <label for="newPw">New Password</label>
                <input
                    id="newPw"
                    type="password"
                    bind:value={newPassword}
                    class="input"
                    placeholder="Min 8 characters"
                />
            </div>
            <div class="form-field">
                <label for="confirmPw">Confirm New Password</label>
                <input
                    id="confirmPw"
                    type="password"
                    bind:value={confirmPassword}
                    class="input"
                    placeholder="Re-enter new password"
                />
            </div>
            <button
                class="btn btn-primary"
                onclick={handleChangePassword}
                disabled={pwSaving ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword}
            >
                {pwSaving ? "Changing..." : "Change Password"}
            </button>
            {#if pwMsg}<p class="msg success">{pwMsg}</p>{/if}
            {#if pwError}<p class="msg error">{pwError}</p>{/if}
        </div>
    </section>

    <!-- ─── Security ─── -->
    <section class="profile-card">
        <div class="card-header">
            <div class="card-icon danger">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            </div>
            <h2>Security</h2>
        </div>

        <div class="security-actions">
            <div class="security-item">
                <div>
                    <h3>Sign Out</h3>
                    <p>Sign out of your current session on this device.</p>
                </div>
                <button class="btn btn-danger" onclick={handleLogout}>
                    Sign Out
                </button>
            </div>
        </div>
    </section>
</div>

<style>
    .profile-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 720px;
    }

    .profile-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 1.75rem;
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }
    .card-header h2 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
    }
    .card-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(108, 99, 255, 0.1);
        color: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .card-icon.danger {
        background: rgba(248, 113, 113, 0.1);
        color: var(--danger);
    }

    /* ─── Info Grid ─── */
    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
    }
    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }
    .info-item:first-child {
        grid-column: 1 / -1;
    }
    .info-item label,
    .info-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--text-muted);
        font-weight: 600;
    }
    .info-value {
        font-size: 0.9rem;
        color: var(--text-primary);
    }

    .input-row {
        display: flex;
        gap: 0.5rem;
    }
    .input {
        flex: 1;
        padding: 0.55rem 0.85rem;
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

    /* ─── Password Form ─── */
    .password-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }
    .form-field label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--text-muted);
        font-weight: 600;
    }

    /* ─── Buttons ─── */
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
    .btn-sm {
        padding: 0.45rem 1rem;
        font-size: 0.75rem;
    }
    .btn-primary {
        background: var(--accent);
        color: white;
    }
    .btn-primary:hover:not(:disabled) {
        filter: brightness(1.1);
        box-shadow: 0 0 16px rgba(108, 99, 255, 0.3);
    }
    .btn-danger {
        background: rgba(248, 113, 113, 0.1);
        color: var(--danger);
        border: 1px solid rgba(248, 113, 113, 0.2);
    }
    .btn-danger:hover:not(:disabled) {
        background: rgba(248, 113, 113, 0.18);
    }

    /* ─── Feedback ─── */
    .msg {
        font-size: 0.78rem;
        margin-top: 0.25rem;
    }
    .msg.success {
        color: var(--success);
    }
    .msg.error {
        color: var(--danger);
    }

    /* ─── Security ─── */
    .security-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .security-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    .security-item h3 {
        font-size: 0.9rem;
        font-weight: 600;
        margin: 0;
    }
    .security-item p {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin: 0.2rem 0 0;
    }

    /* ─── Theme Picker ─── */
    .theme-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .theme-desc {
        font-size: 0.82rem;
        color: var(--text-secondary);
        line-height: 1.5;
    }
    .theme-options {
        display: flex;
        gap: 0.75rem;
    }
    .theme-option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 0.75rem;
        background: var(--bg-primary);
        border: 2px solid var(--border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition);
    }
    .theme-option:hover {
        border-color: var(--border-hover);
        background: var(--bg-card-hover);
    }
    .theme-option.selected {
        border-color: var(--accent);
        background: var(--accent-glow);
        box-shadow: 0 0 16px rgba(108, 99, 255, 0.15);
    }
    .theme-emoji {
        font-size: 1.5rem;
    }
    .theme-label {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-secondary);
    }
    .theme-option.selected .theme-label {
        color: var(--accent);
    }
</style>
