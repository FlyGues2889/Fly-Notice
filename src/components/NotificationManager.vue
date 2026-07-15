<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { NotificationItem, AppConfig } from '../types';
import { useI18n } from 'vue-i18n';
import MD3Switch from './MD3Components/MD3Switch.vue';
import MD3List from './MD3Components/MD3List.vue';
import MD3ListItem from './MD3Components/MD3ListItem.vue';
import MD3Tabs from './MD3Components/MD3Tabs.vue';
import MD3SearchField from './MD3Components/MD3SearchField.vue';
import MD3Loading from './MD3Components/MD3Loading.vue';

const props = defineProps<{
  notifications: NotificationItem[];
  config: AppConfig;
}>();

const emit = defineEmits<{
  (e: 'edit', item: NotificationItem): void;
  (e: 'delete', id: string): void;
  (e: 'toggle-active', id: string): void;
  (e: 'add-new-click'): void;
  (e: 'import-notifications', list: NotificationItem[]): void;
  (e: 'export-notifications'): void;
}>();

const searchTerm = ref('');
const filterActive = ref<'all' | 'active' | 'inactive'>('all');
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

const fileInput = ref<HTMLInputElement | null>(null);

const isListLoading = ref(true);
const isSearching = ref(false);

const showListLoader = ref(false);
const showSearchLoader = ref(false);

let listLoadingTimeout: any = null;
let searchLoaderTimeout: any = null;

// Watch isListLoading to trigger loader display after 1 second
watch(isListLoading, (newVal) => {
  if (newVal) {
    if (listLoadingTimeout) clearTimeout(listLoadingTimeout);
    listLoadingTimeout = setTimeout(() => {
      showListLoader.value = true;
    }, 1000);
  } else {
    if (listLoadingTimeout) clearTimeout(listLoadingTimeout);
    showListLoader.value = false;
  }
}, { immediate: true });

onMounted(() => {
  setTimeout(() => {
    isListLoading.value = false;
  }, 500); // Simulate initial loading of notice database list
});

let searchTimeout: any = null;
watch([searchTerm, filterActive], () => {
  isSearching.value = true;
  
  if (searchLoaderTimeout) clearTimeout(searchLoaderTimeout);
  showSearchLoader.value = false;
  
  // Trigger search loader display after 1 second if searching is still active
  searchLoaderTimeout = setTimeout(() => {
    if (isSearching.value) {
      showSearchLoader.value = true;
    }
  }, 1000);

  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    isSearching.value = false;
    if (searchLoaderTimeout) clearTimeout(searchLoaderTimeout);
    showSearchLoader.value = false;
  }, 400); // Simulate indexing / filtering delay
});

onUnmounted(() => {
  if (listLoadingTimeout) clearTimeout(listLoadingTimeout);
  if (searchLoaderTimeout) clearTimeout(searchLoaderTimeout);
  if (searchTimeout) clearTimeout(searchTimeout);
});

const triggerImportClick = () => {
  fileInput.value?.click();
};

const handleFileImport = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const json = JSON.parse(event.target?.result as string);
      if (Array.isArray(json)) {
        emit('import-notifications', json);
      } else if (json && Array.isArray(json.notifications)) {
        emit('import-notifications', json.notifications);
      } else {
        alert(props.config.language === 'zh' ? '无效的通知列表格式，应当为 JSON 数组。' : 'Invalid format: expected a JSON array of notifications.');
      }
    } catch (err) {
      alert(props.config.language === 'zh' ? '解析 JSON 文件失败。' : 'Failed to parse JSON file.');
    }
  };
  reader.readAsText(file);
  target.value = '';
};

const filteredNotifications = computed(() => {
  return props.notifications.filter((item) => {
    const matchesSearch =
      (item.title || '').toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      (item.text || '').toLowerCase().includes(searchTerm.value.toLowerCase());
    
    if (filterActive.value === 'all') return matchesSearch;
    if (filterActive.value === 'active') return matchesSearch && item.isActive;
    return matchesSearch && !item.isActive;
  });
});

const stats = computed(() => {
  const total = props.notifications.length;
  const active = props.notifications.filter((n) => n.isActive).length;
  const inactive = total - active;
  return { total, active, inactive };
});
</script>

