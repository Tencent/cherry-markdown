<template>
  <div class="tag-list">
    <div :class="['tag-list__item', tag.isChecked ? 'tag-list__item--checked' : '']" v-for="tag in  tags" :key="tag.value"
      @click="handCheck(tag)">
      {{ tag.label }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { PropType, ref } from 'vue'
import { Tag } from "@/types";
const props = defineProps({
  tags: {
    type: Array as PropType<Tag[]>,
    required: true
  }
})
const tags = ref<Tag[]>(props.tags)

const emit = defineEmits<{
  (event: 'check', tags: Tag[]): void
}>()

const handCheck = (tag: Tag) => {
  tags.value.map(item => (item.isChecked = item.value === tag.value))
  emit('check', tags.value)
}

</script>
<style scoped lang="scss">
.tag-list {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  text-align: center;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, .1);
}

.tag-list__item {
  flex: 1;
  padding: 4px;
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
  background-color: #efefef;
  border: 1px solid #63636306;

  &:hover {
    border: 1px solid #63636380;
    color: #000000;
  }
}

.tag-list__item--checked {
  background-color: #898989;
  border: 1px solid #4e4e4e4e;
  color: #fff;
}
</style>