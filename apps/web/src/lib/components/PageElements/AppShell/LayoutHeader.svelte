<script lang="ts">
	import SearchBar from "$components/Page/SearchBar.svelte";
	import { pageHeader } from "$stores/layout";
	import HeaderLeftButton from "../HeaderLeftButton.svelte";
	import HeaderRightButton from "../HeaderRightButton.svelte";

    const hasSidebar = true;

    let render = false;

    $: render = !!($pageHeader?.component || $pageHeader?.searchBar || $pageHeader?.title || $pageHeader?.left || $pageHeader?.right);
</script>

{#if render}
<div class="h-[var(--layout-header-height)]"></div>

<div class="
    !fixed top-0 h-[var(--layout-header-height)]
    z-40
    mobile-nav
    w-full
    {$$props.class??""}
">
    <div class="flex flex-row justify-between items-center h-full w-full gap-2">
        {#if $pageHeader?.component}
            <div class="sm:p-4 w-full">
                <svelte:component this={$pageHeader.component} {...$pageHeader.props} />
            </div>
        {:else if $pageHeader?.searchBar}
            <div class="
                max-w-3xl w-full
                {!hasSidebar ? "mx-auto" : ""}
            ">
                <SearchBar inputClass="focus:!outline-none focus:!border-none" />
            </div>
        {:else}
            <div class="flex items-center justify-between px-4 w-full">
                {#if $pageHeader?.left}
                    <div class="
                        {hasSidebar ?
                            "md:hidden" :
                            ""}
                    ">
                        <HeaderLeftButton />
                    </div>
                {/if}

                <!-- If we have a sidebar, don't show the title on desktop -->
                {#if $pageHeader?.title}
                    <div class="
                        flex flex-row
                        items-center
                        justify-center
                        text-white
                        font-medium
                        gap-2
                        w-full
                        col-span-5
                        text-center
                    ">
                        <span class="truncate">{$pageHeader?.title}</span>
                    </div>
                {/if}

                {#if $pageHeader?.right}
                    <HeaderRightButton />
                {/if}
            </div>
        {/if}
        <div class="w-10"></div>
    </div>
</div>
{/if}