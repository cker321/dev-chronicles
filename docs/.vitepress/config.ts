import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "开发编年史",
  description: "记录开发经验、技术解决方案和部署的实时文档",
  base: '/dev-chronicles/',
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/dev-chronicles/favicon.ico' }],
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '开发', link: '/development/' },
      { text: '部署', link: '/deployment/' },
      { text: '架构', link: '/architecture/' },
      { text: '故障排查', link: '/troubleshooting/' },
    ],
    sidebar: {
      '/development/': [
        {
          text: '开发',
          items: [
            { text: '概述', link: '/development/' },
            {
              text: '前端',
              collapsed: false,
              items: [
                { text: '概述', link: '/development/frontend/' },
                { text: 'Nginx Vue Router 经验', link: '/development/frontend/nginx-vue-router-experience' },
                { text: 'Vue Rollup Practice 实践', link: '/development/frontend/vue-rollup-practice' }
              ]
            },
            { text: '后端', link: '/development/backend/' },
            { text: '数据库', link: '/development/database/' }
          ]
        }
      ],
      '/deployment/': [
        {
          text: '部署',
          items: [
            { text: '概述', link: '/deployment/' },
            { text: 'Nginx', link: '/deployment/nginx/' },
            { text: 'Docker', link: '/deployment/docker/' },
            { text: 'Kubernetes', link: '/deployment/kubernetes/' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: '架构',
          items: [
            { text: '概述', link: '/architecture/' },
            { text: '设计决策', link: '/architecture/decisions' },
            { text: '系统设计', link: '/architecture/system-design' }
          ]
        }
      ],
      '/troubleshooting/': [
        {
          text: '故障排查',
          items: [
            { text: '概述', link: '/troubleshooting/' },
            { text: '常见问题', link: '/troubleshooting/common-issues' },
            { text: '调试指南', link: '/troubleshooting/debug-guides' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/cker321/dev-chronicles' }
    ],
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright 2024-present 开发编年史'
    }
  }
})
