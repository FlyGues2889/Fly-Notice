<script setup lang="ts">
import { computed } from 'vue';
import { NotificationItem, AppConfig } from '../types';
import { useI18n } from 'vue-i18n';
import WavyProgressBar from './WavyProgressBar.vue';
import MD3Slider from './MD3Components/MD3Slider.vue';
import MD3Card from './MD3Components/MD3Card.vue';

const props = defineProps<{
  notifications: NotificationItem[];
  config: AppConfig;
  processedNotifications: NotificationItem[];
  currentIndex: number;
  progressPercent: number;
  isPlaying: boolean;
}>();

const emit = defineEmits<{
  (e: 'config-change', newConfig: Partial<AppConfig>): void;
  (e: 'index-change', index: number): void;
  (e: 'play-pause'): void;
  (e: 'fullscreen'): void;
}>();

const currentItem = computed(() => props.processedNotifications[props.currentIndex]);
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
const isDark = computed(() => props.config.themeMode === 'dark' || (props.config.themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches));

const triggerPrev = () => {
  if (props.processedNotifications.length === 0) return;
  const prev = (props.currentIndex - 1 + props.processedNotifications.length) % props.processedNotifications.length;
  emit('index-change', prev);
};

const triggerNext = () => {
  if (props.processedNotifications.length === 0) return;
  const next = (props.currentIndex + 1) % props.processedNotifications.length;
  emit('index-change', next);
};
</script>

<template>
  <div class="carousel-container">
    
    <!-- 1. SINGLE LARGE CARD for Notification Content -->
    <div class="card-wrapper">
      <MD3Card variant="outlined" no-padding class="dashboard-carousel-card">
        
        <!-- Top Header inside Card (Window frame simulating monitor) -->
        <div class="card-header">
          <div class="header-left">
            <span class="header-index">
              {{ processedNotifications.length > 0 ? `${currentIndex + 1}/${processedNotifications.length}` : '0/0' }}
            </span>
            <span v-if="processedNotifications.length > 0" class="notice-tag">
              {{ currentItem?.title || t.untitled }}
            </span>
          </div>
          <div class="header-right">
            <WavyProgressBar :progressPercent="props.processedNotifications.length > 0 ? props.progressPercent : 0" />
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
            <!-- Central Text Box -->
            <div class="text-box">
              <p class="notice-text" :style="{ fontSize: config.fontSize + 'rem' }">
                {{ currentItem?.text }}
              </p>
            </div>
          </template>
        </div>
      </MD3Card>
    </div>

    <!-- 2. BLANK LOWER ROW: Left controls (size, speed), Right controls (actions) -->
    <div class="lower-row">
      
      <!-- LEFT COLUMN: Controls in the blank background (NO cards) -->
      <div class="controls-col">
        
        <!-- Display Font Size -->
        <div class="control-item">
          <div class="control-header">
            <span class="control-label">
              <span class="material-symbols-rounded icon-size">format_size</span>
              {{ t.displayTextSize }}
            </span>
            <span class="control-value">
              {{ Number(config.fontSize).toFixed(1) }}rem
            </span>
          </div>
          <div class="slider-container">
            <MD3Slider
              variant="m"
              :min="1.0"
              :max="4.0"
              :step="0.1"
              :model-value="config.fontSize"
              @update:model-value="(val) => emit('config-change', { fontSize: val })"
            />
          </div>
        </div>

        <!-- Carousel Interval Speed -->
        <div class="control-item">
          <div class="control-header">
            <span class="control-label">
              <span class="material-symbols-rounded icon-clock">schedule</span>
              {{ t.globalCarouselInterval }}
            </span>
            <span class="control-value">
              {{ config.carouselSpeedSecs }}s
            </span>
          </div>
          <div class="slider-container">
            <MD3Slider
              variant="m"
              :min="1"
              :max="30"
              :step="1"
              :model-value="config.carouselSpeedSecs"
              @update:model-value="(val) => emit('config-change', { carouselSpeedSecs: val })"
            />
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: Playback actions & fullscreen on the right -->
      <div class="actions-col">
        
        <!-- Button Group for manual controls and play/pause -->
        <div class="m3-controls-group">
          <!-- Previous Notice -->
          <button
            @click="triggerPrev"
            :disabled="processedNotifications.length <= 1"
            class="btn-capsule"
            :title="t.prevNoticeTitle"
          >
            <span class="material-symbols-rounded-fill icon-control">skip_previous</span>
          </button>

          <!-- Play / Pause Toggle Button -->
          <button
            @click="emit('play-pause')"
            :disabled="processedNotifications.length === 0"
            class="btn-play"
            :class="{ 'is-playing': isPlaying }"
            :title="isPlaying ? (config.language === 'zh' ? '暂停' : 'Pause') : (config.language === 'zh' ? '播放' : 'Play')"
          >
            <span v-if="isPlaying" class="material-symbols-rounded icon-play-pause">lock</span>
            <span v-else class="material-symbols-rounded-fill icon-play-pause">no_encryption</span>
          </button>

          <!-- Next Notice -->
          <button
            @click="triggerNext"
            :disabled="processedNotifications.length <= 1"
            class="btn-capsule"
            :title="t.nextNoticeTitle"
          >
            <span class="material-symbols-rounded-fill icon-control">skip_next</span>
          </button>
        </div>

        <!-- Spacer -->
        <span class="divider-line"></span>

        <!-- Fullscreen Button -->
        <button
          @click="emit('fullscreen')"
          class="btn-round"
          :title="t.fullscreen"
        >
          <span class="material-symbols-rounded icon-control">fullscreen</span>
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
.carousel-container {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  height: 100%;
}

