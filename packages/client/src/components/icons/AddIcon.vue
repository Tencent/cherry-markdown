<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number;
}

withDefaults(defineProps<Props>(), {
  size: 16
});
</script>