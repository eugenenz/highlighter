<script lang="ts">
	import { page } from "$app/stores";
	import { drafts, type DraftItem, type ArticleCheckpoint, DraftCheckpoint } from "$stores/drafts";
	import ArticleEditPage from "$components/Editor/ArticleEditPage.svelte";
	import { ndk, newToasterMessage } from "@kind0/ui-common";
	import { NDKArticle } from "@nostr-dev-kit/ndk";
	import { nonSubscribersPreview } from "$stores/post-editor";

    let article = new NDKArticle($ndk);
	let preview = new NDKArticle($ndk);

	$nonSubscribersPreview = true;

	const draftId = $page.url.searchParams.get("draft") || undefined;
	let draftItem: DraftItem | undefined;

	if (draftId) {
		draftItem = $drafts.find(d => d.id === draftId);

		if (!draftItem) {
			newToasterMessage("Draft not found", "error");
		} else {
			const checkpoints = JSON.parse(draftItem.checkpoints) as DraftCheckpoint[];
			let checkpoint = checkpoints.find(c => c.manuallySaved);
			checkpoint = checkpoints[0];

			const payload = checkpoint?.data as ArticleCheckpoint;

			article = new NDKArticle($ndk, JSON.parse(payload.event));
			preview = new NDKArticle($ndk, JSON.parse(payload.preview));
		}
	}
</script>

<svelte:head>
	<title>New article</title>
</svelte:head>

<ArticleEditPage {article} {preview} {draftItem} />