@media (min-width: 768px) {
  .carousel-container {
    gap: 1.25rem;
  }
}

.card-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  width: 100%;
  padding: 0.5rem 0;
}

.dashboard-carousel-card {
  width: 100%;
}

@media (min-width: 768px) {
  .dashboard-carousel-card {
    width: 100%;
    height: 100%;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 0.75rem;
  background-color: transparent;
  flex-shrink: 0;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .card-header {
    padding: 0 1rem;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.dot-container {
  display: flex;
  gap: 0.375rem;
}

.window-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--border-color);
}

.header-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: var(--font-mono);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 32%;
  flex: 0 0 32%;
  justify-content: flex-end;
}

.script-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  background-color: var(--primary-container);
  color: var(--on-primary-container);
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid var(--border-color-muted);
}

.icon-sparkles {
  font-size: 0.75rem;
  color: var(--primary);
}

.header-index {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}

.display-area {
  position: relative;
  flex: 1;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: rgba(128, 128, 128, 0.02);
  overflow: hidden;
}

@media (min-width: 768px) {
  .display-area {
    padding: 1rem;
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
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.notice-text {
  font-weight: 400;
  color: var(--text-color);
  line-height: 1.5;
  width: 100%;
  height: 100%;
  max-width: none;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0;
  transition: all 0.5s ease;
}

/* Font size mapping system */
.size-xs { font-size: 1rem; }
.size-sm { font-size: 1.125rem; }
.size-base { font-size: 1.25rem; }
.size-lg { font-size: 1.5rem; }
.size-xl { font-size: 1.75rem; }
.size-2xl { font-size: 2rem; }
.size-3xl { font-size: 2.25rem; }
.size-4xl { font-size: 2.5rem; }
.size-5xl { font-size: 3rem; }
.size-6xl { font-size: 3.5rem; }

@media (min-width: 768px) {
  .size-xs { font-size: 1.125rem; }
  .size-sm { font-size: 1.25rem; }
  .size-base { font-size: 1.5rem; }
  .size-lg { font-size: 1.75rem; }
  .size-xl { font-size: 2rem; }
  .size-2xl { font-size: 2.25rem; }
  .size-3xl { font-size: 2.5rem; }
  .size-4xl { font-size: 3rem; }
  .size-5xl { font-size: 3.5rem; }
  .size-6xl { font-size: 4rem; }
}

.notice-progress-wrapper {
  width: 100%;
  margin-top: auto;
  user-select: none;
  padding: 0 0.5rem;
}

.lower-row {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.5rem;
  color: var(--text-secondary);
  width: 100%;
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .lower-row {
    flex-direction: row;
    align-items: center;
  }
}

.controls-col {
  flex: 1;
  display: grid;
  grid-template-cols: 1fr;
  gap: 0.875rem;
  max-width: 42rem;
}

@media (min-width: 768px) {
  .controls-col {
    grid-template-cols: 1fr 1fr;
    gap: 1.25rem;
  }
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.control-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-label {
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--secondary);
}

.icon-size, .icon-clock {
  font-size: 1rem;
  color: var(--secondary);
}

.control-value {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--secondary);
  text-transform: uppercase;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
}

.range-slider {
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  transition: background var(--transition-fast);
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  transition: transform 0.1s;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.range-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  transition: transform 0.1s;
}

.range-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.actions-col {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.875rem;
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .actions-col {
    justify-content: flex-end;
  }
}

.btn-round {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  background-color: var(--surface-variant);
  border: none;
  color: var(--secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-round:hover:not(:disabled), .btn-round:focus-visible:not(:disabled) {
  background-color: rgba(var(--md-sys-color-primary-rgb), 0.12);
  color: var(--primary);
  border-radius: 35%;
  outline: none;
}

.btn-round:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-round .material-symbols-rounded {
  font-size: 24px;
}

.icon-control {
  font-size: 24px;
}

/* Cohesive Capsule Button Group */
.m3-controls-group {
  display: flex;
  align-items: center;
  gap: 8px; /* 8px gap between buttons */
  height: 4.2rem;
}

.btn-capsule {
  width: 3.2rem; /* Width increased */
  height: 4.2rem; /* Height increased to match the play/pause button */
  border-radius: 1.6rem; /* Capsule/stadium shape */
  background-color: var(--surface-variant);
  border: none;
  color: var(--secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.btn-capsule:hover:not(:disabled), .btn-capsule:focus-visible:not(:disabled) {
  background-color: rgba(var(--md-sys-color-primary-rgb), 0.12);
  color: var(--primary);
  border-radius: 1.25rem;
  outline: none;
}

.btn-capsule:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-play {
  width: 4.2rem; /* Enlarged */
  height: 4.2rem; /* Enlarged */
  border-radius: 50% !important; /* Perfect circle */
  background-color: var(--tertiary);
  border: none;
  color: var(--on-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
}

.btn-play.is-playing {
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);

  border-radius: 35% !important;
}

.btn-play:focus, .btn-play:focus-visible, .btn-play:active:not(:disabled) {
  outline: none;
}

.btn-play:hover:not(:disabled), .btn-play:focus-visible:not(:disabled) {
  opacity: 0.95;
}

.btn-play:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-play-pause {
  font-size: 28px;
}

.icon-play {
  margin-left: 2px;
}

.divider-line {
  height: 1.5rem;
  width: 1px;
  background-color: var(--border-color);
  margin: 0 0.25rem;
}

.header-right{
  positon:absolute;
  right:0;
  top:0
}
</style>
