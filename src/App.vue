<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { NotificationItem, AppConfig } from './types';
import NotificationCarousel from './components/NotificationCarousel.vue';
import NotificationManager from './components/NotificationManager.vue';
import NotificationForm from './components/NotificationForm.vue';
import FullScreenView from './components/FullScreenView.vue';
import SidebarNavItem from './components/SidebarNavItem.vue';
import MD3List from './components/MD3Components/MD3List.vue';
import MD3ListItem from './components/MD3Components/MD3ListItem.vue';
import MD3Tabs from './components/MD3Components/MD3Tabs.vue';
import { useI18n } from 'vue-i18n';
import MD3Snackbar from './components/MD3Components/MD3Snackbar.vue';
import PageHeader from './components/PageHeader.vue';
import MD3Card from './components/MD3Components/MD3Card.vue';
import MD3LoadingModal from './components/MD3Components/MD3LoadingModal.vue';
import MD3Sidebar from './components/MD3Components/MD3Sidebar.vue';

// Initial mock dataset
const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

// Load initial settings
const notifications = ref<NotificationItem[]>([]);
const config = ref<AppConfig>({
  themeMode: 'system',
  carouselSpeedSecs: 6,
  fontSize: 2.0,
  language: 'en'
});

const activeTab = ref<'monitor' | 'list' | 'settings'>('monitor');
const isEditing = ref(false);
const editingNotification = ref<NotificationItem | null>(null);
const isFullscreen = ref(false);
const sidebarExpanded = ref(false);
const isBooting = ref(true);

const { t: translate, locale } = useI18n();

// Watch for manual settings language change and sync with vue-i18n
watch(() => config.value.language, (newLang) => {
  if (newLang) {
    locale.value = newLang;
  }
}, { immediate: true });

// Proxied t object to maintain full backward compatibility with the existing templates
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

// Carousel playback states
const currentIndex = ref(0);
const elapsedMs = ref(0);
const isPlaying = ref(true);

// Real time simulation variables
const simulatedTime = ref({
  systemTime: '12:00:00',
  isWeekend: false,
  dayOfWeek: 'Friday',
  hour: 12
});

// Success message toast notifier
const toastMessage = ref<string | null>(null);

// Initialize data from LocalStorage
onMounted(() => {
  setTimeout(() => {
    isBooting.value = false;
  }, 1200); // Simulate Material Design 3 system boot

  const savedNotifications = localStorage.getItem('m3_notifications');
  notifications.value = savedNotifications ? JSON.parse(savedNotifications) : DEFAULT_NOTIFICATIONS;

  const defaultLang = locale.value as 'en' | 'zh';
  const defaultConfig: AppConfig = {
    themeMode: 'system',
    carouselSpeedSecs: 6,
    fontSize: 2.0,
    language: defaultLang
  };

  const savedConfig = localStorage.getItem('m3_config');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      if (parsed && typeof parsed.fontSize === 'string') {
        const mapping: Record<string, number> = {
          xs: 1.0, sm: 1.2, base: 1.5, lg: 1.8, xl: 2.0,
          '2xl': 2.2, '3xl': 2.5, '4xl': 2.8, '5xl': 3.2, '6xl': 3.6
        };
        parsed.fontSize = mapping[parsed.fontSize] || 2.0;
      }
      config.value = { ...defaultConfig, ...parsed };
    } catch (e) {
      config.value = defaultConfig;
    }
  } else {
    config.value = defaultConfig;
  }

  // Initialize clock
  updateSimulatedTime();
  clockTimer = setInterval(updateSimulatedTime, 1000);

  // Initialize theme
  updateTheme();
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', updateTheme);
});

// Sync data back to LocalStorage
watch(notifications, (newVal) => {
  localStorage.setItem('m3_notifications', JSON.stringify(newVal));
}, { deep: true });

watch(config, (newVal) => {
  localStorage.setItem('m3_config', JSON.stringify(newVal));
}, { deep: true });

