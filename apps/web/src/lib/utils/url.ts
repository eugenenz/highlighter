import { ndk } from '@kind0/ui-common';
import type { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
import { get } from 'svelte/store';
import { vanityUrlsByPubkey } from './const';

export const EVENT_ID_SUFFIX_LENGTH = 999;

const BASE_URL = import.meta.env.VITE_BASE_URL;

export function getAuthorUrlSync(user: NDKUser) {
	if (vanityUrlsByPubkey[user.pubkey])
		return `/${vanityUrlsByPubkey[user.pubkey]}`;

	// todo add a sync function for getting nip05s from the cache

	return `/${user.npub}`;
}

export async function getAuthorUrl(user: NDKUser) {
	const $ndk = get(ndk);

	// prefer vanity urls
	if (vanityUrlsByPubkey[user.pubkey])
		return `/${vanityUrlsByPubkey[user.pubkey]}`;

	if (
		$ndk.cacheAdapter?.locking &&
		$ndk.cacheAdapter?.fetchProfile
	) {
		const profile = await $ndk.cacheAdapter!.fetchProfile(user.pubkey);

		if (profile && profile.nip05) {
			return `/${profile.nip05}`;
		}
	}

	return `/${user.npub}`;
}

export function urlFromEvent(event: NDKEvent, authorUrl?: string, fullUrl = false): string {
	const url: string[] = [];

	if (fullUrl) url.push(BASE_URL);

	authorUrl ??= getAuthorUrlSync(event.author);

	if (event.isParamReplaceable()) {
		const dTag = event.tagValue("d");
		if (dTag && dTag.length > 0) {
			url.push(authorUrl);
			url.push(dTag)
		} else {
			url.push("a");
			url.push(event.encode());
		}
	} else {
		url.push("a");
		url.push(event.encode());
	}

	return url.join("/");
}

export function urlSuffixFromEvent(event: NDKEvent): string {
	if (event.isParamReplaceable()) {
		return encodeURIComponent(event.tagValue('d')!);
	} else {
		return event.encode();
	}

}

export function urlSuffixFromTagId(tagId: string): string {
	const dTag = tagId.split(':')[2];

	if (dTag) {
		return dTag;
	}

	return tagId;
}
