# 第五章 数据模型与 Excel 文件规范（Data Model & File Specification）

Version：V1.0

---

# 5.1 模块目标

本章定义系统所有数据对象、Excel 文件格式、评分标准文件格式及数据流转规范。

所有模块（Excel 导入、数据校验、评分引擎、导出模块）必须遵循本章定义。

未经本章定义的数据结构不得进入系统。

---

# 5.2 数据流

整个系统的数据流如下：

```text
成绩Excel

↓

Excel Parser（解析器）

↓

Student Dataset（学生数据集）

↓

Validation Engine（校验引擎）

↓

Scoring Engine（评分引擎）

↓

Audit Engine（审核引擎）

↓

Calculation Result（计算结果）

↓

Export Engine（导出引擎）

↓

结果Excel

```

任何模块不得跨层直接访问数据。

---

# 5.3 输入 Excel 文件规范

## 支持格式

支持：

- .xlsx
- .xls

不支持：

- csv
- ods
- txt
- pdf

---

## 工作表要求

默认读取：

第一个工作表（Sheet1）。

V1.0 不支持多个工作表同时计算。

若工作表为空：

禁止导入。

---

## 表头要求

输入 Excel 必须包含以下字段：


| 字段名称           | 是否必填 | 类型      | 示例       |
| -------------- | ---- | ------- | -------- |
| 班级             | √    | String  | 高二(1)班   |
| 考号             | √    | String  | 20250001 |
| 学号             | √    | String  | 20251234 |
| 姓名             | √    | String  | 张三       |
| 性别             | √    | Enum    | 男 / 女    |
| 坐位体前屈成绩（单位：厘米） | √    | Number  | 15.5     |
| 坐位体前屈得分占比      | √    | Number  | 20       |
| 800m成绩（单位：分·秒） | √    | String  | 3‘25’‘   |
| 800m得分占比       | √    | Number  | 20       |
| 50m成绩（单位：秒）    | √    | Number  | 7.58     |
| 50m得分占比        | √    | Number  | 20       |
| 立定跳远成绩（单位：米）   | √    | Number  | 2.31     |
| 立定跳远得分占比       | √    | Number  | 20       |
| 仰卧起坐成绩（单位：次）   | √    | Integer | 45       |
| 仰卧起坐得分占比       | √    | Number  | 20       |


字段名称必须完全一致。

不得修改字段名称。

不得增加前后空格。

---

# 5.4 输出 Excel 文件规范

导出时保留原始字段。

新增以下字段：


| 字段名称    |
| ------- |
| 坐位体前屈得分 |
| 800m得分  |
| 50m得分   |
| 立定跳远得分  |
| 仰卧起坐得分  |
| 总成绩     |


新增字段顺序必须固定。

不得调整原字段顺序。

---

# 5.5 Student 数据模型

系统内部统一采用 Student 对象。

字段如下：


| 字段                 | 类型        | 必填  |
| ------------------ | --------- | --- |
| className          | String    | √   |
| examNumber         | String    | √   |
| studentNumber      | String    | √   |
| name               | String    | √   |
| gender             | Enum      | √   |
| sitReach           | Number    | √   |
| sitReachWeight     | Number    | √   |
| run800             | Number（秒） | √   |
| run800Weight       | Number    | √   |
| run50              | Number    | √   |
| run50Weight        | Number    | √   |
| standingJump       | Number    | √   |
| standingJumpWeight | Number    | √   |
| sitUp              | Integer   | √   |
| sitUpWeight        | Number    | √   |


说明：

800m 在进入系统后统一转换为秒存储。

导出时再恢复为 mm'ss'' 格式。

---

# 5.6 Calculation Result 数据模型

每位学生计算后新增：


| 字段                | 类型       |
| ----------------- | -------- |
| sitReachScore     | Number   |
| run800Score       | Number   |
| run50Score        | Number   |
| standingJumpScore | Number   |
| sitUpScore        | Number   |
| totalScore        | Number   |
| auditStatus       | Enum     |
| calculateTime     | DateTime |


---

# 5.7 Validation Result 数据模型

校验完成后生成：


| 字段         | 类型      |
| ---------- | ------- |
| rowIndex   | Integer |
| columnName | String  |
| level      | Enum    |
| errorCode  | String  |
| message    | String  |
| suggestion | String  |


错误等级：

- Error
- Warning
- Info

---

# 5.8 Audit Result 数据模型

审核结果包括：


| 字段                | 类型      |
| ----------------- | ------- |
| auditPassed       | Boolean |
| firstCalculation  | Number  |
| secondCalculation | Number  |
| difference        | Number  |
| reason            | String  |


若 difference ≠ 0：

审核失败。

---

# 5.9 日志数据模型

日志字段：


