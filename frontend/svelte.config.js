import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Vercel sets VERCEL=1 during its builds; everywhere else (Docker, Render) runs the Node server
		adapter: process.env.VERCEL ? adapterVercel() : adapterNode()
	}
};

export default config;
