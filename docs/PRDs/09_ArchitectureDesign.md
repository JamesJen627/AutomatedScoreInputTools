# 第九章 系统架构设计（System Architecture Design）

Version：V1.0

---

# 9.1 设计目标

系统采用模块化（Modular）、分层（Layered）架构设计，实现高内聚、低耦合。

架构设计目标：

- 易维护
- 易扩展
- 易测试
- 易跨平台（Windows → macOS → Ubuntu → Android）
- 业务逻辑与 UI 分离
- 评分算法独立
- 配置统一管理

任何模块不得承担多个职责。

---

# 9.2 总体架构

系统采用四层架构：

```text
┌────────────────────────────┐
│        UI Layer            │
│ 页面、菜单、Excel编辑器      │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│     Application Layer      │
│ 导入、检查、计算、导出流程   │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│      Domain Layer          │
│ 校验引擎、评分引擎、审核引擎 │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│ Infrastructure Layer       │
│ Excel、配置、日志、文件系统 │
└────────────────────────────┘

```

---

# 9.3 模块划分

系统划分为以下核心模块：

1. UI 模块（UI）
2. Excel 解析模块（Excel Parser）
3. 数据校验模块（Validation Engine）
4. 评分引擎（Scoring Engine）
5. 审核引擎（Audit Engine）
6. 导出模块（Export Engine）
7. 评分标准管理（Rule Manager）
8. 配置管理（Configuration Manager）
9. 日志管理（Log Manager）

每个模块职责唯一，不得跨模块实现业务逻辑。

---

# 9.4 模块依赖关系

依赖关系如下：

```text
UI
 │
 ▼
Application
 │
 ├── Validation Engine
 ├── Scoring Engine
 ├── Audit Engine
 ├── Export Engine
 ├── Rule Manager
 └── Configuration Manager

所有业务模块
        │
        ▼
Infrastructure

```

禁止：

- UI 直接调用 Excel 文件。
- UI 直接操作评分标准。
- UI 直接修改日志。
- Excel 模块调用评分引擎。

---

# 9.5 数据流

系统数据流固定如下：

```text
导入 Excel
      │
      ▼
Excel Parser
      │
      ▼
Student Dataset
      │
      ▼
Validation Engine
      │
      ▼
Excel Editor
      │
      ▼
Scoring Engine
      │
      ▼
Audit Engine
      │
      ▼
Calculation Result
      │
      ▼
Export Engine
      │
      ▼
输出 Excel

```

数据流必须单向流动，不允许逆向修改。

---

# 9.6 模块职责

## UI Layer

负责：

- 页面展示
- 用户交互
- 状态显示
- 错误提示

不得：

- 实现评分算法
- 读取 Excel
- 修改配置文件

---

## Validation Engine

负责：

- 表头检查
- 数据格式检查
- 重复检查
- 空值检查

输出：

ValidationResult。

---

## Scoring Engine

负责：

- 查表
- 得分计算
- 加权计算
- 总成绩计算

不得依赖 UI。

---

## Audit Engine

负责：

- 二次计算
- 对比结果
- 审核一致性
- 输出审核报告

---

## Export Engine

负责：

- 写入 Excel
- 导出文件
- 文件命名
- 导出报告

---

# 9.7 模块通信

模块之间通过统一接口通信。

禁止模块之间直接访问内部对象。

例如：

```text
UI
 ↓
ApplicationService
 ↓
ScoringEngine.Calculate()
 ↓
CalculationResult

```

所有调用均应返回明确结果对象，不得依赖全局变量。

---

# 9.8 目录结构（建议）

```text
src/
├── app/
├── ui/
├── domain/
│   ├── scoring/
│   ├── validation/
│   ├── audit/
│   └── rules/
├── infrastructure/
│   ├── excel/
│   ├── config/
│   ├── logger/
│   └── storage/
├── shared/
│   ├── models/
│   ├── types/
│   ├── utils/
│   └── constants/
└── main/

```

目录职责必须清晰，不得混放业务逻辑。

---

# 9.9 可扩展性要求

架构必须支持：

- 新增评分项目
- 新增评分标准
- 新增导出格式
- 新增操作系统平台
- 新增语言

新增功能不得修改核心评分引擎。

---

# 9.10 架构约束

系统必须遵循以下约束：

1. UI 与业务逻辑分离。
2. 评分算法可独立单元测试。
3. 所有配置统一管理。
4. 所有文件操作统一由基础设施层完成。
5. 所有模块均支持依赖注入（Dependency Injection）。
6. 不允许循环依赖。
7. 所有核心模块必须具备清晰接口定义。

---

# 9.11 跨平台预留

虽然 V1.0 仅支持 Windows，但架构必须避免依赖 Windows 专有 API。

所有文件、路径和系统调用均通过抽象接口封装，为后续支持 macOS、Ubuntu 和 Android 做准备。

---

# 9.12 架构设计原则

系统整体遵循以下原则：

- Single Responsibility Principle（单一职责）
- Open/Closed Principle（开闭原则）
- Dependency Inversion Principle（依赖倒置）
- Interface Segregation Principle（接口隔离）
- High Cohesion, Low Coupling（高内聚、低耦合）

所有新增功能必须符合上述架构原则，不得破坏已有模块边界。



**9.13《AI 开发约束（AI Development Constraints）》**。

明确要求 Cursor：

- **禁止**在多个模块重复实现同一逻辑。
- **禁止**将业务逻辑写入 UI 页面。
- **禁止**硬编码评分标准、字段名称或路径。
- **必须**优先复用已有模块和工具函数。
- **新增功能前必须检查是否已有同类实现**，避免重复代码。
- **任何涉及评分算法的修改，都必须保持向后兼容并通过已有单元测试**。

