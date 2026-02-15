import { redirect } from '@sveltejs/kit';
import { getMe } from '$lib/api/auth';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async () => {
    try {
        const user = await getMe();
        return { user };
    } catch {
        throw redirect(302, '/login');
    }
};