watch(isFullscreen, async (newVal) => {
  try {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.setFullscreen(newVal);
    }
  } catch (e) {
    console.warn('Failed to toggle Tauri window fullscreen:', e);
  }
});

// Light/Dark Theme toggle
const updateTheme = () => {
  const root = window.document.documentElement;
  const isDark =
    config.value.themeMode === 'dark' ||
    (config.value.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

watch(() => config.value.themeMode, () => {
  updateTheme();
});

// Real time simulation ticker
let clockTimer: NodeJS.Timeout | null = null;
const updateSimulatedTime = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  simulatedTime.value = {
    systemTime: now.toLocaleTimeString('en-US', options),
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
    dayOfWeek: dayName,
    hour: now.getHours()
  };
};

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (progressTimer) clearInterval(progressTimer);
  if (toastTimer) clearTimeout(toastTimer);
});

// Compute processed notifications with simulated time replacement
const processedNotifications = computed(() => {
  return notifications.value
    .filter((n) => n.isActive)
    .map((n) => {
      // Return copy of notification item with replaced {TIME} tag
      const text = n.text.includes('{TIME}')
        ? n.text.replace('{TIME}', simulatedTime.value.systemTime)
        : n.text;
      return { ...n, text };
    });
});

// Safe active indices wrapping
watch(processedNotifications, (newVal) => {
  if (newVal.length === 0) {
    currentIndex.value = 0;
  } else if (currentIndex.value >= newVal.length) {
    currentIndex.value = 0;
  }
});

// Linear progression countdown timer (every 100ms)
let progressTimer: NodeJS.Timeout | null = null;

const startProgressTimer = () => {
  if (progressTimer) clearInterval(progressTimer);
  if (!isPlaying.value || processedNotifications.value.length === 0) return;

  const tickMs = 100;
  progressTimer = setInterval(() => {
    const currentItem = processedNotifications.value[currentIndex.value];
    const durationLimitSecs = currentItem?.durationSecs || config.value.carouselSpeedSecs;
    const durationLimitMs = durationLimitSecs * 1000;

    elapsedMs.value += tickMs;
    if (elapsedMs.value >= durationLimitMs) {
      currentIndex.value = (currentIndex.value + 1) % processedNotifications.value.length;
      elapsedMs.value = 0;
    }
  }, tickMs);
};

watch(
  [isPlaying, currentIndex, processedNotifications, () => config.value.carouselSpeedSecs],
  () => {
    startProgressTimer();
  },
  { immediate: true }
);

watch(currentIndex, () => {
  elapsedMs.value = 0;
});

const activeDurationMs = computed(() => {
  if (processedNotifications.value.length === 0) return 1000;
  const item = processedNotifications.value[currentIndex.value];
  return (item?.durationSecs || config.value.carouselSpeedSecs) * 1000;
});

const progressPercent = computed(() => {
  return Math.min(100, (elapsedMs.value / activeDurationMs.value) * 100);
});

// Toast Notifier
let toastTimer: NodeJS.Timeout | null = null;
const showToast = (msg: string) => {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = msg;
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
    toastTimer = null;
  }, 3000);
};

// Operations CRUD
const handleSaveNotification = (item: Omit<NotificationItem, 'id' | 'createdAt'> & { id?: string }) => {
  if (item.id) {
    notifications.value = notifications.value.map((n) =>
      n.id === item.id ? { ...n, ...item, createdAt: n.createdAt } : n
    );
    showToast(config.value.language === 'zh' ? '通知条目修改成功' : 'Notification modified successfully');
  } else {
    const newItem: NotificationItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    notifications.value = [newItem, ...notifications.value];
    showToast(config.value.language === 'zh' ? '成功添加新通知' : 'New notification added');
  }
  isEditing.value = false;
  editingNotification.value = null;
};

const handleDeleteNotification = (id: string) => {
  notifications.value = notifications.value.filter((n) => n.id !== id);
  showToast(config.value.language === 'zh' ? '成功删除通知条目' : 'Notification removed successfully');
};

