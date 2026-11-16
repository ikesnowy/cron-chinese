import { describe, expect, it } from 'vitest';
import { humanizeCronInChinese, humanizeQuartz } from '../src';

// Quartz 与 crontab 的关键差异：首字段为秒、周字段 1-7（1=周日）、? 表示不指定、
// 可选的第 7 个字段为年、支持 L/W/# 扩展语法。
// 翻译基于求值后的实际命中值而非语法字面，等价表达式得到一致的输出。
describe('Quartz cron translation tests', () => {
  it('every minute at second 0', () => {
    expect(humanizeQuartz('0 * * * * ?')).toBe('每分钟');
  });
  it('every second', () => {
    expect(humanizeQuartz('* * * * * ?')).toBe('每秒');
  });
  it('every day at midnight (with seconds field)', () => {
    expect(humanizeQuartz('0 0 0 * * ?')).toBe('每日00:00');
  });
  it('specific time daily', () => {
    expect(humanizeQuartz('0 0 9 * * ?')).toBe('每日09:00');
  });
  it('specific time with seconds', () => {
    expect(humanizeQuartz('30 30 10 * * ?')).toBe('每日10:30:30');
  });
  it('every 5 minutes', () => {
    expect(humanizeQuartz('0 */5 * * * ?')).toBe('每隔5分钟');
  });
  it('every 5 seconds', () => {
    expect(humanizeQuartz('*/5 * * * * ?')).toBe('每隔5秒');
  });
  it('specific second within every minute', () => {
    expect(humanizeQuartz('30 * * * * ?')).toBe('每分钟的第30秒');
  });
  it('second list on clock time', () => {
    expect(humanizeQuartz('15,45 0 10 * * ?')).toBe('每日10:00的第15,45秒');
  });
  it('specific second with minute stepping', () => {
    expect(humanizeQuartz('10 */5 * * * ?')).toBe('每隔5分钟的第10秒');
  });
  it('first day of each month at noon', () => {
    expect(humanizeQuartz('0 0 12 1 * ?')).toBe('每月1日12:00');
  });
  it('day of month range', () => {
    expect(humanizeQuartz('0 0 0 1-5 * ?')).toBe('每月1-5日00:00');
  });
  it('day of month stepping from any', () => {
    expect(humanizeQuartz('0 0 0 */5 * ?')).toBe('每月每5日00:00');
  });
  it('day of month stepping with start', () => {
    expect(humanizeQuartz('0 0 0 3/2 * ?')).toBe('每月3日起，每隔2日00:00');
  });
  it('day of month list', () => {
    expect(humanizeQuartz('0 0 0 1,10,20 * ?')).toBe('每月1,10,20日00:00');
  });
  it('specific month', () => {
    expect(humanizeQuartz('0 0 0 * 3 ?')).toBe('3月每日00:00');
  });
  it('month range', () => {
    expect(humanizeQuartz('0 0 0 * 1-5 ?')).toBe('1-5月每日00:00');
  });
  it('month stepping from any', () => {
    expect(humanizeQuartz('0 0 0 * */3 ?')).toBe('每3个月每日00:00');
  });
  it('month stepping with start', () => {
    expect(humanizeQuartz('0 0 0 * MAR/2 ?')).toBe('3月起每2个月每日00:00');
  });
  it('month list', () => {
    expect(humanizeQuartz('0 0 0 * 1,4,8 ?')).toBe('1,4,8月每日00:00');
  });
  it('bounded month step renders as list', () => {
    // 月份只有 12 个，提前截止的步进集合直接列举比「1-7月每3个月」更直观
    expect(humanizeQuartz('0 0 0 * 1,4,7 ?')).toBe('1,4,7月每日00:00');
    // 等价表达式命中同一集合，输出一致
    expect(humanizeQuartz('0 0 0 * 1-7/3 ?')).toBe('1,4,7月每日00:00');
    // 截止步进在 12 个月里最多 5 个元素，列举依然清晰
    expect(humanizeQuartz('0 0 0 * 2-10/2 ?')).toBe('2,4,6,8,10月每日00:00');
  });
  it('mixed month segments fall back to literal translation', () => {
    expect(humanizeQuartz('0 0 0 * MAR-JUN,8 ?')).toBe('3-6,8月每日00:00');
  });
  it('weekday range via day-of-week (1=Sunday in Quartz)', () => {
    expect(humanizeQuartz('0 0 9 ? * MON-FRI')).toBe('每周一~周五09:00');
  });
  it('specific Sunday (Quartz day-of-week 1 = Sunday)', () => {
    expect(humanizeQuartz('0 0 9 ? * 1')).toBe('每周日09:00');
  });
  it('specific Saturday (Quartz day-of-week 7)', () => {
    expect(humanizeQuartz('0 0 9 ? * 7')).toBe('每周六09:00');
  });
  it('specific Monday (Quartz day-of-week 2)', () => {
    expect(humanizeQuartz('0 0 9 ? * 2')).toBe('每周一09:00');
  });
  it('lenient Sunday as 0', () => {
    expect(humanizeQuartz('0 0 9 ? * 0')).toBe('每周日09:00');
  });
  it('day of week list', () => {
    expect(humanizeQuartz('0 0 9 ? * MON,WED,FRI')).toBe('每周一、三、五09:00');
  });
  it('equivalent segments collapse to one range', () => {
    expect(humanizeQuartz('0 0 9 ? * MON-TUE,WED-FRI')).toBe(
      '每周一~周五09:00',
    );
  });
  it('negates when missing days are far fewer', () => {
    expect(humanizeQuartz('0 0 9 ? * MON-FRI,SUN')).toBe('除周六外每日09:00');
  });
  it('prefers range over negation when days are consecutive', () => {
    expect(humanizeQuartz('0 0 9 ? * MON-SAT')).toBe('每周一~周六09:00');
  });
  it('wrap-around day of week range', () => {
    expect(humanizeQuartz('0 0 9 ? * FRI-MON')).toBe('每周一、五、六、日09:00');
  });
  it('day of week stepping renders as list', () => {
    expect(humanizeQuartz('0 0 9 ? * MON-FRI/2')).toBe('每周一、三、五09:00');
  });
  it('month + day of week', () => {
    expect(humanizeQuartz('0 0 9 ? 6 2')).toBe('6月的每周一09:00');
  });
  it('lenient when both day of month and week are set', () => {
    expect(humanizeQuartz('0 0 9 5 3 2')).toBe('3月5日或周一09:00');
  });
  it('minute list at specific hour', () => {
    expect(humanizeQuartz('0 15,45 9 * * ?')).toBe('每日9时的第15,45分钟');
  });
  it('minute range as HH:MM-HH:MM', () => {
    expect(humanizeQuartz('0 1-15 1 * * ?')).toBe('每日01:01-01:15');
  });
  it('every minute at specific hour', () => {
    expect(humanizeQuartz('0 * 9 * * ?')).toBe('每日9时的每一分钟');
  });
  it('hour range with specific minute', () => {
    expect(humanizeQuartz('0 0 9-17 * * ?')).toBe('每日9-17时的第0分钟');
  });
  it('hour stepping with start', () => {
    expect(humanizeQuartz('0 0 2/3 * * ?')).toBe(
      '每日2时起，每隔3小时的第0分钟',
    );
  });
  it('hour range with step, bounded', () => {
    expect(humanizeQuartz('0 0 0-12/3 * * ?')).toBe(
      '每日0-12时（间隔3小时）的第0分钟',
    );
  });
  it('two-value set renders as list', () => {
    expect(humanizeQuartz('0 0/30 9-17 * * ?')).toBe('每日9-17时的第0,30分钟');
  });
  it('last day of month', () => {
    expect(humanizeQuartz('0 0 0 L * ?')).toBe('每月最后一天00:00');
  });
  it('last weekday of month', () => {
    expect(humanizeQuartz('0 0 0 LW * ?')).toBe('每月最后一个工作日00:00');
  });
  it('nearest weekday to given day', () => {
    expect(humanizeQuartz('0 0 0 15W * ?')).toBe(
      '每月距离15日最近的工作日00:00',
    );
  });
  it('last given weekday of month', () => {
    expect(humanizeQuartz('0 0 0 ? * 6L')).toBe('每月最后一个周五00:00');
  });
  it('nth weekday of month', () => {
    expect(humanizeQuartz('0 0 0 ? * 2#2')).toBe('每月第2个周一00:00');
  });
  it('last day of month in specific month', () => {
    expect(humanizeQuartz('0 0 0 L 3 ?')).toBe('3月的最后一天00:00');
  });
  it('nth weekday in specific month', () => {
    expect(humanizeQuartz('0 0 9 ? MAR 2#2')).toBe('3月的第2个周一09:00');
  });
  it('with year field', () => {
    expect(humanizeQuartz('0 30 10 * * ? 2024')).toBe('2024年每日10:30');
  });
  it('with year range', () => {
    expect(humanizeQuartz('0 30 10 * * ? 2024-2026')).toBe(
      '2024-2026年每日10:30',
    );
  });
  it('with year, month and day', () => {
    expect(humanizeQuartz('0 30 10 1 1 ? 2024')).toBe('2024年1月1日10:30');
  });
  it('drops redundant 每日 with year field', () => {
    expect(humanizeQuartz('0 * * * * ? 2024')).toBe('2024年每分钟');
  });
  it('drops redundant 每日 for month stepping', () => {
    expect(humanizeQuartz('0 */5 * * 6 ?')).toBe('6月每隔5分钟');
  });
  it('rejects wrong field count', () => {
    expect(() => humanizeQuartz('0 0 9')).toThrow(/6 或 7 个字段/);
  });
  it('rejects out-of-range day of week', () => {
    expect(() => humanizeQuartz('0 0 9 ? * 8')).toThrow(/超出范围/);
  });
  it('rejects unknown names', () => {
    expect(() => humanizeQuartz('0 0 9 ? * XYZ')).toThrow(/无法识别/);
  });
});

// auto 识别：6/7 字段表达式路由到 quartz，5 字段表达式走 crontab。
describe('Quartz auto-detection (parser: "auto")', () => {
  it('routes 6-field expression to the quartz parser', () => {
    expect(humanizeCronInChinese('0 0 9 * * ?')).toBe('每日09:00');
  });

  it('routes 7-field expression to the quartz parser', () => {
    expect(humanizeCronInChinese('0 0 9 * * ? 2024')).toBe('2024年每日09:00');
  });

  it('routes 5-field expression to the crontab parser', () => {
    expect(humanizeCronInChinese('0 0 * * *')).toBe('每日00:00');
  });

  it('respects explicit parser: "quartz"', () => {
    expect(humanizeCronInChinese('0 0 9 * * ?', { parser: 'quartz' })).toBe(
      '每日09:00',
    );
  });

  it('respects explicit parser: "crontab"', () => {
    expect(humanizeCronInChinese('0 0 * * *', { parser: 'crontab' })).toBe(
      '每日00:00',
    );
  });
});
