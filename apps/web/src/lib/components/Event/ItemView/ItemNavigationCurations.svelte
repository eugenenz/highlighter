<script lang="ts">
	import ButtonWithCount from "$components/buttons/ButtonWithCount.svelte";
	import AddToCuration from "$modals/AddToCuration.svelte";
	import { getCurationKindForEvent } from "$utils/curations";
	import { openModal } from "$utils/modal";
	import { ndk } from "@kind0/ui-common";
    import { NDKEvent } from "@nostr-dev-kit/ndk";
	import { BookmarkSimple } from "phosphor-svelte";
	import { onDestroy } from 'svelte';

    export let event: NDKEvent;
    export let href: string;

    const curations = $ndk.storeSubscribe({
        kinds: [ getCurationKindForEvent(event) ], ...event.filter()
    });

    console.log({kinds: [ getCurationKindForEvent(event) ], ...event.filter()});

    onDestroy(() => curations.unsubscribe());

    let bookmarked = false;
</script>

<div class="flex flex-row py-2">
    <button class="pl-4 pr-2 py-1 rounded-l-full bg-base-300 hover:bg-white/10 join-item" on:click={() => openModal(AddToCuration, {event})}>
        <BookmarkSimple
            class="w-7 h-7
                {bookmarked ? 'text-accent' : ''}
            " weight={bookmarked ? "fill" : "regular"}
        />
    </button>
    <ButtonWithCount
        badge={true}
        count={$curations.length}
        label="Curations"
        {href}
        class="pr-4 pl-2 join-item bg-base-200 rounded-r-full hover:bg-white/10"
    />
</div>