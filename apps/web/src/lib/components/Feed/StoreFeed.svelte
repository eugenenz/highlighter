<script lang="ts">
	import { Readable, derived } from "svelte/store";
	import { NDKArticle, NDKEvent, NDKEventId, NDKHighlight, NDKKind, NDKList, NDKTag } from "@nostr-dev-kit/ndk";
	import Highlight from "$components/Highlight.svelte";
	import ArticleLink from "$components/Events/ArticleLink.svelte";
	import { navigateToEvent } from "./navigate-to-event";
    import { inview } from 'svelte-inview';
	import EventWrapper from "./EventWrapper.svelte";
	import { pluralize } from "$utils";
	import GroupNote from "$components/Events/GroupNote.svelte";
	import CurationItem from "$components/CurationItem.svelte";

    export let feed: Readable<NDKEvent[]>;
    export let renderLimit = 10;
    export let newPostTags: NDKTag[] = [];
    export let urlPrefix: string = "/e/";
    export let showEventsOlderThan: Date | undefined = undefined;
    export let tooNewEvents = new Set<NDKEventId>();

    const perNoteLatestActivity = new Map<NDKEventId, number>();

    const skipEventIds = new Set<NDKEventId>();
    const allEventIds = new Set<NDKEventId>();

    const renderFeed = derived(feed, $feed => {
        const topLevelNotes = new Map<NDKEventId, NDKEvent>();
        tooNewEvents = new Set<NDKEventId>();

        for (const event of $feed.values()) { allEventIds.add(event.id); }

        // Decide which event ids we are not going to render in the feed
        // Don't render events that are tagging other events we are also going to render
        for (const event of $feed.values()) {
            if (skipEventIds.has(event.id)) { continue; }
            for (const tag of event.getMatchingTags("e")) {
                if (allEventIds.has(tag[1])) {
                    skipEventIds.add(event.id);
                    break;
                }
            }
        }

        const markLatestActivity = (event: NDKEvent, topNoteId: NDKEventId) => {
            const latestActivity = perNoteLatestActivity.get(topNoteId) ?? 0;

            if (event.created_at! > latestActivity)
                perNoteLatestActivity.set(topNoteId, event.created_at!);
        }

        for (const event of $feed.values()) {
            if (skipEventIds.has(event.id)) { continue; }
            if (event.kind === NDKKind.GroupNote || event.kind === NDKKind.Text) {
                topLevelNotes.set(event.id, event);
                markLatestActivity(event, event.id);
            } else if (event.kind === NDKKind.GroupReply) {
                event.getMatchingTags("e").forEach(tag => {
                    const parentId = tag[1];
                    markLatestActivity(event, parentId);
                });
            } else {
                topLevelNotes.set(event.id, event);
                markLatestActivity(event, event.id);
            }
        }

        // filter out events that are newer than the showEventsOlderThan date
        if (showEventsOlderThan) {
            for (const event of topLevelNotes.values()) {
                if (event.created_at!*1000 > showEventsOlderThan.getTime()) {
                    topLevelNotes.delete(event.id);
                    tooNewEvents.add(event.id);
                }
            }
        }

        return Array.from(topLevelNotes.values()).sort((a, b) => {
            const aLatest = perNoteLatestActivity.get(a.id) ?? 0;
            const bLatest = perNoteLatestActivity.get(b.id) ?? 0;

            return bLatest - aLatest;
        })
    });

    function openNote(e: CustomEvent<{event: NDKEvent, originalEvent: Event }>) {
        const isMobile = window.innerWidth < 640;
        if (isMobile) return;
        const { event, originalEvent } = e.detail;
        originalEvent.preventDefault();
        navigateToEvent(event);
    }
</script>

<div class="flex flex-col w-full justify-stretch">
    <div class="discussion-wrapper w-full flex flex-col">
        {#if tooNewEvents.size > 0}
            <div class="w-full flex flex-row items-center justify-center discussion-item transition-all duration-300 sticky top-0 z-50 ">
                <button class="w-fit whitespace-nowrap rounded-full bg-accent2 text-base-100-content p-4"
                    on:click={() => { showEventsOlderThan = new Date(); }}
                >
                    {tooNewEvents.size} new
                    {pluralize(tooNewEvents.size, "post")}
                </button>
            </div>
        {/if}
        {#each $renderFeed.slice(0, renderLimit) as event, i (event.id)}
            {#if event.kind === NDKKind.Text}
                <EventWrapper
                    {event}
                    mostRecentActivity={perNoteLatestActivity.get(event.id)}
                    skipReply={true}
                    showReply={false}
                    {urlPrefix}
                    on:click
                    on:open:note={openNote}
                    on:open:conversation={openNote}
                />
            {:else if event.kind === NDKKind.GroupNote}
                <GroupNote {event} {urlPrefix} />
            {:else if event.kind === NDKKind.Article}
                <ArticleLink
                    article={NDKArticle.from(event)}
                />
            {:else if event.kind === NDKKind.Highlight}
                <Highlight
                    highlight={NDKHighlight.from(event)}
                />
            {:else if event.kind === NDKKind.ArticleCurationSet}
                <CurationItem list={NDKList.from(event)} grid={false} />
            {:else}
                <EventWrapper
                    {event}
                    mostRecentActivity={perNoteLatestActivity.get(event.id)}
                    skipReply={true}
                    showReply={false}
                    {urlPrefix}
                />
            {/if}
        {/each}
    </div>

    <button class="opacity-0 h-0" on:click={() => { renderLimit++; }} use:inview on:inview_change={(e) => {
        if (e.detail.inView) {
            renderLimit += 10;
        }
    }}>
        load more
    </button>
</div>


<style lang="postcss">
    :global(.article p) {
        @apply font-light text-white text-opacity-60 text-lg leading-7;
    }
</style>
