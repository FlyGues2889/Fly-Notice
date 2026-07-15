<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { NotificationItem, AppConfig } from '../types';
import { useI18n } from 'vue-i18n';
import MD3Card from './MD3Components/MD3Card.vue';

const props = defineProps<{
  processedNotifications: NotificationItem[];
  currentIndex: number;
  config: AppConfig;
  progressPercent?: number;
}>();

const emit = defineEmits<{
  (e: 'exit'): void;
}>();

const { t: translate } = useI18n();
const t = new Proxy({}, {
  get(target, prop) {
    if (typeof prop !== 'string') {
      return undefined;
    }

    if (prop.startsWith('__v_') || ['constructor', 'toJSON', 'prototype'].includes(prop)) {
      return undefined;
    }

    return translate(prop);
  }
}) as any;

const activeNotification = computed(() => props.processedNotifications[props.currentIndex]);

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('exit');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="fullscreen-overlay">
    <!-- Center Immersive Area -->
    <div class="center-immersive animate-fade-in">
      <MD3Card variant="transparent" no-padding class="fullscreen-card">
        <!-- Top Header inside Card (Window frame simulating monitor) -->
        <div class="card-header">
          <div class="header-left">
            <span v-if="processedNotifications.length > 0" class="notice-tag">
              {{ activeNotification?.title || t.untitled }}
            </span>
          </div>
          <div class="header-right">
            <span class="header-index">
              {{ processedNotifications.length > 0 ? `${currentIndex + 1}/${processedNotifications.length}` : '0/0' }}
            </span>
          </div>
        </div>

        <!-- Dynamic Display Area -->
        <div class="display-area">
          <div v-if="processedNotifications.length === 0" class="empty-display">
            <span class="material-symbols-rounded icon-empty select-none">info</span>
            <p class="empty-title">{{ t.noActiveNotice }}</p>
            <p class="empty-desc">
              {{ t.noActiveNoticeDesc }}
            </p>
          </div>
          
          <template v-else>
            <!-- Carousel navigation progress dots -->
            <div class="dots-nav">
              <div
                v-for="(_, idx) in processedNotifications"
                :key="idx"
                class="nav-dot"
                :class="idx === currentIndex ? 'active' : 'inactive'"
              />
            </div>

            <!-- Central Text Box -->
            <div class="text-box">
              <p class="notice-text" :style="{ fontSize: config.fontSize + 'rem' }">
                {{ activeNotification?.text }}
              </p>
            </div>
          </template>
        </div>
      </MD3Card>
    </div>

    <!-- Exit Fullscreen Button placed at bottom-right of the screen -->
    <button @click="emit('exit')" class="exit-btn" :title="t.exitFullscreen">
      <span class="material-symbols-rounded">fullscreen_exit</span>
    </button>
  </div>
</template>

<style scoped>
.fullscreen-overlay {
  /* Force dark mode variables */
  --bg-color: #1a1c1e;
  --surface-color: #202429;
  --surface-variant: #242a30;
  --text-color: #e2e2e6;
  --text-secondary: #c3c6cf;
  --text-tertiary: #8d9199;
  --primary: #9fcaff;
  --primary-hover: #7db4ff;
  --secondary: #bbc7db;
  --on-secondary: #253140;
  --secondary-container: #3b4858;
  --on-secondary-container: #d7e3f8;
  --border-color: #8d9199;
  --border-color-muted: #43474e;
  --error: #ffb4ab;
  --error-container: #93000a;
  --on-error-container: #ffb4ab;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 500;
  background-color: var(--bg-color);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  user-select: none;
  font-family: var(--font-sans);
}

.exit-btn {
  position: absolute;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 510;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background-color: var(--secondary-container);
  color: var(--on-secondary-container);
  border: 1px solid var(--border-color-muted);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.exit-btn .material-symbols-rounded {
  font-size: 1.5rem;
}

.exit-btn:hover {
  background-color: var(--secondary);
  color: var(--on-secondary, #ffffff);
  transform: scale(1.05);
}

.center-immersive {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* Identical Card style of dashboard carousel */
.fullscreen-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  border-radius: 0;
  border: none;
  overflow: hidden;
  box-shadow: none;
}

@media (min-width: 1024px) {
  .fullscreen-card {
    height: 100%;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem 0.5rem 1rem;
  background-color: transparent;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-index {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}

.display-area {
  position: relative;
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: transparent;
  overflow: hidden;
}

@media (min-width: 768px) {
  .display-area {
    padding: 1.5rem;
  }
}

.dots-nav {
  position: absolute;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.375rem;
}

.nav-dot {
  height: 6px;
  border-radius: 9999px;
  transition: all 0.3s ease;
}

.nav-dot.active {
  width: 24px;
  background-color: var(--primary);
}

.nav-dot.inactive {
  width: 6px;
  background-color: var(--border-color);
}

.text-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0;
  width: 100%;
  height: 100%;
}

.notice-tag {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--secondary);
  background-color: var(--secondary-container);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.notice-text {
  font-weight: 400;
  color: var(--text-color);
  line-height: 1.5;
  max-width: none;
  text-align: center;
  padding: 0;
  transition: all 0.5s ease;
  white-space: pre-wrap;
  text-align: left;
}

.notice-progress-wrapper {
  width: 100%;
  margin-top: auto;
  user-select: none;
  padding: 0 0.5rem;
}

.system-clock {
  font-size: 1.25rem;
  font-weight: 600;
  font-family: var(--font-mono);
  letter-spacing: 0.15em;
  color: var(--primary);
  opacity: 0.9;
}

@media (min-width: 768px) {
  .system-clock {
    font-size: 1.5rem;
  }
}

.empty-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 0;
}

.icon-empty {
  font-size: 3rem;
  color: var(--border-color);
  margin-bottom: 0.75rem;
}

.empty-title {
  color: var(--text-color);
  font-weight: 600;
}

.empty-desc {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
  max-width: 24rem;
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity var(--transition-slow);
}

.bottom-bar:hover {
  opacity: 1;
}

.indicator-text {
  font-size: 0.6875rem;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}
</style>
