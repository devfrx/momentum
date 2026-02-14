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

/** Route ordering for consistent sort */
const ROUTE_ORDER = ['/', '/business', '/stocks', '/crypto', '/realestate', '/investments', '/loans', '/deposits', '/gambling', '/storage', '/skills', '/prestige', '/settings', '/dev']

/** Logical grouping of routes */
const GROUP_DEFS = [
    { labelKey: '', paths: ['/'] },
    { labelKey: 'nav.group_earn', paths: ['/business', '/stocks', '/crypto'] },
    { labelKey: 'nav.group_invest', paths: ['/realestate', '/investments', '/deposits'] },
    { labelKey: 'nav.group_finance', paths: ['/loans'] },
    { labelKey: 'nav.group_fun', paths: ['/gambling', '/storage'] },
    { labelKey: 'nav.group_progress', paths: ['/skills', '/prestige'] },
]

/** Bottom-pinned routes */
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
            <!-- Grouped navigation -->
            <div v-for="(group, gi) in navGroups" :key="gi" class="nav-group">
                <span v-if="group.labelKey" class="nav-group-label">{{ $t(group.labelKey) }}</span>
                <router-link v-for="item in group.items" :key="item.path" :to="item.path" class="nav-item"
                    :class="{ active: item.active }">
                    <div class="nav-indicator"></div>
                    <AppIcon :icon="item.icon" class="nav-icon" />
                    <span class="nav-label">{{ $t(item.titleKey) }}</span>
                </router-link>
            </div>
        </nav>

        <!-- Bottom-pinned items -->
        <div class="sidebar-bottom">
            <router-link v-for="item in bottomItems" :key="item.path" :to="item.path" class="nav-item"
                :class="{ active: item.active }">
                <div class="nav-indicator"></div>
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
    padding: var(--t-space-2) var(--t-space-2) 0;
    gap: var(--t-space-1);
    flex: 1;
}

/* ─── Group ─── */
.nav-group {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.nav-group+.nav-group {
    margin-top: var(--t-space-2);
    padding-top: var(--t-space-2);
    border-top: 1px solid var(--t-border);
}

.nav-group-label {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--t-text-muted);
    padding: 0 0.75rem;
    margin-bottom: 0.15rem;
    user-select: none;
}

/* ─── Nav items ─── */
.nav-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.75rem;
    border-radius: var(--t-radius-md);
    color: var(--t-text-muted);
    text-decoration: none;
    font-size: var(--t-font-size-sm);
    font-weight: 500;
    transition: all var(--t-transition-fast);
    position: relative;
}

.nav-indicator {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    border-radius: 0 2px 2px 0;
    background: var(--t-accent);
    transition: height var(--t-transition-fast);
}

.nav-item:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.nav-item.active {
    background: var(--t-bg-muted);
    color: var(--t-text);
    font-weight: 600;
}

.nav-item.active .nav-indicator {
    height: 60%;
}

.nav-icon {
    font-size: 1.05rem;
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

/* ─── Bottom section ─── */
.sidebar-bottom {
    padding: var(--t-space-2);
    border-top: 1px solid var(--t-border);
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.sidebar-footer {
    padding: var(--t-space-2) 0.75rem 0;
    text-align: left;
}

.version-text {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
