<template>
  <div class="home">
    <SideTagList />
    <SidePanel v-show="isShowSidePanel" />
    <CherryMarkdown />
  </div>
</template>
<script setup lang="ts">
import CherryMarkdown from "@/components/CherryMarkdown/index.vue"
import SidePanel from "@/pages/sidePanel/index.vue"
import SideTagList from "@/pages/sidePanel/tagList.vue"
import { ipcRenderer } from "electron";
import { ref } from "vue";

const isShowSidePanel = ref(true);
ipcRenderer.on('show-directory-panel', () => isShowSidePanel.value = !isShowSidePanel.value);
</script>

<style scoped lang="scss">
.home {
  display: flex;
  height: 100%;
}
</style>