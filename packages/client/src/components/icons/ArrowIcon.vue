<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <path v-if="direction === 'down'" d="M7.41,8.59L12,13.17L16.59,8.59L18,10L12,16L6,10L7.41,8.59Z" />
    <path v-else-if="direction === 'up'" d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
    <path v-else-if="direction === 'left'" d="M15.41,7.41L14,6L8,12L14,18L15.41,16.59L10.83,12L15.41,7.41Z" />
    <path v-else-if="direction === 'right'" d="M8.59,16.59L10,18L16,12L10,6L8.59,7.41L13.17,12L8.59,16.59Z" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

withDefaults(defineProps<Props>(), {
  size: 12,
  direction: 'down',
});
</script>
