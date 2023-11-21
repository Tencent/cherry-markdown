<template>
  <div class="toc" v-show="storeSidePanel.checkedSidePanel.id === 'toc'">
    <div class="toc__item" v-for="item in  storeCherry.cherryToc " :key="item.id"
      :style="{ fontSize: 22 - item.level + 'px' }">
      <span class="toc-level" :style="{ marginLeft: 4 * item.level - 1 + 'px' }">{{ `h${item.level} ` }}</span>
      <div class="toc-text" v-html="item.text"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useStoreCherry } from "@/store/storeCherry";
import { useStoreSidePanel } from "@/store/storeSidePanel";

const storeCherry = useStoreCherry();
const storeSidePanel = useStoreSidePanel();
</script>

<style scoped lang="scss">
.toc {
  width: 300px;

  &__item {


    user-select: none;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #9a9a9a;
    margin: 12px;

    .toc-text {
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      position: relative;

      &:hover {
        color: #00a2ff96;
      }

      &:active {
        color: #00a2ff;
      }
    }

    .toc-level {
      margin: 0 5px;
      color: #182a00;
      font-size: 12px;
    }
  }
}

:deep(.anchor) {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
</style>