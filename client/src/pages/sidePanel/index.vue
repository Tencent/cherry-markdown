<template>
  <transition name="side-panel">
    <div class="side-panel" v-show="storeSidePanel.isSidePanelOpen">
      <div class="side-panel__title">
        <div class="side-panel__title--left">
          <Icon :icon="storeSidePanel.checkedSidePanel.icon" />
          <span>{{ storeSidePanel.checkedSidePanel.name }}</span>
        </div>
        <Icon icon="icon-park-outline:left-bar" class="side-panel__title--right" @click="sidePanelChange" />
      </div>
      <div class="side-panel--operation-area">
        <Files />
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">
import Files from "./components/Files/index.vue";
import { Icon } from "@iconify/vue";
import { useStoreSidePanel } from "@/store/storeSidePanel";

const storeSidePanel = useStoreSidePanel();
const sidePanelChange = () => {
  storeSidePanel.isSidePanelOpen = false;
}

</script>
<style scoped lang="scss">
$side-panel-width: 400px;

.side-panel {
  height: 100%;
  width: $side-panel-width;

  &__title {
    font-size: 24px;
    margin: 5px 10px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #eaeaea;

    &--left {
      display: flex;
      align-items: center;

      svg {
        margin-right: 5px;
      }
    }

    &--right {
      cursor: pointer;

      &:hover {
        color: rgba(143, 194, 255, 0.8);
      }

      &:active {
        color: rgb(48, 141, 255);
      }
    }
  }

  &--operation-area {
    height: calc(100% - 50px);
    overflow-y: auto;
  }
}

.side-panel-enter-active {
  opacity: 0;
  animation: all .2s ease-in-out;
  animation-fill-mode: forwards;
  animation-delay: 0.1s;
}
</style>
