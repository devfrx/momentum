<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@renderer/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()

const navItems = computed(() =>
    router.getRoutes()
        .filter(r => r.meta?.titleKey)
        .sort((a, b) => {
            const order = ['/', '/business', '/stocks', '/crypto', '/realestate', '/investments', '/loans', '/deposits', '/gambling', '/skills', '/prestige', '/settings', '/dev']
            return order.indexOf(a.path) - order.indexOf(b.path)
        })
        .map(r => ({
            path: r.path,
            titleKey: r.meta!.titleKey as string,
            icon: r.meta!.icon as string,
            active: route.path === r.path
        }))
)
</script>

<template>
    <aside class="app-sidebar">
        <nav class="sidebar-nav">
            <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item"
                :class="{ active: item.active }">
                <AppIcon :icon="item.icon" class="nav-icon" />
                <span class="nav-label">{{ $t(item.titleKey) }}</span>
            </router-link>
        </nav>

        <div class="sidebar-footer">
            <span class="version-text">v0.1.0</span>
        </div>
    </aside>
</template>

<style scoped>
.app-sidebar {
    width: var(--t-sidebar-width);
    min-width: var(--t-sidebar-width);
    background: var(--t-bg-sidebar);
    border-right: 1px solid var(--t-border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
    padding: var(--t-space-2);
    gap: 1px;
    flex: 1;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--t-radius-md);
    color: var(--t-text-muted);
    text-decoration: none;
    font-size: var(--t-font-size-sm);
    font-weight: 500;
    transition: all var(--t-transition-fast);
}

.nav-item:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.nav-item.active {
    background: var(--t-bg-muted);
    color: var(--t-text);
    font-weight: 600;
    padding-left: calc(0.75rem - 2px);
}

.nav-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    width: 20px;
    text-align: center;
}

.nav-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
}

/* Sidebar Footer */
.sidebar-footer {
    padding: var(--t-space-3);
    border-top: 1px solid var(--t-border);
    text-align: center;
}

.version-text {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
