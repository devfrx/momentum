<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteRecordNormalized } from 'vue-router'
import AppIcon from '@renderer/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()

interface NavItem {
    path: string
    titleKey: string
    icon: string
    active: boolean
}

interface NavGroup {
    labelKey: string
    items: NavItem[]
}

const ROUTE_ORDER = ['/', '/business', '/stocks', '/crypto', '/realestate', '/investments', '/loans', '/deposits', '/gambling', '/storage', '/blackmarket', '/shop', '/vault', '/skills', '/prestige', '/settings', '/dev']

const GROUP_DEFS = [
    { labelKey: '', paths: ['/'] },
    { labelKey: 'nav.group_earn', paths: ['/business', '/stocks', '/crypto'] },
    { labelKey: 'nav.group_invest', paths: ['/realestate', '/investments', '/deposits'] },
    { labelKey: 'nav.group_finance', paths: ['/loans'] },
    { labelKey: 'nav.group_fun', paths: ['/gambling', '/storage', '/blackmarket', '/shop', '/vault'] },
    { labelKey: 'nav.group_progress', paths: ['/skills', '/prestige'] },
]

const BOTTOM_PATHS = ['/settings', '/dev']

function routeToNavItem(r: RouteRecordNormalized): NavItem {
    return {
        path: r.path,
        titleKey: r.meta!.titleKey as string,
        icon: r.meta!.icon as string,
        active: route.path === r.path,
    }
}

const allRoutes = computed(() =>
    router.getRoutes()
        .filter(r => r.meta?.titleKey)
        .sort((a, b) => ROUTE_ORDER.indexOf(a.path) - ROUTE_ORDER.indexOf(b.path))
)

const navGroups = computed<NavGroup[]>(() =>
    GROUP_DEFS.map(g => ({
        labelKey: g.labelKey,
        items: g.paths
            .map(p => allRoutes.value.find(r => r.path === p))
            .filter((r): r is RouteRecordNormalized => !!r)
            .map(routeToNavItem),
    })).filter(g => g.items.length > 0)
)

const bottomItems = computed<NavItem[]>(() =>
    BOTTOM_PATHS
        .map(p => allRoutes.value.find(r => r.path === p))
        .filter((r): r is RouteRecordNormalized => !!r)
        .map(routeToNavItem)
)
</script>

<template>
    <aside class="app-sidebar">
        <nav class="sidebar-nav">
            <div v-for="(group, gi) in navGroups" :key="gi" class="nav-group">
                <span v-if="group.labelKey" class="nav-group-label">{{ $t(group.labelKey) }}</span>
                <router-link v-for="item in group.items" :key="item.path" :to="item.path" class="nav-item"
                    :class="{ active: item.active }">
                    <AppIcon :icon="item.icon" class="nav-icon" />
                    <span class="nav-label">{{ $t(item.titleKey) }}</span>
                </router-link>
            </div>
        </nav>

        <div class="sidebar-bottom">
            <router-link v-for="item in bottomItems" :key="item.path" :to="item.path" class="nav-item"
                :class="{ active: item.active }">
                <AppIcon :icon="item.icon" class="nav-icon" />
                <span class="nav-label">{{ $t(item.titleKey) }}</span>
            </router-link>
            <div class="sidebar-footer">
                <span class="version-text">v0.1.0</span>
            </div>
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
    padding: var(--t-space-3) var(--t-space-2) 0;
    gap: var(--t-space-1);
    flex: 1;
}

.nav-group {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.nav-group+.nav-group {
    margin-top: var(--t-space-3);
    padding-top: var(--t-space-3);
    border-top: 1px solid var(--t-border);
}

.nav-group-label {
    font-size: 0.6rem;
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
    padding: 0 var(--t-space-3);
    margin-bottom: var(--t-space-1);
    user-select: none;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: 0.4rem var(--t-space-3);
    border-radius: var(--t-radius-md);
    color: var(--t-text-muted);
    text-decoration: none;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-medium);
    transition: all var(--t-transition-fast);
    position: relative;
}

.nav-item:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.nav-item:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.nav-item:active {
    transform: scale(0.98);
}

.nav-item.active {
    background: var(--t-bg-muted);
    color: var(--t-text);
    font-weight: var(--t-font-semibold);
}

.nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 25%;
    height: 50%;
    width: 2px;
    border-radius: 0 2px 2px 0;
    background: var(--t-text);
}

.nav-icon {
    font-size: 1rem;
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

.sidebar-bottom {
    padding: var(--t-space-2);
    border-top: 1px solid var(--t-border);
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.sidebar-footer {
    padding: var(--t-space-2) var(--t-space-3) 0;
    text-align: left;
}

.version-text {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
}
</style>
