import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map(({ id, data }) => ({
			title: data.title,
			description: data.description,
			pubDate: data.pubDate,
			link: `/blog/${id}/`,
		})),
	});
}
