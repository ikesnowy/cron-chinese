# cron-chinese

一个将 Cron 转换为中文的工具。

## Usage

```typescript
import {humanizeCronInChinese} from "cron-chinese";

humanizeCronInChinese('* * * * *'); // 每分钟
humanizeCronInChinese('0 0 * * *'); // 每日00:00
humanizeCronInChinese('0 0 1 * *'); // 每月1日00:00
humanizeCronInChinese('*/2 * * * *'); // 每隔2分钟
```
