import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const blogDirectory = new URL('./blog/', import.meta.url);
const blogFiles = readdirSync(blogDirectory)
	.filter((file) => /\.(md|mdx)$/i.test(file))
	.sort();

describe('blog post word counts', () => {
	it.each(blogFiles)('%s contains at least 50 words', (file) => {
		const markdown = readFileSync(new URL(file, blogDirectory), 'utf8');
		const articleBody = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, '');
		const wordCount = articleBody.match(/\b[A-Za-z]+\b/g)?.length ?? 0;

		expect(wordCount).toBeGreaterThanOrEqual(50);
	});
});
