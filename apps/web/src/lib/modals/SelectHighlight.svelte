<script lang="ts">
	import Highlight from "$components/Highlight.svelte";
	import HighlightBody from "$components/HighlightBody.svelte";
    import ModalShell from "$components/ModalShell.svelte";
    import currentUser from "$stores/currentUser";
	import { closeModal } from "$utils/modal";
	import { ndk } from "@kind0/ui-common";
	import { NDKHighlight, NDKKind } from "@nostr-dev-kit/ndk";
	import { onDestroy } from "svelte";

    export let onSelect: (highlight: NDKHighlight) => void;

    let highlights = $ndk.storeSubscribe(
        { kinds: [NDKKind.Highlight], authors: [$currentUser!.pubkey] },
        undefined, NDKHighlight
    );

    onDestroy(() => {
        highlights.unsubscribe();
    });
</script>

<ModalShell color="glassy" class="max-w-3xl">
    <h1 class="text-base-100-content font-medium">
        Select a highlight to insert
    </h1>

    <div class="grid grid-cols-1 gap-4 mt-4 overflow-y-auto">
        {#if $highlights.length === 0}
            <p class="text-base-100-content">
                You don't have any highlights yet.
            </p>
        {:else}
            {#each $highlights as highlight}
                <button class="hover:bg-white/5" on:click={() => {
                    onSelect(highlight)
                    closeModal()
                }}>
                    <div class="text-left">
                        <HighlightBody skipHighlighter={true} {highlight} class="text-sm" />
                    </div>
                </button>
            {/each}
        {/if}
    </div>

    <div class="flex flex-row justify-end gap-4 mt-4">
        <button class="btn btn-primary" on:click={closeModal}>
            Close
        </button>
    </div>
</ModalShell>