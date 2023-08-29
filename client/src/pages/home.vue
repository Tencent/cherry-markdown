<template>
  <div class="home">
    <SidePanel v-show="isShowSidePanel" />
    <CherryMarkdown />
  </div>
</template>
<script setup lang="ts">
import CherryMarkdown from "@/components/CherryMarkdown/index.vue"
import SidePanel from "@/components/SidePanel/index.vue"
import { ipcRenderer } from "electron";
import { ref } from "vue";

const isShowSidePanel = ref(true)

ipcRenderer.on('show-directory-panel', () => isShowSidePanel.value = !isShowSidePanel.value)
</script>

<style scoped lang="scss">
.home {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>