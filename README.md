# cron-chinese

一个将 Cron 转换为中文的工具。

[![npm](https://img.shields.io/npm/v/cron-chinese?logo=npm&style=flat-square)](https://www.npmjs.com/package/cron-chinese)

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
```

更多示例请查看测试文件：[index.spec.js](https://github.com/ikesnowy/cron-chinese/blob/main/spec/index.spec.js)