<template>
  <div class="grid-container">
    
    <!-- CARD 2: Notice database scroll area (Right panel - Now Full Width) -->
    <div class="right-panel full-width">
      
      <!-- Header with creation button inside -->
      <div class="right-header">
        <div class="header-info">
          <h4 class="header-title">
            {{ config.language === 'zh' ? '已配置通知' : 'Configured Notices' }}
          </h4>
          <p class="header-subtitle">
            <template v-if="config.language === 'zh'">
              {{ filteredNotifications.length }} 条通知满足当前筛选条件
            </template>
            <template v-else>
              {{ filteredNotifications.length }} notices matching current filters
            </template>
          </p>
        </div>

        <div class="header-actions">
          <!-- Import Button -->
          <button
            @click="triggerImportClick"
            class="import-btn"
            :title="config.language === 'zh' ? '导入通知列表 (JSON)' : 'Import Notice List (JSON)'"
          >
            <span class="material-symbols-rounded icon-add">download</span>
            {{ config.language === 'zh' ? '导入' : 'Import' }}
          </button>
          <input
            type="file"
            ref="fileInput"
            @change="handleFileImport"
            accept=".json"
            style="display: none"
          />

          <!-- Export Button -->
          <button
            @click="emit('export-notifications')"
            class="export-btn"
            :title="config.language === 'zh' ? '导出通知列表 (JSON)' : 'Export Notice List (JSON)'"
          >
            <span class="material-symbols-rounded icon-add">upload</span>
            {{ config.language === 'zh' ? '导出' : 'Export' }}
          </button>

          <!-- Create Notice Button -->
          <button
            @click="emit('add-new-click')"
            class="add-btn"
          >
            <span class="material-symbols-rounded icon-add">add</span>
            {{ t.createNotice }}
          </button>
        </div>
      </div>

      <!-- Search & Filter Controls Row -->
      <div class="search-filter-row">
        <!-- Search Input Box -->
        <MD3SearchField
          :placeholder="t.searchPlaceholder"
          v-model="searchTerm"
        />

        <!-- Fully rounded filter tabs on the right -->
        <div class="filter-tabs-container">
          <MD3Tabs
            v-model="filterActive"
            :options="[
              { value: 'all', label: `${t.filterAll} · ${stats.total}` },
              { value: 'active', label: `${t.filterActive} · ${stats.active}` },
              { value: 'inactive', label: `${t.filterInactive} · ${stats.inactive}` }
            ]"
          />
        </div>
      </div>

      <!-- Scrollable list window -->
      <div class="list-container">
        <!-- Loading states (only visible if loading takes > 1s) -->
        <div v-if="showListLoader" class="loading-overlay">
          <MD3Loading variant="standard" />
          <span class="loading-overlay-text">
            {{ config.language === 'zh' ? '正在加载通知列表...' : 'Loading notification list...' }}
          </span>
        </div>

        <div v-else-if="showSearchLoader" class="loading-overlay">
          <MD3Loading variant="standard" />
          <span class="loading-overlay-text">
            {{ config.language === 'zh' ? '正在检索数据库...' : 'Searching database...' }}
          </span>
        </div>

        <!-- The notification list / empty state is shown immediately -->
        <div v-if="filteredNotifications.length === 0" class="empty-list">
          <span class="material-symbols-rounded empty-icon">info</span>
          <p class="empty-main">
            {{ searchTerm || filterActive !== 'all' ? t.noNoticeMatched : t.noticeEmpty }}
          </p>
          <p class="empty-sub">
            {{ searchTerm || filterActive !== 'all' ? t.tryAdjustFilters : t.clickToCreate }}
          </p>
        </div>
        
        <MD3List v-else class="noticeList">
          <div 
            v-for="(item, index) in filteredNotifications" 
            :key="item.id" 
            class="list-item-row"
          >
            <div class="item-index-badge">{{ index + 1 }}</div>
            <MD3ListItem
              :class="[item.isActive ? 'active' : 'inactive', 'item-card-inner']"
            >
              <!-- Leading Slot -->
              <template #leading>
                <MD3Switch
                  :model-value="item.isActive"
                  @update:model-value="emit('toggle-active', item.id)"
                  :title="item.isActive ? t.deactivateNotice : t.activateNotice"
                />
              </template>

              <!-- Headline/Primary Text -->
              <template #headline>
                <div class="item-header-row">
                  <h5 class="item-title">
                    {{ item.title || t.untitled }}
                  </h5>

                  <span class="item-duration">
                    <span v-if="!item.durationSecs || item.durationSecs === 0">
                      {{ config.language === 'zh' ? '全局 · ' : 'Global · ' }}{{ config.carouselSpeedSecs }}s
                    </span>
                    <span v-else>
                      {{ item.durationSecs }}s
                    </span>
                  </span>
                </div>
              </template>

              <!-- Supporting/Secondary text -->
              <template #supporting>
                <p class="item-text">
                  {{ item.text }}
                </p>
              </template>

              <!-- Trailing Slot -->
              <template #trailing>
                <div class="item-actions">
                  <button
                    @click="emit('edit', item)"
                    class="action-btn"
                    :title="t.editNotice"
                  >
                    <span class="material-symbols-rounded icon-btn-small">edit</span>
                  </button>

                  <button
                    @click="emit('delete', item.id)"
                    class="delete-btn"
                    :title="t.deleteNotice"
                  >
                    <span class="material-symbols-rounded icon-btn-small">delete</span>
                  </button>
                </div>
              </template>
            </MD3ListItem>
          </div>
        </MD3List>
      </div>

    </div>

  </div>
</template>

