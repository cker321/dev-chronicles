import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Dev Chronicles",
  description: "A living documentation of development experiences, technical solutions, and deployment wisdom",
  base: '/dev-chronicles/',
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Development', link: '/development/' },
      { text: 'Deployment', link: '/deployment/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Troubleshooting', link: '/troubleshooting/' },
    ],
    sidebar: {
      '/development/': [
        {
          text: 'Development',
          items: [
            { text: 'Overview', link: '/development/' },
            {
              text: 'Frontend',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/development/frontend/' },
                { text: 'Nginx Vue Router Experience', link: '/development/frontend/nginx-vue-router-experience' }
              ]
            },
            { text: 'Backend', link: '/development/backend/' },
            { text: 'Database', link: '/development/database/' }
          ]
        }
      ],
      '/deployment/': [
        {
          text: 'Deployment',
          items: [
            { text: 'Overview', link: '/deployment/' },
            { text: 'Nginx', link: '/deployment/nginx/' },
            { text: 'Docker', link: '/deployment/docker/' },
            { text: 'Kubernetes', link: '/deployment/kubernetes/' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/' },
            { text: 'Design Decisions', link: '/architecture/decisions' },
            { text: 'System Design', link: '/architecture/system-design' }
          ]
        }
      ],
      '/troubleshooting/': [
        {
          text: 'Troubleshooting',
          items: [
            { text: 'Overview', link: '/troubleshooting/' },
            { text: 'Common Issues', link: '/troubleshooting/common-issues' },
            { text: 'Debug Guides', link: '/troubleshooting/debug-guides' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/cker321/dev-chronicles' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024-present Dev Chronicles'
    }
  }
})
