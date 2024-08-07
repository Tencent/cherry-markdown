<template>
  <div class="side-tag-list">
    <div v-for="tag in sideTagList" @click="checkTag(tag)">
      <Icon :icon="tag.icon" :style="{ color: tag.color, fontSize: tag.size + 'px' }" class="side-tag-list__item" :class="[storeSidePanel.checkedSidePanel.id === tag.id && storeSidePanel.isSidePanelOpen ?
        'side-tag-list__item--checked' : 'side-tag-list__item--unchecked']" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useStoreSidePanel } from "@/store/storeSidePanel";
import { CheckedSidePanelType } from "@/types";
const storeSidePanel = useStoreSidePanel();
const sideTagList = [
  {
    id: 'files',
    name: "文件目录",
    icon: "ph:files-bold",
    color: "#000000",
    size: 32,
  },
]

const checkTag = (tag: CheckedSidePanelType) => {
  storeSidePanel.checkedSidePanel = tag;
  storeSidePanel.isSidePanelOpen = true;
}


</script>
<style scoped lang="scss">
.side-tag-list {
  border-right: 1px solid #eaeaea;
  padding: 5px 0;

  &__item {
    cursor: pointer;
    padding: 5px;

    &--checked {
      box-shadow: rgba(50, 50, 93, 0.25) 0px 50px 100px -20px,
        rgba(0, 0, 0, 0.3) 0px 30px 60px -30px,
        rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset;
      border-radius: 3px;
      transition: box-shadow 0.3s ease-in-out;
    }

    &--unchecked {
      box-shadow: none;
      transition: box-shadow 0.5s ease;
    }
  }
}

@keyframes unchecked {
  0% {
    box-shadow: rgba(50, 50, 93, 0.25) 0px 50px 100px -20px,
      rgba(0, 0, 0, 0.3) 0px 30px 60px -30px,
      rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset;
  }

  100% {
    box-shadow: none;
  }

}
</style>