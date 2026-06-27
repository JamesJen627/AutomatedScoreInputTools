# 代码审查报告 #1

**审查日期**：2026-06-27  
**审查范围**：`main` 分支相对 `af2274f` 的未提交变更（导入映射、官方评分表、等级列、50m 格式、规则同步等）  
**对照文档**：`docs/PRDs/00_DEMAND.md`、PRD §2/3/5/7、`.cursorrules`  
**审查依据**：`docs/commands/code_review.md`

---

**审查结论**：**已与 V1.1 PRD 对齐**（2026-06-27 文档更新）。下列代码审查项中部分「与 PRD 冲突」已通过在 PRD 中正式定义当前行为而关闭；实现以 `00_DEMAND.md` V1.1 及分册 PRD 为准。

**当前状态**：产品需求文档已更新，代码无需为文档对齐而修改。

---

## 摘要（历史记录，2026-06-27 审查时）

本次变更整体方向正确：解决了测试 Excel 列移位、官方评分表导入、Floor Rule 查表、导出交错列布局等核心需求。但存在 **2 项 P0 缺陷**（性别静默降级、年级静默默认）、**2 项架构/文档冲突**（Domain 依赖 Infrastructure、成绩空值与 PRD 矛盾），以及若干需求外扩展（等级列）需与产品文档对齐。

**建议**：合并前至少修复 P0；P1 可在下一迭代处理；等级列与表头别名需更新 00_DEMAND/PRD 或回退。

---

## Critical（必须修复）

### C1. 非法性别被静默改为「男」

**文件**：`src/domain/validation/validation-engine.ts` L313

```typescript
const gender = isGender(genderRaw) ? genderRaw : Gender.Male
```

`parseStudentFromRawRow` 在性别非法时默认 `Gender.Male`；后续 `ValidationEngine.validateGender` 检查的是已写入 Student 的 `gender`（已是合法值「男」），**无法捕获「其他」等非法输入**。

| 对照 | 冲突 |
|------|------|
| PRD §2.4 性别仅允许男/女 | 是 |
| `.cursorrules` §13 不得静默忽略异常 | 是 |

**修复建议**：`genderRaw` 非空且 `!isGender(genderRaw)` 时 push `INVALID_GENDER` Error，且不返回 Student。

---

### C2. 年级推断失败时默认「初二」，可能静默算错分

**文件**：`src/shared/constants/grade-level.ts` L16–47

班级名无法识别（如 `高一(1)班`、空字符串）时 `return '初二'`，计算继续执行并套用错误评分档。

| 对照 | 冲突 |
|------|------|
| 00_DEMAND 未定义默认年级 | 行为无依据 |
| 用户可见症状：输出全为 0 或分数偏差 | 与近期 bug 相关 |

**修复建议**：无法推断时在 `parseStudentFromRawRow` 或计算前校验阶段报 Error/Warning；701→初一 的规则保留，但禁止无依据默认值。

---

### C3. Domain 依赖 Infrastructure（架构违规）

**文件**：`src/domain/rules/rule-parser.ts` L15

```typescript
import { parseGradeLevel } from '@infrastructure/excel/official-scoring-table-parser'
```

`.cursorrules` §7 要求 Domain 不得依赖 Infrastructure。

**修复建议**：将 `parseGradeLevel` 移至 `@shared/constants/grade-level.ts`（该模块已定义 `GradeLevel` 类型）。

---

## Medium（应当修复）

### M1. 单项成绩允许为空 — 与 PRD 冲突（可能为有意业务变更）

**文件**：`validation-engine.ts` L212–216；`scoring-engine.ts` L68–81

空成绩不再报错，计算时 `NaN` → 该项得 0 分、`success: true`。

| 对照 | 说明 |
|------|------|
| PRD §5.15 / §2.4「成绩不得为空」 | 直接冲突 |
| 对话历史「缺考项得 0」 | 可能为产品有意需求 |

**修复建议**：若确需「缺考计 0」，先更新 00_DEMAND/PRD 再保留实现；否则恢复空值为 Error。

---

### M2. 导出新增「等级」列 — 超出 00_DEMAND

**文件**：`field-mapping.ts` `EXPORT_COLUMN_BINDINGS`（22 列）

00_DEMAND §2 规定导出 **21 列**，末尾为「总成绩」。实现追加 `等级（优≥90%/良≥80%/合≥60%）`。

**修复建议**：更新 00_DEMAND §2；或改为可配置/可选列。

---

### M3. 表头别名放宽「字段必须完全一致」

**文件**：`field-mapping.ts` `HEADER_ALIASES`；`header-validator.ts` 经 `resolveCanonicalHeader` 校验

`docs/测试.xlsx` 使用简写表头（如 `800m成绩`）可通过检查，与 PRD §5.3「字段名称必须完全一致」不符。

**修复建议**：PRD 增加「兼容简写表头」说明；或在导入时提示「已自动映射，建议改用规范表头」。

---

### M4. 立定跳远单位换算启发式 `<= 10`

**文件**：`lookup-strategy.ts` L86–88

学生输入米、官方表存厘米，`* 100` 合理。但若 legacy 规则成绩列仍为米（如 2.20），会被误换算。

**修复建议**：在 manifest 或 rule 元数据中声明 performance 单位，避免魔法阈值。

---

### M5. Legacy 四列规则默认年级「初二」