const handleToggleActive = (id: string) => {
  notifications.value = notifications.value.map((n) =>
    n.id === id ? { ...n, isActive: !n.isActive } : n
  );
};

const handleExportNotifications = () => {
  const dataStr = JSON.stringify(notifications.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notice_board_notifications.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(config.value.language === 'zh' ? '配置文件已成功导出到路径：C:\\Users\\Administrator\\Downloads\\notice_board_notifications.json' : 'Configuration file has been successfully exported to path: C:\\Users\\Administrator\\Downloads\\notice_board_notifications.json');
};

const handleImportNotifications = (importedList: NotificationItem[]) => {
  if (Array.isArray(importedList)) {
    const validated = importedList.map((item: any) => ({
      id: item.id || Math.random().toString(36).substring(2, 9),
      title: item.title || 'Untitled',
      text: item.text || '',
      durationSecs: typeof item.durationSecs === 'number' ? item.durationSecs : 6,
      colorAccent: item.colorAccent || 'indigo',
      isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
      createdAt: item.createdAt || new Date().toISOString()
    }));
    notifications.value = validated;
    showToast(config.value.language === 'zh' ? '成功导入通知列表' : 'Notifications list imported successfully');
  }
};

const updateConfig = (newConf: Partial<AppConfig>) => {
  config.value = { ...config.value, ...newConf };
};
</script>

<template>
  <div class="app-container" :style="{ '--sidebar-width': sidebarExpanded ? '256px' : '80px' }">

    <!-- MD3 Booting Loading Modal -->
    <MD3LoadingModal :show="isBooting" />

    <!-- Immersive full screen simulator overlay -->
    <FullScreenView v-if="isFullscreen" :processedNotifications="processedNotifications" :currentIndex="currentIndex"
      :config="config" :progress-percent="progressPercent" @exit="isFullscreen = false" />

    <!-- Windows Title Bar for Tauri Window controls -->
    <div class="windows-title-bar" data-tauri-drag-region>
      <div class="windows-controls">
        <button id="titlebar-minimize" class="win-btn win-minimize"
          :title="config.language === 'zh' ? '最小化' : 'Minimize'">
          <span class="material-symbols-rounded">minimize</span>
        </button>
        <button id="titlebar-maximize" class="win-btn win-maximize"
          :title="config.language === 'zh' ? '最大化 / 恢复' : 'Maximize / Restore'">
          <span class="material-symbols-rounded">crop_square</span>
        </button>
        <button id="titlebar-close" class="win-btn win-close" :title="config.language === 'zh' ? '关闭' : 'Close'">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    </div>

    <!-- Real Application Layout wrapper -->
    <div class="app-layout-wrapper">
      <!-- 1. DESKTOP SIDEBAR (Left panel, hidden on mobile) -->
      <MD3Sidebar :expanded="sidebarExpanded">
        <!-- Brand Header & Toggle -->
        <template #top>
          <div class="brand-row">
            <div class="brand-identity">
              <button @click="sidebarExpanded = !sidebarExpanded" class="brand-icon-btn"
                :title="sidebarExpanded ? (config.language === 'zh' ? '收起侧边栏' : 'Collapse Sidebar') : (config.language === 'zh' ? '展开侧边栏' : 'Expand Sidebar')">
                <span class="material-symbols-rounded brand-menu-icon">
                  {{ sidebarExpanded ? 'menu_open' : 'menu' }}
                </span>
              </button>
              <div v-if="sidebarExpanded" class="brand-info">
                <h1 class="brand-title" style="color: var(--primary);">
                  {{ t.appName }}
                </h1>
              </div>
            </div>
          </div>
        </template>

        <!-- Middle Section Slot (Navigation menu items) -->
        <template #middle>
          <nav class="sidebar-nav" :class="{ 'align-center-width': !sidebarExpanded }">
            <SidebarNavItem tab="monitor" :active-tab="activeTab" :label="t.tabMonitor" icon="dashboard"
              :expanded="sidebarExpanded" @select="tab => { activeTab = tab; isEditing = false; }" />
            <SidebarNavItem tab="list" :active-tab="activeTab" :label="t.tabList" icon="inbox_text"
              :expanded="sidebarExpanded" @select="tab => { activeTab = tab; isEditing = false; }" />
          </nav>
        </template>

        <!-- Bottom Section Slot (Settings Tab) -->
        <template #bottom>
          <SidebarNavItem tab="settings" :active-tab="activeTab" :label="t.tabSettings" icon="settings"
            :expanded="sidebarExpanded" @select="tab => { activeTab = tab; isEditing = false; }" />
        </template>
      </MD3Sidebar>

      <!-- 3. MAIN WORKSPACE VIEW CONTAINER -->
      <main class="main-workspace" :class="[
        activeTab === 'monitor' ? 'workspace-monitor' : 'workspace-scroll',
        activeTab === 'list' ? 'workspace-list-mode' : ''
      ]">
        <!-- Dynamic Page Header -->
        <PageHeader v-if="activeTab !== 'monitor'" :title="activeTab === 'list' ? t.pageTitleList : t.pageTitleSettings"
          :subtitle="activeTab === 'list' ? t.pageSubtitleList : t.pageSubtitleSettings" />

        <!-- Content Body space -->
        <div class="content-body" :class="activeTab === 'monitor' ? 'content-body-monitor' : 'content-body-scroll'">
          <!-- Monitor Mode Tab -->
          <NotificationCarousel v-if="activeTab === 'monitor'" :notifications="notifications" :config="config"
            :processedNotifications="processedNotifications" :currentIndex="currentIndex"
            :progressPercent="progressPercent" :isPlaying="isPlaying" @config-change="updateConfig"
            @index-change="currentIndex = $event" @play-pause="isPlaying = !isPlaying"
            @fullscreen="isFullscreen = true" />

          <!-- Notification List Manager Tab -->
          <div v-if="activeTab === 'list'" class="list-tab-container">
            <NotificationForm v-if="isEditing" :notification="editingNotification" :config="config"
              @save="handleSaveNotification" @cancel="isEditing = false; editingNotification = null" />
            <NotificationManager v-else :notifications="notifications" :config="config"
              @edit="editingNotification = $event; isEditing = true" @delete="handleDeleteNotification"
              @toggle-active="handleToggleActive" @add-new-click="editingNotification = null; isEditing = true"
              @import-notifications="handleImportNotifications" @export-notifications="handleExportNotifications" />
          </div>

          <!-- Settings tab panel -->
          <div v-if="activeTab === 'settings'" class="settings-container">
            <div class="settings-grid">

              <!-- Card 1: Theme Preferences -->
              <MD3Card variant="outlined" class="settings-card">
                <div class="settings-card-header">
                  <h4 class="settings-card-title">
                    {{ config.language === 'zh' ? '主题与配色设置' : 'Theme Preferences' }}
                  </h4>
                </div>

                <MD3List>
                  <MD3ListItem>
                    <template #leading>
                      <span class="material-symbols-rounded">palette</span>
                    </template>
                    <template #headline>{{ t.themeSeedColor }}</template>
                    <template #supporting>
                      {{ config.language === 'zh' ? '选择系统的深色 or 浅色主题外观' : 'Select dark or light visual theme of the system' }}
                    </template>
                    <template #trailing>
                      <MD3Tabs v-model="config.themeMode" :options="[
                        { value: 'system', label: t.themeModeAuto },
                        { value: 'light', label: t.themeModeLight },
                        { value: 'dark', label: t.themeModeDark }
                      ]" />
                    </template>
                  </MD3ListItem>
                </MD3List>
              </MD3Card>

              <!-- Card 2: Language Preference -->
              <MD3Card variant="outlined" class="settings-card">
                <div class="settings-card-header">
                  <h4 class="settings-card-title">
                    {{ config.language === 'zh' ? '显示偏好设置' : 'Localization & Formatting' }}
                  </h4>
                </div>

                <MD3List>
                  <!-- Language select -->
                  <MD3ListItem>
                    <template #leading>
                      <span class="material-symbols-rounded">translate</span>
                    </template>
                    <template #headline>{{ t.appLanguage }}</template>
                    <template #supporting>
                      {{ config.language === 'zh' ? '更改界面的首选显示语言' : 'Choose your preferred localization option' }}
                    </template>
                    <template #trailing>
                      <MD3Tabs v-model="config.language" :options="[
                        { value: 'en', label: 'English' },
                        { value: 'zh', label: '简体中文' }
                      ]" />
                    </template>
                  </MD3ListItem>
                </MD3List>
              </MD3Card>

            </div>

            <!-- Card 3: About System (with larger margin from the top cards) -->
            <div class="about-card-section">
              <MD3Card variant="outlined" class="settings-card">
                <div class="settings-card-header">
                  <h4 class="settings-card-title">
                    {{ config.language === 'zh' ? '关于 Notice Board' : 'About Notice Board' }}
                  </h4>
                </div>

                <MD3List>
                  <!-- Version Number -->
                  <MD3ListItem>
                    <template #leading>
                      <span class="material-symbols-rounded">app_badging</span>
                    </template>
                    <template #headline>
                      {{ config.language === 'zh' ? '版本号' : 'Version' }}
                    </template>
                    <template #trailing>
                      <span class="about-value">v2.0.1</span>
                    </template>
                  </MD3ListItem>

                  <!-- Author -->
                  <MD3ListItem>
                    <template #leading>
                      <span class="material-symbols-rounded">person</span>
                    </template>
                    <template #headline>
                      {{ config.language === 'zh' ? '作者' : 'Author' }}
                    </template>
                    <template #supporting>
                      {{ config.language === 'zh' ? '本应用由AI辅助开发' : 'This application is AI-assisted development' }}
                    </template>
                    <template #trailing>
                      <span class="about-value">LviFly</span>
                    </template>
                  </MD3ListItem>
                </MD3List>
              </MD3Card>
            </div>

          </div>
        </div>
      </main>

    </div>

    <!-- Material Design 3 Snackbar -->
    <MD3Snackbar :message="toastMessage || ''" :language="config.language" @close="toastMessage = null" />

  </div>
