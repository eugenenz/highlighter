<script lang="ts">
	import { NDKArticle, NDKHighlight, type NDKTag, type NDKUserProfile } from "@nostr-dev-kit/ndk";
	import ArticleCard from "./ArticleCard.svelte";
	import { ndk } from "@kind0/ui-common";
	import UserProfile from "./User/UserProfile.svelte";
	import { urlFromEvent, urlSuffixFromEvent } from "$utils/url";

    export let tag: NDKTag;
    export let highlights: NDKHighlight[] = [];

    let article: NDKArticle;

    let url: string;
    let authorUrl: string;
    
    $ndk.fetchEvent(tag[1]).then(event => {
        if (event) {
            article = NDKArticle.from(event);
        }
    });

    $: if (article) {
        const suffix = urlSuffixFromEvent(article);
        if (authorUrl && suffix.length > 0)
            url = [authorUrl, suffix].join('/')
        else
            url = `a/${article.encode()}`
    }
</script>

{#if article}
    <UserProfile user={article.author} let:userProfile bind:authorUrl>
        <ArticleCard
            title={article.title}
            image={article.image ?? userProfile?.image}
            description={article.summary}
            author={article.author}
            href={urlFromEvent(article)}
            {highlights}
        />
    </UserProfile>
{/if}