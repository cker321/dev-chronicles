# Vue 组件库的 Rollup 打包实践

## 概述

本文档记录了使用 Rollup 打包 Vue 组件库的最佳实践，包括配置说明、样式处理、组件导出等关键点。这些实践来自于实际项目经验，特别是在处理 Vue 单文件组件（SFC）和样式模块时的解决方案。

## 项目结构

一个典型的 Vue 组件库项目结构如下：

```
src/layout/
├── components/          # 组件目录
│   ├── Navbar/
│   └── InnerLink/
├── dist/               # 打包输出目录
│   ├── index.js
│   └── index.css
├── index.js           # 入口文件
├── index.vue          # 主组件
├── package.json       # 项目配置
└── rollup.config.js   # Rollup 配置
```

## 关键配置

### 1. package.json 配置

```json
{
  "name": "layout-bundle",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w"
  },
  "devDependencies": {
    "@rollup/plugin-babel": "^6.0.3",
    "@rollup/plugin-commonjs": "^25.0.0",
    "@rollup/plugin-node-resolve": "^15.0.2",
    "rollup": "^3.22.0",
    "rollup-plugin-postcss": "^4.0.2",
    "rollup-plugin-vue": "^6.0.0",
    "sass": "^1.62.1"
  }
}
```

### 2. Rollup 配置

```javascript
// rollup.config.js
export default {
  input: './index.js',
  output: {
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
    exports: 'named'  // 支持命名导出
  },
  plugins: [
    vue({
      preprocessStyles: true,
      css: false  // 禁用 vue 插件的 CSS 处理
    }),
    postcss({
      extract: 'index.css',  // 提取 CSS 到单独文件
      minimize: true,
      modules: false,
      use: ['sass']
    })
  ]
}
```

## 组件导出最佳实践

### 1. 入口文件配置

```javascript
// index.js
import Layout from './index.vue';
import InnerLink from './components/InnerLink/index.vue';

export default Layout;
export { InnerLink };  // 命名导出其他组件
```

### 2. 组件定义

```vue
<!-- components/InnerLink/index.vue -->
<script setup name="InnerLink">
// 使用 name 属性确保组件名称正确
const props = defineProps({
  // 组件属性定义
});
</script>
```

## 样式处理策略

### 1. 样式分离

- 使用 `rollup-plugin-postcss` 将样式提取到单独的 CSS 文件
- 在主项目中手动导入样式文件
- 支持 SCSS 预处理器

### 2. 样式作用域

- 可以使用 `scoped` 样式确保样式隔离
- 对于需要全局生效的样式，去掉 `scoped` 属性

```vue
<style lang="scss" scoped>
// 组件局部样式
</style>
```

## 使用方式

在主项目中使用打包后的组件：

```javascript
// 导入组件
import Layout, { InnerLink } from '@/layout/dist/index'
// 导入样式
import '@/layout/dist/index.css'
```

## 注意事项

1. **样式处理**：
    - 确保 `rollup-plugin-postcss` 正确配置
    - 样式文件需要在主项目中手动导入
    - 考虑使用 `scoped` 样式避免冲突

2. **组件导出**：
    - 使用明确的导入导出语法
    - 为组件添加 `name` 属性
    - 使用 `exports: 'named'` 支持命名导出

3. **依赖处理**：
    - 将 Vue 等主要依赖设置为 external
    - 正确处理 node_modules 中的依赖

4. **构建优化**：
    - 使用 sourcemap 便于调试
    - 配置 terser 进行代码压缩
    - 合理设置 external 避免重复打包

## 调试技巧

1. 使用 sourcemap 进行源码调试
2. 使用 `rollup -c -w` 进行开发时热重载
3. 检查生成的 dist 目录确保文件正确生成

## 常见问题

1. **样式不生效**：
    - 检查样式是否正确提取
    - 确认主项目是否导入了样式文件
    - 验证样式选择器是否正确

2. **组件无法导入**：
    - 检查导出语法是否正确
    - 确认 rollup 配置中的 `exports` 设置
    - 验证构建文件是否正确生成

## 参考资料

- [Rollup 官方文档](https://rollupjs.org/)
- [Vue SFC 规范](https://v3.vuejs.org/guide/single-file-component.html)
- [rollup-plugin-vue 文档](https://rollup-plugin-vue.vuejs.org/)
