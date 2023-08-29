<template>
  <div class="side-panel">
    <div class="side-panel__header">
      <TagList :tags="tags" @check="tagListCheck"></TagList>
    </div>
    <div class="side-panel__content" v-show="tags.filter(i => i.value === 'fileDirectory')[0].isChecked">
      文件目录
    </div>
    <div class="side-panel__content" v-show="tags.filter(i => i.value === 'titleList')[0].isChecked">
      标题列表
    </div>
  </div>
</template>
<script setup lang="ts">
import TagList from "@/components/SidePanel/TagList/index.vue"
import { Tag } from "@/types";

import { ref } from "vue";
const tags = ref<Tag[]>([{
  label: '文件目录',  
  value: 'fileDirectory',
  isChecked: true
}, {
  label: '标题列表',
  value: 'titleList',
  isChecked: false
}])

const tagListCheck = (value: Tag[]) => {
  tags.value = value
}

</script>
<style scoped lang="scss">
.side-panel {
  min-width: 300px;
}
</style>