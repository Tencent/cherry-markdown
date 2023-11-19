<template>
  <div class="files" v-show="storeSidePanel.checkedSidePanel.id === 'files'">files //todo</div>
</template>
<script setup lang="ts">
import { useStoreSidePanel } from "@/store/storeSidePanel";

const storeSidePanel = useStoreSidePanel();
</script>
<style scoped lang="scss">
.files {
  width: 300px;
}
</style>