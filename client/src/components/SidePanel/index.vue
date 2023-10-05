<template>
  <div class="side-panel">
    <TagList class="tag-list" :tags="tags" @check="tagListCheck" />
    <div class="side-panel__item" v-show="tags.find(i => i.value === 'fileDirectory')?.isChecked">
      文件目录
    </div>
    <div class="side-panel__item" v-show="tags.find(i => i.value === 'titleList')?.isChecked">
      <div class="side-panel__toc__item" v-for="item in  storeCherry.cherryToc " :key="item.id"
        :style="{ fontSize: 22 - item.level + 'px' }">
        <span class="toc-level" :style="{ marginLeft: 4 * item.level - 1 + 'px' }">{{ `h${item.level} ` }}</span>
        <div class="toc-text" v-html="item.text"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import TagList from "@/components/SidePanel/TagList/index.vue"
import { useStoreCherry } from "@/store/storeCherry";
import { Tag } from "@/types";
import { ref } from "vue";

const storeCherry = useStoreCherry();
const tags = ref<Tag[]>([{
  label: '文件目录',
  value: 'fileDirectory',
  isChecked: true
}, {
  label: '标题列表',
  value: 'titleList',
  isChecked: false
}])

const tagListCheck = (value: Tag[]) => tags.value = value;

</script>
<style scoped lang="scss">
.side-panel {
  background-color: rgb(240, 240, 240);
  width: 350px;
  display: flex;
  flex-direction: column;

  &__item {
    width: 350px;
    overflow: hidden;
    overflow-y: auto;
  }

  &__toc__item {
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
