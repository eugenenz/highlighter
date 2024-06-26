<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Hexpubkey, NDKEvent, NDKHighlight, NDKUser } from '@nostr-dev-kit/ndk';
	import AvatarWithName from './User/AvatarWithName.svelte';
    import { Avatar } from '@kind0/ui-common';
	import HighlightIcon from '$icons/HighlightIcon.svelte';

    export let title: string;
    export let image: string;
    export let author: string | NDKUser;
    export let description: string | undefined;
    export let href: string | undefined = undefined;
    export let highlights: NDKHighlight[] | undefined = undefined;

    let hover = false;

    const highlighters = new Set<Hexpubkey>();

    $: if (highlights) highlights.forEach(h => highlighters.add(h.pubkey));
</script>

<div class="flex flex-col gap-2">
    <a {href} class="w-[260px] h-[360px] overflow-clip flex-none rounded-box group"
        on:mouseenter={() => hover = true}
        on:mouseleave={() => hover = false}
    >
        <div class="relative w-full h-full items-stretch flex flex-col">
            <img
                alt=""
                src={image}
                class="
                    w-full h-full object-cover top-0 left-0 right-0 bottom-0 absolute
                    z-[1]
                "
            />
            <div class="absolute top-0 left-0 right-0 bottom-0 z-[2] bg-black bg-opacity-50 w-full h-full backdrop-blur-3xl group-hover:backdrop-blur-[0px] transition-all duration-300 rounded-box"></div>

            <div class="grow relative w-full rounded-box overflow-clip z-[3] p-4">
                <h3 class="font-medium grow max-h-[64px] overflow-clip text-white text-xl truncate">
                    {title}
                </h3>
                <div class="text-sm text-zinc-500 font-normal truncate pt-2 place-self-end">
                    {#if author instanceof NDKUser}
                        <AvatarWithName user={author} avatarSize="tiny" avatarType="square" />
                    {:else}
                        {author}
                    {/if}
                </div>
                {#if description}
                    <div class="text-sm text-zinc-300 pt-4 overflow-clip grow" transition:slide={{axis: 'y', duration: 500}}>
                        {description}
                    </div>
                {/if}
            </div>

            {#if highlights}
                <div class="z-[5] m-4 flex flex-row flex-nowrap items-center gap-2 bg-base-300 px-3 py-1 rounded-full text-base-100-content !w-fit text-xs group">
                    <HighlightIcon class="w-5 h-5 text-base-100-content opacity-60" />
                    {highlights.length}
                    <div class="flex flex-row flex-nowrap -space-x-4 group-hover:space-x-0">
                        {#each Array.from(highlighters) as highlighter (highlighter)}
                            <Avatar pubkey={highlighter} size="tiny" class="transition-all duration-300" />
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </a>
</div>