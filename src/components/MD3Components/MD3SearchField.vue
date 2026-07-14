<script setup lang="ts">
const model = defineModel<string>({ default: '' });

defineProps<{
  placeholder?: string;
}>();
</script>

<template>
  <div class="search-wrapper">
    <span class="material-symbols-rounded search-icon">search</span>
    <input
      type="text"
      :placeholder="placeholder"
      v-model="model"
      class="search-input"
    />
  </div>
</template>

<style scoped>
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.search-icon {
  font-size: 1.5rem;
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
  user-select: none;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 3rem;
  font-size: 0.9375rem;
  padding: 0 1rem 0 3.25rem;
  border-radius: 9999px;
  border: none;
  outline: none;
  background-color: var(--md-sys-color-inverse-on-surface);
  color: var(--text-color);
  transition: background-color var(--transition-fast, 0.2s), box-shadow var(--transition-fast, 0.2s);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-input:focus {
  background-color: var(--surface-color);
  box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
}
</style>
