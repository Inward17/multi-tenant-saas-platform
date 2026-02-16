import { getProfile } from '$lib/api/profile';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    try {
        const profile = await getProfile();
        return { profile };
    } catch {
        throw redirect(302, '/login');
    }
};