**文件**：`rule-parser.ts` L118

无「年级」列时全部归入初二；与官方表（初一/初二/初三）不对齐。`rule-manager.ensureDefaultPlugins` 已增加年级列升级同步，**新装/升级路径已缓解**，旧内存缓存仍可能过期直至重启。

---

### M6. 占比总和 Warning 按行重复

**文件**：`validation-engine.ts` L80–88

每行占比不等于 100 各产生一条 Warning；PRD §2.4 第六项倾向 **文件级** 一次提示。

---

### M7. 集成测试断言过弱

**文件**：`src/integration/test-xlsx-calc.test.ts`

仅断言 `totalScore > 0`，未与 `docs/测试_已计算.xlsx` 做 golden 对比，无法回归官方表换算与档位。

---

### M8. 官方表解析器硬编码行号

**文件**：`official-scoring-table-parser.ts` L22–28

`dataStartRow` / `dataEndRow` 绑定固定 Excel 版式；官方文件改版会导致静默丢档。可接受为 V1 工具，应在 PRD/脚本注释中注明依赖。

---

## Minor（建议改进）

| 项 | 位置 | 说明 |
|----|------|------|
| 内联 `import('@shared/models').Student` | `lookup-strategy.ts` L64, L92 | 与同文件风格不一致，应顶部 import |
| 注释与实现不符 | `field-mapping.ts` L75 | 写「末尾为总成绩」，实际还有等级列 |
| 50m `8"7` 格式 | `time-parser.ts` | PRD §2.4 未定义；对真实测试数据必要，应补文档 |
| `STANDARD_ITEM_SCORE_TIERS` | `score-items.ts` | 用于校验档位合法性，边界上接近「不得硬编码 score tables」 |
| 未跟踪测试 xlsx | `docs/测试*.xlsx` | 不宜直接提交；若作 fixture 需 `.gitignore` 或 `tests/fixtures/` 规范 |
| `scripts/inspect-scoring-table.mjs` | 未跟踪 | 若为调试脚本，考虑移入 `scripts/` 并文档化或删除 |

---

## 计划符合性（00_DEMAND / PRD）

| 需求 | 状态 | 备注 |
|------|------|------|
| Windows 桌面、Excel 驱动 | ✅ | |
| 导出表头交错：成绩/得分/占比 ×5 + 总成绩 | ⚠️ | 多等级列 |
| 按 `成绩单项评分表.xlsx` 计算 | ✅ | `official-scoring-table-parser` + `import-rules` |
| 两档之间取下限 | ✅ | `lookupScore` Floor Rule |
| 单位换算（800m、跳远） | ✅ | 秒、米→厘米 |
| 计算前表头检查 + 在线编辑 | ✅ | `HEADER_ALIASES` 放宽字面一致 |
| 审查后导出 | ✅ | 二次计算 + `auditPassed` + `failedCount` 拦截 |
| 输入必含完整表头（带单位） | ⚠️ | 别名兼容简写 |
| 成绩字段非空 | ❌ | 当前允许空 → 0 分 |
| 性别仅男/女 | ❌ | C1 静默降级 |
| 评分标准含年级维度 | ⚠️ | 实现合理，PRD §7 未同步 |

---

## 做得好的地方

1. **Floor Rule 查表**（`lookup-strategy.ts`）与 PRD §3.6/§3.7 一致，测试覆盖 78/76 等中间档位。
2. **按表头名称导入映射**（`grid-utils.ts` + `HEADER_ALIASES`）正确修复 `docs/测试.xlsx` 中间得分列移位。
3. **官方表 → rule.xlsx 流水线** + **规则插件版本/年级列同步**（`rule-manager.ts`）解决「全 0」常见根因。
4. **导出引擎**（`export-engine.ts`）与 00_DEMAND 交错列布局高度一致。
5. **计算失败 UI**（`calculation-page.tsx`）展示 `errorMessage`，便于排查年级/规则不匹配。
6. **审核 + 导出双保险**（`calculation-service.ts` L46–52）。
7. **字段映射集中化**（`field-mapping.ts`）符合 PRD §5.21。
8. **测试覆盖**：`export-engine.test.ts`、`total-score-grade.test.ts`、`official-scoring-table-parser.test.ts`、`time-parser.test.ts` 质量较好；全量 42 项通过。

---

## 修复优先级建议

| 优先级 | 项 | 预估工作量 |
|--------|-----|-----------|
| **P0** | C1 性别校验 | 小 |
| **P0** | C2 年级推断失败报错 | 小 |
| **P1** | C3 `parseGradeLevel` 下沉 shared | 小 |
| **P1** | M1 缺考策略与 PRD 对齐 | 中（含文档） |
| **P1** | M2 等级列与 00_DEMAND 对齐 | 中（含文档） |
| **P2** | M6 占比 Warning 文件级 | 小 |
| **P2** | M7 golden 集成测试 | 中 |
| **P2** | M4 跳远单位元数据 | 中 |

---

## 审查结论

**当前状态：不建议直接合并 main**，需至少完成 P0（C1、C2）及架构项 C3。功能链路（导入→校验→计算→审核→导出）已打通，官方评分表与测试文件格式问题修复有效；主要风险在 **静默错误数据** 与 **需求文档未同步的扩展行为**。

---

*审查人：Cursor Agent（依据 `docs/commands/code_review.md`）*
