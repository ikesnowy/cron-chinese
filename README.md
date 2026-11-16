# cron-chinese

一个将 Cron 转换为中文的工具。

[![npm](https://img.shields.io/npm/v/cron-chinese?logo=npm&style=flat-square)](https://www.npmjs.com/package/cron-chinese)

🌍 [在线演示](https://ikesnowy.github.io/cron-chinese/)

## 如何使用

```shell
npm install cron-chinese
```

```typescript
import { humanizeCronInChinese } from "cron-chinese";

humanizeCronInChinese('* * * * *'); // 每分钟
humanizeCronInChinese('0 0 * * *'); // 每日00:00
humanizeCronInChinese('0 0 1 * *'); // 每月1日00:00
humanizeCronInChinese('*/2 * * * *'); // 每隔2分钟
humanizeCronInChinese('45 4 1,10,20 * *') // 每月1,10,20日04:45
humanizeCronInChinese('0 0 * * */2'); // 每周日、二、四、六00:00
humanizeCronInChinese('0 0 * * MON-FRI/2'); // 每周一、三、五00:00
humanizeCronInChinese('0 0 * * 7'); // 每周日00:00（0 和 7 都表示周日）
```

### Quartz 风格

支持 Quartz cron（6~7 个字段：`秒 分 时 日 月 周 [年]`），默认按字段数量自动识别方言，也可以显式指定解析器：

```typescript
humanizeCronInChinese('0 0 9 * * ?'); // 每日09:00
humanizeCronInChinese('0 */5 * * * ?'); // 每隔5分钟
humanizeCronInChinese('0 0 9 ? * MON-FRI'); // 每周一~周五09:00
humanizeCronInChinese('0 0 0 ? * 2#2'); // 每月第2个周一00:00
humanizeCronInChinese('0 0 0 L * ?'); // 每月最后一天00:00
humanizeCronInChinese('0 0 0 15W * ?'); // 每月距离15日最近的工作日00:00
humanizeCronInChinese('0 30 10 * * ? 2024', { parser: 'quartz' }); // 2024年每日10:30
```

与 Linux crontab 的主要差异：

- 首字段为秒（0-59），可选的第 7 个字段为年。
- 周字段取值 1-7，且 1 = 周日（crontab 为 0-6）。
- 使用 `?` 表示「不指定」；支持 `L`（最后）、`W`（最近的工作日）、`#`（第几个周几）扩展语法。

翻译基于求值后的实际命中值而非语法字面，因此等价表达式会得到一致的输出（`MON-TUE,WED-FRI` 与 `MON-FRI` 均翻译为「每周一~周五」）；当未命中的星期远少于命中的星期且不连续时，会自动使用取反表达（`MON-FRI,SUN` → 「除周六外每日」）。

更多示例请查看测试文件：[index.spec.ts](https://github.com/ikesnowy/cron-chinese/blob/main/spec/index.spec.ts)、[quartz.spec.ts](https://github.com/ikesnowy/cron-chinese/blob/main/spec/quartz.spec.ts)
