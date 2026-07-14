<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { NotificationItem, AppConfig } from '../types';
import { useI18n } from 'vue-i18n';
import MD3Switch from './MD3Components/MD3Switch.vue';
import MD3List from './MD3Components/MD3List.vue';
import MD3ListItem from './MD3Components/MD3ListItem.vue';
import MD3Slider from './MD3Components/MD3Slider.vue';
import MD3Snackbar from './MD3Components/MD3Snackbar.vue';
import MD3TextField from './MD3Components/MD3TextField.vue';
import MD3Card from './MD3Components/MD3Card.vue';

const props = defineProps<{
  notification: NotificationItem | null;
  config: AppConfig;
}>();

const emit = defineEmits<{
  (e: 'save', item: Omit<NotificationItem, 'id' | 'createdAt'> & { id?: string }): void;
  (e: 'cancel'): void;
}>();

const { t: translate } = useI18n();
const t = computed(() => {
  return new Proxy({}, {
    get(target, prop) {
      if (typeof prop === 'string') {
        return translate(prop);
      }
      return undefined;
    }
  }) as any;
});
const isDark = computed(() => props.config.themeMode === 'dark' || (props.config.themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches));

const title = ref('');
const text = ref('');
const durationSecs = ref(5);
const useCustomDuration = ref(false);
const isActive = ref(true);
const toastMessage = ref<string | null>(null);

watch(
  () => props.notification,
  (newVal) => {
    if (newVal) {
      title.value = newVal.title;
      text.value = newVal.text;
      isActive.value = newVal.isActive;
      if (newVal.durationSecs && newVal.durationSecs > 0) {
        durationSecs.value = newVal.durationSecs;
        useCustomDuration.value = true;
      } else {
        durationSecs.value = 5;
        useCustomDuration.value = false;
      }
    } else {
      title.value = '';
      text.value = '';
      durationSecs.value = 5;
      useCustomDuration.value = false;
      isActive.value = true;
    }
    toastMessage.value = null;
  },
  { immediate: true }
);

const handleSubmit = () => {
  if (!text.value.trim()) {
    toastMessage.value = t.value.formErrorTextRequired;
    return;
  }
  
  const finalDurationSecs = useCustomDuration.value ? Math.round(durationSecs.value) : 0;
  if (useCustomDuration.value && finalDurationSecs < 1) {
    toastMessage.value = t.value.formErrorDuration;
    return;
  }

  emit('save', {
    title: title.value.trim(),
    text: text.value.trim(),
    durationSecs: finalDurationSecs,
    colorAccent: 'indigo',
    isActive: isActive.value,
    ...(props.notification ? { id: props.notification.id } : {})
  });
};
</script>

<template>
  <MD3Card variant="outlined">
    <div class="header-row">
      <h3 class="form-title">
        {{ notification ? t.formEditTitle : t.formNewTitle }}
      </h3>
      <button
        type="button"
        @click="emit('cancel')"
        class="close-btn"
      >
        <span class="material-symbols-rounded icon-close">close</span>
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="form-container">
      <!-- Title Input (M3 Filled Text Field) -->
      <MD3TextField
        id="m3-title-input"
        :label="t.formFieldTitle"
        v-model="title"
      />

      <!-- Display Text Input (M3 Filled Text Field) -->
      <MD3TextField
        id="m3-text-textarea"
        :label="t.formFieldText"
        v-model="text"
        textarea
        rows="4"
      />

      <!-- Combined Duration Settings List (Custom Duration toggle & Active Rotation Duration slider) -->
      <MD3List class="m3-form-list">
        <MD3ListItem :divider="useCustomDuration">
          <template #headline>
            <span class="m3-list-label">
              {{ config.language === 'zh' ? '单独设置轮播持续时间' : 'Set individual rotation duration' }}
            </span>
          </template>
          <template #supporting>
            <span class="m3-list-desc">
              {{ config.language === 'zh' ? '开启后此通知将采用专属持续时间，关闭则默认遵循系统全局设置' : 'If disabled, this notice will obey the global system speed default' }}
            </span>
          </template>
          <template #trailing>
            <MD3Switch v-model="useCustomDuration" />
          </template>
        </MD3ListItem>

        <!-- If useCustomDuration is on, show the active rotation duration slider in the same list card -->
        <MD3ListItem v-if="useCustomDuration" class="duration-slider-item animate-fade-in">
          <template #headline>
            <div class="duration-slider-header">
              <span class="m3-list-label">
                {{ t.formFieldDuration }}
              </span>
              <span class="duration-badge">
                {{ durationSecs }} {{ config.language === 'zh' ? '秒' : 'seconds' }}
              </span>
            </div>
          </template>
          <template #supporting>
            <div class="slider-wrapper">
              <MD3Slider
                v-model="durationSecs"
                :min="1"
                :max="60"
                variant="xs"
              />
            </div>
          </template>
        </MD3ListItem>
      </MD3List>

      <!-- Enable rotation list -->
      <MD3List class="m3-form-list">
        <MD3ListItem>
          <template #headline>
            <span class="m3-list-label">
              {{ t.formEnabledRotation }}
            </span>
          </template>
          <template #supporting>
            <span class="m3-list-desc">
              {{ t.formEnabledRotationDesc }}
            </span>
          </template>
          <template #trailing>
            <MD3Switch v-model="isActive" />
          </template>
        </MD3ListItem>
      </MD3List>

      <!-- Material Design 3 Snackbar for error reporting inside the Form -->
      <MD3Snackbar 
        :message="toastMessage" 
        @close="toastMessage = null" 
      />

      <!-- Buttons -->
      <div class="actions-row">
        <button
          type="button"
          @click="emit('cancel')"
          class="cancel-btn"
        >
          {{ t.cancel }}
        </button>
        <button
          type="submit"
          class="submit-btn"
        >
          <span class="material-symbols-rounded icon-save">save</span>
          {{ notification ? t.updateNotice : t.addToList }}
        </button>
      </div>
    </form>
  </MD3Card>