| 字段               | 类型       |
| ---------------- | -------- |
| logId            | UUID     |
| createTime       | DateTime |
| fileName         | String   |
| studentCount     | Integer  |
| successCount     | Integer  |
| failedCount      | Integer  |
| duration         | Number   |
| scoreRuleVersion | String   |
| status           | Enum     |


---

# 5.10 配置数据模型

系统配置包括：


| 字段               | 类型      |
| ---------------- | ------- |
| scoreRulePath    | String  |
| exportPath       | String  |
| autoSave         | Boolean |
| autoCheck        | Boolean |
| decimalPlaces    | Integer |
| logRetentionDays | Integer |


配置保存在本地。

V1.0 不支持云同步。

---

# 5.11 评分标准文件规范

评分标准文件必须为 Excel。

支持动态替换。

文件必须包含：

- 项目名称
- 性别
- 成绩
- 得分

评分标准文件不得修改列结构。

系统启动时自动解析。

解析失败：

禁止计算。

---

# 5.12 数据唯一性

系统唯一标识：

优先：

学号

其次：

考号

姓名不得作为唯一标识。

---

# 5.13 数据排序

导入顺序：

保持原 Excel 顺序。

计算过程中：

不得排序。

导出时：

保持导入顺序。

---

# 5.14 数据精度

坐位体前屈：

保留一位小数。

50米：

保留两位小数。

800米：

保留 mm。

立定跳远：

保留两位小数。

仰卧起坐：

整数。

总成绩：

保留两位小数。

---

# 5.15 空值策略

所有成绩字段：

禁止为空。

若为空：

Error。

不得自动补零。

不得自动推测。

---

# 5.16 数据缓存

系统运行期间：

Student Dataset 保存在内存。

关闭软件：

释放缓存。

仅配置、日志和自动恢复数据写入本地存储。

---

# 5.17 数据安全

系统不得修改原始 Excel 文件。

所有修改均在内存副本中完成。

仅当用户点击：

"保存"

或

"导出"

时生成新的文件。

原始文件始终保持不变。

---

# 5.18 数据生命周期

```text
导入Excel

↓

解析

↓

校验

↓

编辑

↓

重新校验

↓

计算

↓

审核

↓

导出

↓

释放内存

```

每个阶段数据状态必须明确，不允许跳过流程。

---

# 5.19 文件命名规范

默认导出文件名：

原文件名_已计算.xlsx

例如：

高二体育成绩.xlsx

↓

高二体育成绩_已计算.xlsx

若文件已存在：

自动追加：

(1)

(2)

(3)

避免覆盖原文件。

---

# 5.20 数据一致性原则

系统必须保证：

1. 同一输入数据产生同一输出结果。
2. 导入与导出字段顺序一致。
3. 导出结果可再次导入系统继续计算。
4. 所有数据均可追溯到原始记录。
5. 所有计算结果均支持审核与复现。



5.21增加内容

## ① Excel 字段映射规范（Field Mapping）

不要让程序直接依赖中文字段。

例如：


| Excel表头        | 系统字段               |
| -------------- | ------------------ |
| 班级             | className          |
| 考号             | examNumber         |
| 学号             | studentNumber      |
| 姓名             | name               |
| 性别             | gender             |
| 坐位体前屈成绩（单位：厘米） | sitReach           |
| 坐位体前屈得分占比      | sitReachWeight     |
| 800m成绩（单位：分·秒） | run800             |
| 800m得分占比       | run800Weight       |
| 50m成绩（单位：秒）    | run50              |
| 50m得分占比        | run50Weight        |
| 立定跳远成绩（单位：米）   | standingJump       |
| 立定跳远得分占比       | standingJumpWeight |
| 仰卧起坐成绩（单位：次）   | sitUp              |
| 仰卧起坐得分占比       | sitUpWeight        |


这样以后如果 Excel 表头变了，只需要修改映射配置，不需要修改业务代码。

---

## ② Error Code 规范（错误码）

不要只有错误文字。

建议统一错误码，例如：


| 错误码  | 含义         |
| ---- | ---------- |
| E001 | 缺少必填表头     |
| E002 | 表头名称错误     |
| E003 | 单元格为空      |
| E004 | 成绩格式错误     |
| E005 | 性别非法       |
| E006 | 学号重复       |
| E007 | 考号重复       |
| E008 | 占比非法       |
| E009 | 评分标准缺失     |
| E010 | Excel 文件损坏 |


这样日志、测试、排查问题都会更规范。

---

## ③ 系统对象关系图（Data Relationship）

建议在 PRD 中加入一张对象关系图，例如：

```

```

```
ScoreRule
      │
      ▼
Student
      │
      ▼
ValidationResult
      │
      ▼
CalculationResult
      │
      ▼
AuditResult
      │
      ▼
ExportExcel
```

这张图对于 Cursor 理解整个系统的数据流非常有帮助，也为后续设计数据库、接口和单元测试提供了统一依据。

