<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <header class="page-header">
    <div class="header-inner">
      <div class="header-text-group">
        <h2 class="header-title-text">
          <slot name="title">{{ title }}</slot>
        </h2>
        <p v-if="subtitle || $slots.subtitle" class="header-subtitle-text">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
      <div v-if="$slots.actions" class="header-actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  padding: 2rem 2rem 0px 2rem;
  background-color: transparent;
  flex-shrink: 0;
  margin-top: 2.4rem;
}

:global(.dark) .page-header {
  background-color: transparent;
}

.header-inner {
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-text-group {
  display: flex;
  flex-direction: column;
}

.header-title-text {
  font-size: 2.4rem !important;
  font-weight: 800 !important;
  color: var(--text-color);
  letter-spacing: -0.01em;
  line-height: 1.2;
  padding-top: 24px;
}

.header-subtitle-text {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
  max-width: 42rem;
  line-height: 1.5;
}
</style>

