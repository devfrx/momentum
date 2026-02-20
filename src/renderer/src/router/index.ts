/**
 * Vue Router configuration
 */
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@renderer/views/DashboardView.vue'),
      meta: { titleKey: 'nav.dashboard', icon: 'mdi:view-dashboard' }
    },
    {
      path: '/business',
      name: 'business',
      component: () => import('@renderer/views/BusinessView.vue'),
      meta: { titleKey: 'nav.business', icon: 'mdi:store' }
    },
    {
      path: '/stocks',
      name: 'stocks',
      component: () => import('@renderer/views/StockMarketView.vue'),
      meta: { titleKey: 'nav.stocks', icon: 'mdi:chart-line' }
    },
    {
      path: '/stocks/:assetId',
      name: 'stock-detail',
      component: () => import('@renderer/views/AssetDetailView.vue'),
      meta: { titleKey: 'nav.stocks', icon: 'mdi:chart-line', assetType: 'stock' }
    },
    {
      path: '/crypto',
      name: 'crypto',
      component: () => import('@renderer/views/CryptoView.vue'),
      meta: { titleKey: 'nav.crypto', icon: 'mdi:bitcoin' }
    },
    {
      path: '/crypto/:assetId',
      name: 'crypto-detail',
      component: () => import('@renderer/views/AssetDetailView.vue'),
      meta: { titleKey: 'nav.crypto', icon: 'mdi:bitcoin', assetType: 'crypto' }
    },
    {
      path: '/realestate',
      name: 'realestate',
      component: () => import('@renderer/views/RealEstateView.vue'),
      meta: { titleKey: 'nav.realty', icon: 'mdi:home-city' }
    },
    {
      path: '/investments',
      name: 'investments',
      component: () => import('@renderer/views/InvestmentsView.vue'),
      meta: { titleKey: 'nav.startups', icon: 'mdi:rocket-launch' }
    },
    {
      path: '/loans',
      name: 'loans',
      component: () => import('@renderer/views/LoansView.vue'),
      meta: { titleKey: 'nav.loans', icon: 'mdi:bank' }
    },
    {
      path: '/deposits',
      name: 'deposits',
      component: () => import('@renderer/views/DepositsView.vue'),
      meta: { titleKey: 'nav.deposits', icon: 'mdi:piggy-bank' }
    },
    {
      path: '/gambling',
      name: 'gambling',
      component: () => import('@renderer/views/GamblingView.vue'),
      meta: { titleKey: 'nav.casino', icon: 'mdi:cards-playing' }
    },
    {
      path: '/storage',
      name: 'storage',
      component: () => import('@renderer/views/StorageWarsView.vue'),
      meta: { titleKey: 'nav.storage', icon: 'mdi:warehouse' }
    },
    {
      path: '/blackmarket',
      name: 'blackmarket',
      component: () => import('@renderer/views/BlackMarketView.vue'),
      meta: { titleKey: 'nav.blackmarket', icon: 'mdi:skull-crossbones' }
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('@renderer/views/OnlineShopView.vue'),
      meta: { titleKey: 'nav.shop', icon: 'mdi:store-search' }
    },
    {
      path: '/vault',
      name: 'vault',
      component: () => import('@renderer/views/VaultView.vue'),
      meta: { titleKey: 'nav.vault', icon: 'mdi:safe-square' }
    },
    {
      path: '/skills',
      name: 'skills',
      component: () => import('@renderer/views/SkillTreeView.vue'),
      meta: { titleKey: 'nav.skills', icon: 'mdi:graph' }
    },
    {
      path: '/prestige',
      name: 'prestige',
      component: () => import('@renderer/views/PrestigeView.vue'),
      meta: { titleKey: 'nav.prestige', icon: 'mdi:star-circle' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@renderer/views/SettingsView.vue'),
      meta: { titleKey: 'nav.settings', icon: 'mdi:cog' }
    },
    // Dev-only cheat page
    ...(import.meta.env.DEV
      ? [
          {
            path: '/dev',
            name: 'dev',
            component: () => import('@renderer/views/DevCheatsView.vue'),
            meta: { titleKey: 'nav.dev', icon: 'mdi:bug' }
          }
        ]
      : [])
  ]
})

export default router

/** Route names for type-safe navigation */
export type RouteName =
  | 'dashboard'
  | 'business'
  | 'stocks'
  | 'stock-detail'
  | 'crypto'
  | 'crypto-detail'
  | 'realestate'
  | 'investments'
  | 'loans'
  | 'deposits'
  | 'gambling'
  | 'storage'
  | 'blackmarket'
  | 'shop'
  | 'vault'
  | 'skills'
  | 'prestige'
  | 'settings'
  | 'dev'
