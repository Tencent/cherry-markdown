<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <path v-if="expanded" d="M19,13H5V11H19V13Z"/>
    <path v-else d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number;
  expanded?: boolean;
}

withDefaults(defineProps<Props>(), {
  size: 14,
  expanded: false
});
</script>