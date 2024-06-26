<script lang="ts">
	import { page } from "$app/stores";
	import CreatorFeed from "$components/Feed/CreatorFeed.svelte";
	import { userSubscription, getUserSubscriptionTiersStore } from "$stores/user-view";
    import UserProfile from "$components/User/UserProfile.svelte";
	import { ndk } from "@kind0/ui-common";
	import { NDKArticle, NDKEvent, NDKKind, NDKVideo, eventIsReply, isEventOriginalPost, type NDKEventId } from "@nostr-dev-kit/ndk";
	import { derived, type Readable } from "svelte/store";
	import { onDestroy, onMount } from "svelte";
    import { addReadReceipt } from "$utils/read-receipts";
	import { pageHeader } from '$stores/layout';
	import type { UserProfileType } from '../../app';
	import Carousel from "$components/Page/Carousel.svelte";
	import ArticleGridArticle from "$components/ArticleGridArticle.svelte";
	import ArticleCard from "$components/ArticleCard.svelte";
	import { auth } from "@getalby/sdk";
	import FilterFeed from "$components/Feed/FilterFeed.svelte";
	import { NDKEventStore } from "@nostr-dev-kit/ndk-svelte";
	import StoreFeed from "$components/Feed/StoreFeed.svelte";
	import { urlFromEvent, urlSuffixFromEvent } from "$utils/url";

    let id: string;
    let { user } = $page.data;

    $: if (id !== $page.params.id) {
        id = $page.params.id;
        user.ndk = $ndk;
    }

    onMount(() => {
        addReadReceipt(user);
    })

    let content: NDKEventStore<NDKEvent>;
    let sortedContent: Readable<(NDKArticle | NDKVideo)[]>;

    onDestroy(() => {
        if (content) content.unsubscribe();
        if (events) events.unsubscribe();
    })

    $: {
        if (content) content.unsubscribe();
        
        content = $ndk.storeSubscribe([
            { kinds: [NDKKind.Article, NDKKind.HorizontalVideo], authors: [user.pubkey] },
        ]);

        sortedContent = derived(content, $content => {
            let ret = [];

            for (const event of $content) {
                switch (event.kind) {
                    case NDKKind.Article: ret.push(NDKArticle.from(event)); break;
                    case NDKKind.HorizontalVideo: ret.push(NDKVideo.from(event)); break;
                }
            }

            return ret.sort((a, b) => b.published_at! - a.published_at!);
        });
    }

    let events: NDKEventStore<NDKEvent>;
    let feed: Readable<NDKEvent[]>;

    $: {
        if (events) events.unsubscribe();

        events = $ndk.storeSubscribe([
            { kinds: [NDKKind.Text], authors: [user.pubkey] },
        ], {
            repostsFilters: [ { kinds: [NDKKind.Repost], authors: [user.pubkey] } ]
        });

        feed = derived(events, $events => {
            const events: NDKEvent[] = [];

            for (const event of $events) {
                if (event.kind === NDKKind.Text) {
                    if (isEventOriginalPost(event))
                        events.push(event);
                } else {
                    events.push(event);
                }
            }

            // Sort by date
            events.sort((a, b) => b.created_at! - a.created_at!);

            return events;
        });
    }

    let userProfile: UserProfileType;

    $: $pageHeader = {}

    let authorUrl: string;
</script>

<svelte:head>
    <title>{userProfile?.name ?? id} on Highlighter</title>
    <meta name="description" content="Creator profile" />
    <meta property="og:title" content={user.npub} />
    <meta property="og:description" content="Creator profile" />
    {#if userProfile?.banner}
        <meta property="og:image" content={userProfile.banner} />
    {/if}
</svelte:head>

<UserProfile {user} bind:authorUrl />

{#if $sortedContent && $sortedContent.length > 0}
    <div class="mb-4">
        <Carousel
            class="overflow-auto w-full gap-6 rounded-none"
            itemCount={$sortedContent.length}
        >
            {#each $sortedContent as content}
                {#if content instanceof NDKArticle}
                    <ArticleCard
                        title={content.title || "Untitled"}
                        image={content.image ?? userProfile?.image}
                        description={content.summary}
                        author={content.author}
                        href={urlFromEvent(content, authorUrl)}
                    />
                {:else if content instanceof NDKVideo}
                    <ArticleCard
                        title={content.title || "Untitled"}
                        image={content.thumbnail ?? userProfile?.image}
                        description={content.content}
                        author={content.author}
                        href={urlFromEvent(content, authorUrl)}
                    />
                {/if}
            {/each}
        </Carousel>
    </div>
{/if}

<StoreFeed {feed} />