<style scoped>
.grid-container {
  display: grid;
  grid-template-cols: repeat(12, minmax(0, 1fr));
  gap: 1.5rem;
  width: 100%;
  align-items: stretch;
  color: var(--text-color);
}

.right-panel {
  grid-column: span 12 / span 12;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color-muted);
  border-radius: 24px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.right-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
}

.header-subtitle {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-top: 0.125rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.header-stat-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.text-active-inline {
  color: var(--primary);
  font-weight: 600;
}

.text-disabled-inline {
  color: var(--text-tertiary);
  font-weight: 600;
}

.search-filter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.filter-tabs-container {
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.import-btn, .export-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background-color: var(--primary-container);
  color: var(--on-primary-container);
  font-weight: 700;
  font-size: 0.875rem;
  border: none;
  border-radius: 20px; /* Capsule shape starting radius for buttery smooth interpolation */
  cursor: pointer;
  transition: background-color var(--transition-fast), 
              color var(--transition-fast), 
              border-radius var(--transition-fast), 
              box-shadow var(--transition-fast),
              transform 0.1s ease;
  will-change: background-color, border-radius, box-shadow, transform;
}

.import-btn:hover, .export-btn:hover, .import-btn:focus-visible, .export-btn:focus-visible {
  border-radius: 12px; /* Smoothly transitions from 20px down to 12px without visual jumpiness */
  background-color: var(--primary-container);
  box-shadow: 0 0 0 4px rgba(128, 128, 128, 0.08);
  outline: none;
}

.import-btn:active, .export-btn:active {
  transform: scale(0.97); /* Responsive tactile click animation */
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background-color: var(--primary);
  color: var(--md-sys-color-on-primary);
  font-weight: 700;
  font-size: 0.875rem;
  border: none;
  border-radius: 20px; /* Capsule shape starting radius for buttery smooth interpolation */
  cursor: pointer;
  transition: background-color var(--transition-fast), 
              color var(--transition-fast), 
              border-radius var(--transition-fast), 
              box-shadow var(--transition-fast),
              transform 0.1s ease;
  will-change: background-color, border-radius, box-shadow, transform;
}

.add-btn:hover, .add-btn:focus-visible {
  border-radius: 12px; /* Smoothly transitions from 20px down to 12px without visual jumpiness */
  background-color: var(--primary-hover);
  box-shadow: 0 0 0 4px rgba(128, 128, 128, 0.08);
  outline: none;
}

.add-btn:active {
  transform: scale(0.97); /* Responsive tactile click animation */
}

.icon-add {
  font-size: 0.875rem;
}

.list-container {
  overflow-y: auto;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.25rem;
}

@media (min-width: 768px) {
  .grid-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .right-panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .list-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    max-height: none !important;
  }
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 0;
  border: 1px dashed var(--border-color);
  border-radius: 1rem;
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--border-color);
  margin-bottom: 0.5rem;
  user-select: none;
}

.empty-main {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-sub {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}

.noticeList {
  height: 100%;
  overflow-y: auto;
}

.list-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
  width: 100%;
}

.item-index-badge {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 24px;
  color: var(--secondary);
  font-family: 'Nunito', var(--font-sans);
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;

  height: 100%;
  margin-top:1.6rem;
}

.item-card-inner {
  flex: 1;
  min-width: 0;
}

.m3-list-item {
  border-radius: 16px;
  border: 1px solid var(--border-color-muted);
  transition: all var(--transition-normal);
  color: var(--text-color);
  width: 100%;
}

.m3-list-item::after {
  display: none !important;
}

.m3-list-item.active {
  background-color: var(--surface-variant);
}

.m3-list-item.active:hover {
  background-color: var(--surface-color);
  border-color: var(--border-color);
}

.m3-list-item.inactive {
  background-color: rgba(128, 128, 128, 0.02);
  border-color: var(--border-color-muted);
  opacity: 0.6;
}

.m3-list-item.inactive:hover {
  opacity: 0.85;
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.item-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-duration {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-family: var(--font-sans);
  margin-left: auto;
}

.item-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  align-self: center;
}

.action-btn, .delete-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 12rem;
  color: var(--Secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  border: none;
  background-color: var(--surface-variant);
  outline: none;
}

.action-btn:hover, .action-btn:focus-visible,
.delete-btn:hover, .delete-btn:focus-visible {
  background-color: var(--border-color-muted);
  border-radius: 12rem;
  color: var(--Secondary);
  outline: none;
}

.icon-btn-small {
  font-size: 1.25rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: var(--surface-color);
  z-index: 10;
  border-radius: 16px;
}

.dark .loading-overlay {
  background-color: var(--surface-color);
}

.loading-overlay-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

:deep(.m3-tab-btn.active) {
  background-color: var(--secondary) !important;
  color: var(--md-sys-color-on-secondary, #ffffff) !important;
}

.list-container {
  height:100%;
  overflow: auto
}

</style>