</template>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.form-title {
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
}

.close-btn {
  padding: 0.375rem;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.close-btn:hover {
  background-color: var(--surface-variant);
  color: var(--text-color);
}

.icon-close {
  font-size: 1.125rem;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* M3 Filled Text Field Styling */
.m3-text-field-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.m3-text-field {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--surface-variant);
  border-radius: 12px 12px 0 0;
  padding: 1.5rem 1rem 0.5rem 1rem;
  transition: background-color var(--transition-fast);
}

.m3-text-field:hover {
  background-color: var(--surface-container-high, rgba(128,128,128,0.18));
}

.m3-field-input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--text-color);
  caret-color: var(--primary);
  line-height: 1.5;
}

.textarea-input {
  resize: none;
  min-height: 5rem;
}

/* Floating Label styling */
.m3-field-label {
  position: absolute;
  left: 1rem;
  top: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  pointer-events: none;
  transform-origin: left top;
  transition: transform 0.15s cubic-bezier(0.2, 0, 0, 1), color 0.15s cubic-bezier(0.2, 0, 0, 1);
}

/* Focus and Not-Empty states */
.m3-field-input:focus ~ .m3-field-label,
.m3-field-input:not(:placeholder-shown) ~ .m3-field-label {
  transform: translateY(-0.6rem) scale(0.75);
}

.m3-field-input:focus ~ .m3-field-label {
  color: var(--primary);
}

/* Active bottom line indicator */
.m3-field-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--border-color-muted);
  transition: background-color 0.15s;
}

.m3-field-line::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--primary);
  transform: scaleX(0);
  transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.m3-field-input:focus ~ .m3-field-line::after {
  transform: scaleX(1);
}

/* M3 Custom Lists inside Form */
.m3-form-list {
  background-color: var(--surface-variant);
  border-radius: 16px;
  overflow: hidden;
}

.m3-list-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.m3-list-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.duration-slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.duration-badge {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  background-color: var(--primary-container);
  color: var(--on-primary-container);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.slider-wrapper {
  padding: 0.25rem 0;
  width: 100%;
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-banner {
  font-size: 0.75rem;
  color: var(--error);
  font-weight: 500;
  padding: 0.75rem;
  background-color: var(--error-container);
  border: 1px solid var(--error);
  border-radius: 0.75rem;
}

.actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cancel-btn {
  font-size: 0.75rem;
  font-weight: 700;
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 0.625rem 1.25rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.cancel-btn:hover {
  background-color: var(--surface-variant);
  color: var(--text-color);
}

.submit-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--md-sys-color-on-primary);
  background-color: var(--primary);
  padding: 0.625rem 1.5rem;
  border-radius: 9999px;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
}

.submit-btn:hover {
  background-color: var(--primary-hover);
}

.icon-save {
  font-size: 1rem;
}
</style>
