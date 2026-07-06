import { describe, it, expect } from 'vitest';
import { humanizeCronInChinese } from '../index.js';

describe('Linux crontab translation tests', function () {
    it('every minute', function () {
        expect(humanizeCronInChinese('* * * * *')).toBe('每分钟');
    });
    it('every 2 minutes', function () {
        expect(humanizeCronInChinese('*/2 * * * *')).toBe('每隔2分钟');
    });
    it('every odd minute', function () {
        expect(humanizeCronInChinese('1-59/2 * * * *')).toBe('每小时的第1-59分钟（间隔2分钟）');
    });
    it('once a month', function () {
        expect(humanizeCronInChinese('0 0 1 * *')).toBe('每月1日00:00');
    });
    it('every midnight', function () {
        expect(humanizeCronInChinese('0 0 * * *')).toBe('每日00:00');
    });
    it('at minute 30', function () {
        expect(humanizeCronInChinese('30 * * * *')).toBe('每小时的第30分钟');
    });
    it('every hour in range', function () {
        expect(humanizeCronInChinese('0 9-17 * * *')).toBe('每日9-17时的第0分钟');
    });
    it('every weekday', function () {
        expect(humanizeCronInChinese('0 0 * * 1-5')).toBe('每周一~周五00:00');
    });
    it('1st, 10th, 20th day of each month', function () {
        expect(humanizeCronInChinese('45 4 1,10,20 * *')).toBe('每月1,10,20日04:45');
    });
    it('minute range', function () {
        expect(humanizeCronInChinese('1-15 1 * * *')).toBe('每日01:01-01:15');
    });
    it('hour range with step, minute every', function () {
        expect(humanizeCronInChinese('* 0-12/3 * * *')).toBe('每日0-12时的每一分钟（间隔3小时）');
    });
    it('day in week by English name', function () {
        expect(humanizeCronInChinese('30 15 * * Fri')).toBe('每周五15:30');
    });
    it('month + day in week by English names', function () {
        expect(humanizeCronInChinese('0 1 * May fri')).toBe('5月的每周五01:00');
    });
    it('specific time', function () {
        expect(humanizeCronInChinese('11 11 11 11 *')).toBe('11月11日11:11');
    });
    it('minute step with hour list', function () {
        expect(humanizeCronInChinese('*/5 14,18 * * *')).toBe('每日14,18时的每5分钟');
    });
    it('weekday range by english names', function () {
        expect(humanizeCronInChinese('0 23 * * MON-fri')).toBe('每周一~周五23:00');
    });
    it('month name range', function () {
        expect(humanizeCronInChinese('23 12 * JAN-feb *')).toBe('1-2月每日12:23');
    });
    it('specific day in week', function () {
        expect(humanizeCronInChinese('0 0 * * 1')).toBe('每周一00:00');
    });
    it('specific day in month', function () {
        expect(humanizeCronInChinese('0 0 15 * *')).toBe('每月15日00:00');
    });
    it('specific month', function () {
        expect(humanizeCronInChinese('0 0 * 3 *')).toBe('3月每日00:00');
    });
    it('specific month range', function () {
        expect(humanizeCronInChinese('0 0 * 1-5 *')).toBe('1-5月每日00:00');
    });
    it('specific month list', function () {
        expect(humanizeCronInChinese('30 14 * 1,4,7 *')).toBe('1,4,7月每日14:30');
    });
    it('day in week by WED', function () {
        expect(humanizeCronInChinese('0 0 * * WED')).toBe('每周三00:00');
    });
    it('day in week list by english names', function () {
        expect(humanizeCronInChinese('0 0 * * MON,WED,FRI')).toBe('每周一、三、五00:00');
    });
    it('day in month or day in week', function () {
        expect(humanizeCronInChinese('0 0 10 * 1')).toBe('每月10日或周一00:00');
    });
    it('month + day in week', function () {
        expect(humanizeCronInChinese('0 0 * 6 1')).toBe('6月的每周一00:00');
    });
    it('month + day in month + day in week', function () {
        expect(humanizeCronInChinese('0 0 5 3 1')).toBe('3月5日或周一00:00');
    });
    it('day in month stepping from any', function () {
        expect(humanizeCronInChinese('0 0 */5 * *')).toBe('每月每5日00:00');
    });
    it('day in month stepping with start', function () {
        expect(humanizeCronInChinese('0 0 3/2 * *')).toBe('每月3日（间隔2日）00:00');
    });
    it('month stepping from any', function () {
        expect(humanizeCronInChinese('0 0 1 */3 *')).toBe('每3个月1日00:00');
    });
    it('month stepping with start', function () {
        expect(humanizeCronInChinese('0 0 * MAR/2 *')).toBe('3月起每2个月每日00:00');
    });
    it('month range stepping', function () {
        expect(humanizeCronInChinese('0 0 * MAR-DEC/2 *')).toBe('3-12月每2个月每日00:00');
    });
    it('month name range lowercase', function () {
        expect(humanizeCronInChinese('0 0 * jan-dec *')).toBe('1-12月每日00:00');
    });
    it('minute stepping every n', function () {
        expect(humanizeCronInChinese('*/5 * * * *')).toBe('每隔5分钟');
    });
    it('minute stepping with start, hour any', function () {
        expect(humanizeCronInChinese('5/3 * * * *')).toBe('每小时的第5分钟起，每隔3分钟');
    });
    it('hour stepping every n', function () {
        expect(humanizeCronInChinese('* */3 * * *')).toBe('每隔3小时');
    });
    it('hour stepping with start, minute any', function () {
        expect(humanizeCronInChinese('* 5/3 * * *')).toBe('每日5时起，每隔3小时');
    });
    it('hour range with step, minute specific', function () {
        expect(humanizeCronInChinese('0 9-17/3 * * *')).toBe('每日9-17时（间隔3小时）的第0分钟');
    });
    it('hour stepping with start, minute specific', function () {
        expect(humanizeCronInChinese('0 2/3 * * *')).toBe('每日2时起，每隔3小时的第0分钟');
    });
    it('minute range as HH:MM-HH:MM', function () {
        expect(humanizeCronInChinese('0-30 9 * * *')).toBe('每日09:00-09:30');
    });
    it('minute list', function () {
        expect(humanizeCronInChinese('15,45 9 * * *')).toBe('每日9时的第15,45分钟');
    });
    it('hour list', function () {
        expect(humanizeCronInChinese('0 8,12,18 * * *')).toBe('每日8,12,18时的第0分钟');
    });
    it('both hour and minute stepping', function () {
        expect(humanizeCronInChinese('*/5 */2 * * *')).toBe('每2小时的每5分钟');
    });
    it('minute stepping with start, hour range', function () {
        expect(humanizeCronInChinese('5/3 9-17 * * *')).toBe('每日9-17时的第5分钟起，每隔3分钟');
    });
    it('minute stepping with start, single hour', function () {
        expect(humanizeCronInChinese('5/3 9 * * *')).toBe('每日9时的第5分钟起，每隔3分钟');
    });
    it('day in week stepping from any', function () {
        expect(humanizeCronInChinese('0 0 * * */2')).toBe('每周日、二、四、六00:00');
    });
    it('day in week stepping with start', function () {
        expect(humanizeCronInChinese('0 0 * * 1/2')).toBe('每周一、三、五00:00');
    });
    it('day in week stepping over english-name range', function () {
        expect(humanizeCronInChinese('0 0 * * MON-FRI/2')).toBe('每周一、三、五00:00');
    });
    it('day in week stepping combined with month + day', function () {
        expect(humanizeCronInChinese('0 0 5 3 */2')).toBe('3月5日或周日、二、四、六00:00');
    });
    it('drops redundant 每日 when time is 每分钟 (specific month)', function () {
        expect(humanizeCronInChinese('* * * 6 *')).toBe('6月每分钟');
    });
    it('drops redundant 每日 when time is 每分钟 (month stepping)', function () {
        expect(humanizeCronInChinese('* * * */3 *')).toBe('每3个月每分钟');
    });
    it('drops redundant 每日 when time is 每隔N分钟', function () {
        expect(humanizeCronInChinese('*/5 * * 6 *')).toBe('6月每隔5分钟');
    });
    it('drops redundant 每日 when time is 每隔N小时', function () {
        expect(humanizeCronInChinese('* */6 * 6 *')).toBe('6月每隔6小时');
    });
    it('keeps 每日 when time is a clock time', function () {
        expect(humanizeCronInChinese('0 0 * 6 *')).toBe('6月每日00:00');
    });
});
