<template>
  <div class="examples">
    <img id="示例列表" src="/logo/cherry-markdown-logo.svg" />
    <a class="header-anchor" :href="'#' + $props.name" aria-label="Permalink to &quot;示例列表&quot;"></a>
    <button id="示例" tabindex="-1" @click="openExamples"><span>{{ $props.name }}</span></button>
  </div>
</template>

<script setup>
const props = defineProps({
  url: String,
  name: String
})
const openExamples = () => window.open(props.url, '_blank');
</script>

<style scoped>
.examples {
  display: flex;
  align-items: center;
  font-size: 22px;
}

img {
  width: 18px;
  height: 18px;
}

button {
  margin: 12px 5px;
  font-size: 22px;
}

button span {
  color: var(--vp-c-brand);
}

button:hover {
 text-decoration: underline;
 text-decoration-color: var(--vp-c-brand);
}

.header-anchor {
  float: left;
  margin-left: -0.87em;
  padding-right: 0.23em;
  font-weight: 500;
  user-select: none;
  opacity: 0;
  transition: color 0.25s, opacity 0.25s;
}

.header-anchor:before {
  content: '#';
}
</style>
