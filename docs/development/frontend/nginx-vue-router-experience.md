# Nginx与Vue Router路径冲突问题总结

## 问题描述

在使用 Vue Router 的 history 模式时，访问 `/home` 路径会出现以下问题：
1. 首次访问 `http://localhost:2333/home` 正常
2. 刷新页面后，URL 变成 `http://localhost/home/`，出现以下问题：
   - 端口号（2333）丢失
   - 路径末尾多了一个斜杠
   - 页面返回 403 Forbidden 错误

## 问题原因

1. **物理目录冲突**：
   - 前端项目打包后，在 dist 目录中实际创建了一个 `home` 目录
   - 当 nginx 收到对 `/home` 的请求时，发现存在物理目录
   - nginx 默认会将目录访问重定向到带斜杠的形式（如 `/home/`）

2. **重定向过程**：
   - nginx 检测到 `/home` 是一个目录
   - 触发目录访问的重定向规则
   - 重定向过程中丢失了端口信息
   - 最终导致 403 错误

3. **为什么其他路由正常**：
   - 其他路由路径（如 `/login`）在打包后没有对应的物理目录
   - 请求直接通过 `try_files` 指令返回 `index.html`
   - 不会触发目录重定向逻辑

## 解决方案

### 1. Nginx 配置修改（快速解决）

```nginx
location / {
    root   /var/www/html;
    index  index.html index.htm;
    
    # 如果请求的是目录，直接重写到index.html
    if (-d $request_filename) {
        rewrite ^/(.*)$ /index.html last;
    }
    
    # 如果文件不存在，返回index.html
    try_files $uri /index.html;
    
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2. 前端路由改进（最佳实践）

1. **添加路由前缀**：
```javascript
const router = new VueRouter({
  mode: 'history',
  base: '/portal/', // 添加应用前缀
  routes: [...]
})
```

2. **修改构建配置**：
```javascript
module.exports = {
  publicPath: '/portal/',
  outputDir: 'dist',
  assetsDir: '_assets', // 使用下划线前缀避免冲突
}
```

### 3. 其他可选方案

1. **使用 Hash 模式**：
```javascript
const router = new VueRouter({
  mode: 'hash',
  routes: [...]
})
```

2. **修改资源输出结构**：
```javascript
module.exports = {
  build: {
    assetsDir: '_assets',
    html: {
      filename: 'app.html'
    }
  }
}
```

## 最佳实践建议

1. **路由命名空间**：
   - 给前端应用添加基础路径（如 `/portal/`）
   - 避免与系统路径（如 `/home`）冲突
   - 便于多应用部署和管理

2. **资源文件组织**：
   - 使用特殊前缀（如 `_assets`）存放静态资源
   - 避免资源目录与路由路径重名
   - 清晰的目录结构便于维护

3. **Nginx 配置**：
   - 使用通用的重写规则处理目录访问
   - 正确配置 `try_files` 指令
   - 保留必要的请求头信息

## 经验总结

1. 在使用 history 模式时，需要注意路由路径与物理目录的潜在冲突
2. 系统相关的路径名（如 `home`）需要特别注意
3. 建议使用应用前缀来隔离前端路由空间
4. 合理组织静态资源目录结构，避免与路由冲突
5. nginx 配置需要考虑目录访问的处理逻辑

## 参考链接

- [Vue Router 文档 - HTML5 History 模式](https://router.vuejs.org/guide/essentials/history-mode.html)
- [Nginx 文档 - try_files 指令](http://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [Nginx 文档 - 目录重定向](http://nginx.org/en/docs/http/ngx_http_core_module.html#absolute_redirect)
