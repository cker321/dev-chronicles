# AI驱动的大屏组件开发规范

## 目录

1. [概述](#1-概述)
2. [开发流程概览](#2-开发流程概览)
3. [组件元数据规范](#3-组件元数据规范)
4. [AI控制接口](#4-ai控制接口)
5. [组件设计原则](#5-组件设计原则)
6. [AI指令适配层](#6-ai指令适配层)
7. [组件文档要求](#7-组件文档要求)
8. [测试规范](#8-测试规范)
9. [组件注册机制](#9-组件注册机制)
10. [最佳实践](#10-最佳实践)
11. [示例实现](#11-示例实现)
12. [版本控制与更新](#12-版本控制与更新)
13. [安全考虑](#13-安全考虑)

## 1. 概述

本规范旨在定义ROF平台中支持AI指令生成和控制的大屏组件开发标准，确保所有组件能够被AI系统有效识别、生成和操控。通过遵循本规范，开发者可以创建与AI系统无缝集成的可视化组件。

## 2. 开发流程概览

开发一个AI可控组件的基本流程如下：

1. **定义组件元数据**：明确组件的基本信息和能力
2. **实现AI控制接口**：提供标准化的AI交互方法
3. **遵循设计原则**：确保组件具有自描述性、良好的状态管理等
4. **创建AI指令映射**：将自然语言指令映射到组件API
5. **编写文档**：提供全面的API和AI指令文档
6. **测试验证**：确保组件正确响应AI指令
7. **注册组件**：向AI系统注册组件及其能力

## 3. 组件元数据规范

### 3.1 基础元数据

每个组件必须包含以下元数据：

```typescript
interface ComponentMeta {
  // 组件唯一标识
  id: string;
  // 组件名称（人类可读）
  name: string;
  // 组件类型（图表、地图、表格等）
  type: ComponentType;
  // 组件描述（用于AI理解组件用途）
  description: string;
  // 组件能力标签（用于AI匹配指令）
  capabilities: string[];
  // 组件版本
  version: string;
  // 组件作者
  author: string;
}
```

## 4. AI控制接口

每个组件必须实现以下AI控制接口：

```typescript
interface AIControlInterface {
  // 接收AI指令并执行
  executeAICommand(command: AICommand): Promise<AICommandResult>;
  
  // 获取组件当前状态
  getState(): ComponentState;
  
  // 设置组件状态
  setState(state: ComponentState): Promise<void>;
  
  // 获取组件支持的指令列表
  getSupportedCommands(): AICommandSchema[];
}
```

## 5. 组件设计原则

### 5.1 自描述性

- 组件必须提供详细的自描述信息，包括功能、参数、事件等
- 使用标准化的术语描述组件功能，便于AI理解

### 5.2 状态管理

- 组件状态必须可序列化，以便于AI系统读取和修改
- 提供清晰的状态变更API，支持增量更新

### 5.3 参数化配置

- 所有视觉和行为特性必须参数化
- 参数必须有明确的类型定义、取值范围和默认值
- 参数应分层次组织，便于AI理解和操作

```typescript
interface ComponentProps {
  // 基础属性
  basic: {
    width: number;
    height: number;
    x: number;
    y: number;
    visible: boolean;
    // ...
  };
  
  // 样式属性
  style: {
    backgroundColor: string;
    borderRadius: number;
    // ...
  };
  
  // 数据属性
  data: {
    source: DataSource;
    mapping: DataMapping;
    // ...
  };
  
  // 交互属性
  interaction: {
    clickable: boolean;
    draggable: boolean;
    // ...
  };
}
```

### 5.4 事件系统

- 定义标准化的事件接口，支持AI监听和触发事件
- 事件应包含丰富的上下文信息

```typescript
interface ComponentEvent {
    type: string;
    source: string; // 组件ID
    timestamp: number;
    data: any; // 事件相关数据
}
```

## 4. AI指令适配层

### 4.1 指令模式

每个组件需实现以下指令模式：

- **查询模式**：返回组件信息或状态
- **设置模式**：修改组件属性或状态
- **动作模式**：执行特定操作
- **订阅模式**：监听组件事件

### 4.2 指令格式

```typescript
interface AICommand {
    // 指令类型
    type: 'query' | 'set' | 'action' | 'subscribe';
    // 目标属性/动作
    target: string;
    // 参数
    params?: any;
    // 上下文信息
    context?: AIContext;
}
```

### 4.3 指令映射表

每个组件必须提供指令映射表，将自然语言指令映射到组件API：

```typescript
interface CommandMapping {
    // 指令模式
    pattern: string | RegExp;
    // 处理函数
    handler: (matches: string[], context: AIContext) => Promise<any>;
    // 示例
    examples: string[];
    // 描述
    description: string;
}
```

## 5. 组件文档要求

### 5.1 API文档

- 完整的属性、方法、事件文档
- 每个API必须包含参数类型、返回值、示例代码

### 5.2 AI指令文档

- 支持的AI指令列表
- 每个指令的格式、参数、示例
- 指令的限制和边界条件

### 5.3 示例集

- 提供多样化的使用示例
- 包含AI指令示例和预期结果

## 6. 测试规范

### 6.1 AI指令测试

- 为每个支持的AI指令创建测试用例
- 测试不同参数组合和边界条件

### 6.2 交互测试

- 测试组件对AI指令的响应性
- 测试组件状态变更后的渲染正确性

## 7. 组件注册机制

组件必须向AI系统注册其元数据和能力：

```typescript
// 组件注册示例
AIRegistry.registerComponent({
    id: 'chart-line',
    name: '折线图',
    type: 'chart',
    description: '用于展示数据趋势变化的折线图组件',
    capabilities: ['数据可视化', '趋势分析', '多系列比较'],
    version: '1.0.0',
    author: 'ROF Team',
    commandMappings: [
        {
            pattern: '显示(最近|过去)\\s?(\\d+)\\s?(天|小时|分钟)的数据',
            handler: async (matches, context) => {
                // 处理逻辑
            },
            examples: ['显示最近7天的数据', '显示过去24小时的数据'],
            description: '根据时间范围筛选并显示数据'
        },
        // 更多指令映射...
    ]
});
```

## 8. 最佳实践

### 8.1 组件设计

- 组件功能应单一，避免过于复杂
- 提供合理的默认值，减少配置负担
- 设计时考虑AI可控性和可解释性

### 8.2 错误处理

- 提供友好的错误信息，便于AI理解和处理
- 实现优雅的降级机制，避免组件崩溃

### 8.3 性能优化

- 组件应响应迅速，避免长时间运算
- 大数据量处理应支持分页或流式处理

## 9. 示例

### 9.1 地图组件AI适配示例

```typescript
// 地图组件AI指令映射
const mapCommandMappings: CommandMapping[] = [
    {
        pattern: '(显示|切换到)(.+)地图',
        handler: async (matches, context) => {
            const mapType = matches[2];
            return await this.switchMapType(mapType);
        },
        examples: ['显示卫星地图', '切换到地形图'],
        description: '切换地图类型'
    },
    {
        pattern: '(放大|缩小)(\\d+)倍',
        handler: async (matches, context) => {
            const action = matches[1];
            const factor = parseInt(matches[2]);
            return action === '放大'
                ? await this.zoomIn(factor)
                : await this.zoomOut(factor);
        },
        examples: ['放大2倍', '缩小3倍'],
        description: '调整地图缩放级别'
    },
    {
        pattern: '(定位到|飞行到|显示)(.+)的位置',
        handler: async (matches, context) => {
            const location = matches[2];
            return await this.locatePlace(location);
        },
        examples: ['定位到北京的位置', '飞行到上海'],
        description: '将地图中心定位到指定位置'
    }
];
```

### 9.2 图表组件AI适配示例

```typescript
// 图表组件AI指令映射
const chartCommandMappings: CommandMapping[] = [
    {
        pattern: '(切换|显示)(为)?(.+)(图|图表|视图)',
        handler: async (matches, context) => {
            const chartType = matches[3];
            return await this.switchChartType(chartType);
        },
        examples: ['切换为柱状图', '显示折线图'],
        description: '切换图表类型'
    },
    {
        pattern: '(显示|隐藏)(图例|标签|网格线)',
        handler: async (matches, context) => {
            const action = matches[1];
            const element = matches[2];
            const visible = action === '显示';

            switch(element) {
                case '图例': return await this.toggleLegend(visible);
                case '标签': return await this.toggleLabels(visible);
                case '网格线': return await this.toggleGrid(visible);
            }
        },
        examples: ['显示图例', '隐藏网格线'],
        description: '控制图表元素的显示和隐藏'
    }
];
```

## 10. 版本控制与更新

- 组件版本必须遵循语义化版本规范
- 版本更新时必须提供完整的变更日志
- 确保向后兼容性，避免破坏性更新

## 11. 安全考虑

- AI指令执行前必须进行权限验证
- 敏感操作需要额外确认机制
- 实现操作审计日志，记录AI指令执行情况
