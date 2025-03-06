# Element Plus 自定义命名空间配置最佳实践

## 概述

Element Plus 允许开发者自定义组件的 CSS 类名前缀（命名空间），从默认的 `el-` 更改为自定义前缀。本文档总结了在 Vue 3 + Vite 项目中正确配置 Element Plus 命名空间的经验和最佳实践。

## 配置步骤

### 1. 创建自定义命名空间 SCSS 配置文件

首先，创建一个专门的 SCSS 文件来设置命名空间：

```scss
// src/lib/assets/styles/el-plus/index.scss
@forward 'element-plus/theme-chalk/src/mixins/config.scss' with (
  $namespace: 'rof'
);
```

### 2. 创建统一样式入口文件

创建一个统一的样式入口文件，使用 `@use` 指令正确引入自定义命名空间和 Element Plus 样式：

```scss
// src/lib/assets/styles/element-plus.scss
// 首先导入自定义命名空间配置
@use './el-plus/index.scss' as *;

// 然后导入 Element Plus 的样式，但使用我们的自定义命名空间
@use 'element-plus/theme-chalk/src/index.scss' as *;
```

### 3. 配置 Vite 预处理器选项

在 `vite.config.ts` 中配置 SCSS 预处理器选项：

```typescript
// vite.config.ts
css: {
  preprocessorOptions: {
    scss: {
      // 确保在所有 SCSS 文件中首先加载自定义命名空间配置
      additionalData: `@use "@/lib/assets/styles/el-plus/index.scss" as *;`,
      implementation: sass,
    },
  },
  // 确保 CSS 提取和优化配置
  extract: {
    // 防止 CSS 被拆分成多个文件
    ignoreOrder: true,
  },
}
```

### 4. 在组件中正确导入样式

在主要入口文件或组件控制器中导入统一样式入口：

```typescript
// src/lib/core/ComponentController.ts
import ElementPlus from 'element-plus';
// 不直接导入默认样式，避免覆盖自定义命名空间
// import 'element-plus/dist/index.css';
// import 'element-plus/theme-chalk/src/index.scss'

// 导入统一样式入口
import '@/lib/assets/styles/element-plus.scss'
```

### 5. 使用 ElConfigProvider 包裹根组件

在应用的根组件中使用 `ElConfigProvider` 包裹内容，并设置相同的命名空间：

```vue
<template>
  <el-config-provider namespace="rof">
    <!-- 应用内容 -->
  </el-config-provider>
</template>

<script setup>
import { ElConfigProvider } from 'element-plus';
</script>
```

## 关键点和注意事项

1. **使用 `@use` 而非 `@import`**：
    - SCSS 中使用 `@use` 指令而非 `@import` 是关键，这确保了命名空间配置能够正确应用到所有导入的样式中。
    - `@use` 指令会在编译时应用配置，而 `@import` 可能导致配置不一致。

2. **样式导入顺序**：
    - 自定义命名空间配置必须在 Element Plus 样式之前导入。
    - 在统一入口文件中，先 `@use` 命名空间配置，再 `@use` Element Plus 样式。

3. **避免多次导入**：
    - 避免在多个地方直接导入 Element Plus 的默认样式，这会导致命名空间配置失效。
    - 移除所有 `import 'element-plus/dist/index.css'` 和 `import 'element-plus/theme-chalk/src/index.scss'` 的直接导入。

4. **全局配置**：
    - 只需在应用的根组件中使用一次 `ElConfigProvider`，不需要在每个组件中都添加。
    - 确保 JS 端（通过 `ElConfigProvider`）和 CSS 端（通过 SCSS 变量）的命名空间值一致。

5. **构建配置**：
    - 在 Vite 配置中使用 `additionalData` 确保所有 SCSS 文件都能访问到自定义命名空间。
    - 使用 `extract.ignoreOrder: true` 防止 CSS 提取过程中的顺序问题。

## 故障排除

1. **DOM 节点类名正确但 CSS 选择器不匹配**：
    - 检查是否有多个版本的 Element Plus 样式被导入
    - 确认样式导入顺序是否正确
    - 验证 Vite 构建配置中的 CSS 提取设置

2. **Storybook 和生产构建表现不一致**：
    - 确保 Storybook 和 Vite 使用相同的 SCSS 配置
    - 检查两个环境中的样式导入顺序

3. **样式冲突**：
    - 使用浏览器开发工具检查是否有样式规则被覆盖
    - 确认自定义样式的优先级是否足够高

## 总结

正确配置 Element Plus 的自定义命名空间需要同时满足多个条件：正确的 SCSS 导入方式（使用 `@use`）、合适的导入顺序、一致的命名空间值，以及在根组件中使用 `ElConfigProvider`。通过遵循这些最佳实践，可以确保自定义命名空间在开发和生产环境中都能正确应用。

## 补充说明

在 Vue 组件中，如果已经在应用根组件中设置了 `ElConfigProvider`，则不需要在每个子组件中重复设置。移除多余的 `ElConfigProvider` 标签可以避免潜在的命名空间冲突和嵌套问题。
