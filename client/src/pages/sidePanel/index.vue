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
      <Toc />
      <Files />
    </div>
  </transition>
</template>
<script setup lang="ts">
import Files from "./components/Files/index.vue";
import Toc from "./components/Toc/index.vue";
import { Icon } from "@iconify/vue";
import { useStoreSidePanel } from "@/store/storeSidePanel";

const storeSidePanel = useStoreSidePanel();
const sidePanelChange = () => {
  storeSidePanel.isSidePanelOpen = false;
}

</script>
<style scoped lang="scss">
.side-panel {
  height: 100%;
  width: 380px;
  overflow: hidden;
  overflow-y: auto;

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
}

.side-panel-enter-active {
  animation: side-panel-enter 0.3s;
}

.side-panel-leave-active {
  animation: side-panel-leave 0.3s;
}

@keyframes side-panel-enter {
  0% {
    opacity: 0;
  }

  30% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}

@keyframes side-panel-leave {
  0% {
    opacity: 1;
  }

  30% {
    opacity: 0.5;
  }

  100% {
    opacity: 0;
  }
}
</style>