</template>


<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
  transition: background-color var(--transition-normal), color var(--transition-normal);
  position: relative;
}

.app-layout-wrapper {
  display: flex;
  flex-direction: row;
  flex: 1;
  width: 100%;
}

/* Maximized View Modifier */
.maximized-app .content-body-scroll,
.maximized-app .header-inner {
  max-width: none !important;
}

/* Windows Title Bar & Buttons */
.windows-title-bar {
  position: absolute;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 100;
  pointer-events: auto;
  background-color: transparent;
}

.windows-controls {
  display: flex;
  pointer-events: auto;
}

.win-btn {
  width: 46px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  transition: background-color 0.1s, color 0.1s;
}

.win-btn span {
  font-size: 16px;
}

.win-btn:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.dark .win-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.win-close:hover {
  background-color: #e81123 !important;
  color: #ffffff !important;
}

/* Simulated Desktop */
.simulated-desktop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, #1e1e2f 0%, #0d0d15 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem;
  z-index: 999;
  color: #ffffff;
  overflow: hidden;
}

.desktop-wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(135deg, #12121c 0%, #1c1a2e 50%, #0e0d16 100%);
  z-index: -1;
  opacity: 0.95;
}

.desktop-icons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: flex-start;
  z-index: 10;
}

.desktop-icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  width: 90px;
  transition: background-color 0.2s;
}

