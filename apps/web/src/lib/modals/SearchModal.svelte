<script lang="ts">
	import { goto } from "$app/navigation";
	import ItemLink from "$components/Events/ItemLink.svelte";
	import Input from "$components/Forms/Input.svelte";
    import ModalShell from "$components/ModalShell.svelte";
	import AvatarWithName from "$components/User/AvatarWithName.svelte";
	import { userFollows } from "$stores/session";
	import { vanityUrls, vanityUrlsByPubkey } from "$utils/const";
	import { closeModal } from "$utils/modal";
	import { getNip50RelaySet } from "$utils/ndk";
	import { SearchResult } from "$utils/search";
	import { searchUser } from "$utils/search/user";
	import { Avatar, Name, ndk } from "@kind0/ui-common";
	import { NDKArticle, NDKKind } from "@nostr-dev-kit/ndk";
	import { ArrowRight, Check, CheckCircle, MagnifyingGlass, UserCircleCheck } from "phosphor-svelte";
	import { SvelteComponent } from "svelte";

    export let value: string = "";

    type SearchMode = 'all' | 'articles';
    type SearchResultWithUrl = SearchResult & { url: string };
    type SearchOption = { searchMode?: SearchMode, id: string, icon: SvelteComponent, label: string, fn: () => Promise<void> };

    let results: (SearchResultWithUrl | SearchOption)[] = [];
    let selectedItem = 0;
    let searchMode: SearchMode = 'all';

    let searching = false;

    async function users() {
        const res = await searchUser(value, $ndk, $userFollows);
        for (const user of res) {
            let url = `/${user.nip05}`;

            if (vanityUrlsByPubkey[user.id]) {
                url = vanityUrlsByPubkey[user.id];
            }
            
            results.push({type: 'user', result: user, url, id: user.id});
        }

        results = results;
    }

    async function highlightUrl() {
        goto(`/load?url=${encodeURIComponent(value)}`);
    }
    
    async function searchArticle() {
        searching = true;
        results = [];
        searchMode = 'articles';
        const res = await $ndk.fetchEvents([
            {kinds: [NDKKind.Article], limit: 10, search: value}
        ], undefined, getNip50RelaySet());

        for (const event of res) {
            console.log(event.rawEvent());
            results.push({ type: "event", result: NDKArticle.from(event), url: `/a/${event.encode()}`, id: event.id });
        }

        searching = false;

        results = results;
    }
    
    async function keydown(event: KeyboardEvent) {
        if (value.length === 0) {
            searchMode = 'all';
            results = [];
            return;
        }
        
        if (event.key === "Enter") {
            const selected = results[selectedItem];
            if (selected) {
                if (selected.url) {
                    closeModal();
                    goto(selected.url);
                } else if (selected.fn) {
                    await selected.fn();
                }
            }
        } else if (event.key === "ArrowDown") {
            selectedItem = Math.min(selectedItem + 1, results.length - 1);
            // scroll to selected item
            document.querySelector(`li:nth-child(${selectedItem + 1})`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            
        } else if (event.key === "ArrowUp") {
            selectedItem = Math.max(selectedItem - 1, 0);

            document.querySelector(`li:nth-child(${selectedItem - 1})`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        } else if (event.key.match(/[a-zA-Z0-9]/)) {
            results = [];

            // is URI
            if (isUri()) {

            } else {
                if ( searchMode === 'all') await users();
                results.push({ id: 'search-articles', label: `Search articles with '${value}'`, fn: searchArticle });
            }

            results = results;
        }
    }

    function isUri() {
        try {
            new URL(value);
            results.push({ id: 'highlight-url', icon: ArrowRight, label: `Highlight '${value}'`, fn: highlightUrl });
            return true;
        } catch {
            return false;
        }
    }

    let renderedResults: (SearchResultWithUrl | SearchOption)[] = [];
    $: {
        renderedResults = results.slice(0, 10);
        for (const result of results.slice(11, -1)) {
            if (result.fn) renderedResults.push(result);
        }
        renderedResults = renderedResults;
    }
</script>

<ModalShell color="glassy" class="max-w-2xl w-full lg:max-h-[70vh] !gap-0">
    <div class="flex flex-row gap-2 w-full items-center">
        {#if searching}
            <span class="loading loading-sm text-accent2"></span>
        {:else}
            <MagnifyingGlass class="w-8 h-8 text-neutral-500" />
        {/if}
        
        <Input
            color="black"
            bind:value
            placeholder="Search"
            autofocus={true}
            class="bg-transparent w-full border-none text-xl"
            on:keyup={keydown}
        />
    </div>

    {#if value.length > 0}
        <ul class="flex flex-col items-start grow overflow-y-auto w-full pt-6">
            {#each renderedResults as {type, icon, label, result, id, fn}, i (id + i)}
                {#if type === "user"}
                    <li class:selected={i === selectedItem}>
                        <a href="/{result.nip05}" class="flex flex-row gap-2 items-center">
                            <AvatarWithName userProfile={result.profile} avatarSize="small" />
                            {#if result.followed}
                                <UserCircleCheck class="w-6 h-6 text-accent2" />
                            {/if}
                        </a>
                    </li>
                {:else if type === "event"}
                    <li class:selected={i === selectedItem}>
                        <ItemLink event={result} />
                    </li>
                {:else if fn}
                    <li class:selected={i === selectedItem}>
                        <button on:click={fn}>
                            {#if icon}
                                <svelte:component this={icon} class="w-6 h-6 mr-2 inline" />
                            {/if}
                            {label}
                        </button>
                    </li>
                {/if}
            {/each}
        </ul>
    {/if}
</ModalShell>

<style lang="postcss">
    li {
        @apply p-2 px-4 w-full rounded-lg;
    }
    
    li.selected, li:hover {
        @apply bg-base-300;
    }
</style>