import { describe, expect, it } from 'vitest';
import { SITE_DESCRIPTION, SITE_TITLE } from './consts';

describe('site constants', () => {
	it('defines the site title and description', () => {
		expect(SITE_TITLE).toBe('What Is in a Kickout?');
		expect(SITE_DESCRIPTION).toBe(
			'Stories and analysis about the drama, craft, and history of professional wrestling kickouts.',
		);
	});
});