.desktop-icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.icon-display {
  font-size: 24px;
  color: #ffffff;
}

.icon-label {
  font-size: 0.75rem;
  text-align: center;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* Minimized Preview Card */
.minimized-preview-card {
  position: absolute;
  bottom: 5rem;
  right: 2rem;
  background-color: rgba(30, 30, 45, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 280px;
  padding: 1rem;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
  z-index: 20;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.preview-icon {
  font-size: 18px;
  color: var(--primary);
}

.preview-title {
  font-size: 0.875rem;
  font-weight: 700;
}

.preview-restore-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-restore-btn:hover {
  color: var(--primary);
}

.preview-body {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Simulated Taskbar */
.simulated-taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background-color: rgba(20, 20, 30, 0.8);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
}

.taskbar-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.taskbar-start-btn {
  background: transparent;
  border: none;
  color: #8ab4f8;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.taskbar-start-btn:hover {
  transform: scale(1.1);
  color: #ffffff;
}

.taskbar-app-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.2s;
}

.taskbar-app-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.taskbar-dot {
  position: absolute;
  bottom: 2px;
  width: 6px;
  height: 2px;
  border-radius: 1px;
  background-color: var(--primary);
  display: none;
}

.taskbar-app-btn.active-running .taskbar-dot {
  display: block;
}

.taskbar-app-btn.minimized .taskbar-dot {
  background-color: rgba(255, 255, 255, 0.5);
}

/* Sidebar styling has been moved to MD3Sidebar.vue */

/* Mobile Navbar Styling */
.mobile-navbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4rem;
  background-color: var(--surface-variant);
  border-top: 1px solid var(--border-color-muted);
  z-index: 30;
  padding: 0 0.5rem;
}

@media (min-width: 768px) {
  .mobile-navbar {
    display: none;
  }
}

.mobile-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mobile-nav-btn.active {
  color: var(--primary);
  font-weight: 700;
  transform: scale(1.05);
}

.mobile-nav-btn.inactive {
  color: var(--text-tertiary);
}

.mobile-nav-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.mobile-nav-label {
  font-size: 0.625rem;
}

/* Main Workspace Styling */
.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

@media (min-width: 768px) {
  .main-workspace {
    height: 100vh;
  }
}

.workspace-monitor {
  padding-bottom: 4rem;
}

@media (min-width: 768px) {
  .workspace-monitor {
    overflow: hidden;
    padding-bottom: 0;
  }
}

.workspace-scroll {
  overflow-y: auto;
  padding-bottom: 5rem;
}

@media (min-width: 768px) {
  .workspace-scroll {
    padding-bottom: 1.5rem;
  }
}

@media (min-width: 768px) {
  .workspace-list-mode {
    overflow: hidden !important;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .workspace-list-mode .content-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    height: auto !important;
    max-height: none !important;
    padding-bottom: 2rem;
    overflow: hidden;
  }

  .workspace-list-mode .content-body-scroll {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: auto !important;
    max-height: none !important;
  }
}

/* Content Body Styling */
.content-body {
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-body-monitor {
  max-width: none;
  width: 100%;
  justify-content: space-between;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.content-body-scroll {
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
  gap: 1.5rem;
}

.full-width {
  width: 100%;
}

.list-tab-container {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Settings Tab Styling */
.settings-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.settings-grid {
  display: grid;
  grid-template-cols: 1fr;
  gap: 1.5rem;
  align-items: start;
  width: 100%;
}

@media (min-width: 768px) {
  .settings-grid {
    grid-template-cols: repeat(2, minmax(0, 1fr));
  }
}

.about-card-section {
  margin-top: 3rem;
  width: 100%;
}

.about-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--secondary);
}

.settings-card {
  padding: 1.25rem;
  gap: 1.25rem;
}

.settings-card-header {
  display: flex;
  flex-direction: column;
}

.settings-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--secondary);
  text-transform: uppercase;
  font-family: var(--font-sans);
}

.settings-card-desc {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin-top: 0.125rem;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.settings-field-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-secondary);
}
</style>
