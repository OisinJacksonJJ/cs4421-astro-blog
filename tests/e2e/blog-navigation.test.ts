import { spawn, type ChildProcess } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { get } from 'node:http';
import { createServer } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Run this test with `npm run test:e2e`. It starts the built site, opens
// /blog/, and requests each story link to confirm the post page is reachable.
const blogDirectory = new URL('../../src/content/blog/', import.meta.url);
let astroProcess: ChildProcess | undefined;
let serverError: Error | undefined;
let serverOutput = '';
let baseUrl: string;

function getPage(url: URL): Promise<{ status: number; body: string }> {
	return new Promise((resolve, reject) => {
		const request = get(url, (response) => {
			let body = '';
			response.setEncoding('utf8');
			response.on('data', (chunk: string) => {
				body += chunk;
			});
			response.on('end', () => {
				resolve({ status: response.statusCode ?? 0, body });
			});
			response.on('error', reject);
		});

		request.setTimeout(5_000, () => {
			request.destroy(new Error(`Request to ${url} timed out.`));
		});
		request.on('error', reject);
	});
}

function headingText(html: string, tag: string): string | undefined {
	const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`));
	return match?.[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function reservePort(): Promise<number> {
	const server = createServer();
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});

	const address = server.address();
	if (!address || typeof address === 'string') {
		throw new Error('Could not determine a local port for the E2E server.');
	}

	const { port } = address;
	await new Promise<void>((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});
	return port;
}

async function waitForServer(): Promise<void> {
	const deadline = Date.now() + 30_000;
	let lastError: unknown;

	while (Date.now() < deadline) {
		if (serverError) {
			throw new Error('Could not start the site E2E server.', { cause: serverError });
		}
		if (astroProcess?.exitCode !== null && astroProcess?.exitCode !== undefined) {
			throw new Error(
				`The site E2E server exited with code ${astroProcess.exitCode}.\n${serverOutput}`,
			);
		}
		if (astroProcess?.signalCode) {
			throw new Error(
				`The site E2E server exited after signal ${astroProcess.signalCode}.\n${serverOutput}`,
			);
		}

		try {
			const response = await getPage(new URL('/blog/', baseUrl));
			if (response.status >= 200 && response.status < 300) return;
			lastError = new Error(
				`The site returned HTTP ${response.status} while starting: ${response.body}`,
			);
		} catch (error) {
			lastError = error;
		}

		await new Promise((resolve) => setTimeout(resolve, 250));
	}

	throw new Error(
		`Astro did not become available at ${baseUrl}.\n${serverOutput}`,
		{ cause: lastError },
	);
}

describe('blog navigation E2E', () => {
	beforeAll(async () => {
		const port = await reservePort();
		baseUrl = `http://127.0.0.1:${port}`;
		astroProcess = spawn(process.execPath, ['dist/server/entry.mjs'], {
			cwd: process.cwd(),
			env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		astroProcess.stdout?.setEncoding('utf8');
		astroProcess.stdout?.on('data', (output: string) => {
			serverOutput += output;
		});
		astroProcess.stderr?.setEncoding('utf8');
		astroProcess.stderr?.on('data', (output: string) => {
			serverOutput += output;
		});
		astroProcess.once('error', (error) => {
			serverError = error;
		});

		await waitForServer();
	}, 35_000);

	afterAll(async () => {
		if (astroProcess && astroProcess.exitCode === null && astroProcess.signalCode === null) {
			await new Promise<void>((resolve) => {
				astroProcess?.once('exit', () => resolve());
				astroProcess?.kill();
			});
		}
	});

	it('shows every blog post as a working story link', async () => {
		const listingResponse = await getPage(new URL('/blog/', baseUrl));
		expect(listingResponse.status).toBe(200);
		const listingHtml = listingResponse.body;
		const blogFiles = (await readdir(blogDirectory)).filter((file) => /\.(md|mdx)$/i.test(file));
		const storyLinks = [
			...listingHtml.matchAll(/<a\b[^>]*href="(\/blog\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
		];

		expect(storyLinks).toHaveLength(blogFiles.length);

		for (const [, href, anchorContents] of storyLinks) {
			const title = headingText(anchorContents, 'h4');
			if (!title) {
				throw new Error(`The story link ${href} does not display a post title.`);
			}

			const postResponse = await getPage(new URL(href, baseUrl));
			expect(postResponse.status, `${href} should open successfully`).toBe(200);
			expect(headingText(postResponse.body, 'h1')).toBe(title);
		}
	});
});
