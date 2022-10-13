import {humanizeCronInChinese} from "../index.js";

describe('cron any tests', function () {
    it('every minute', function () {
        expect(humanizeCronInChinese('* * * * *')).toBe('每分钟');
    });
    it('every 2 minute', function () {
        expect(humanizeCronInChinese('*/2 * * * *')).toBe('每隔2分钟');
    });
    it('every odd minute', function () {
        expect(humanizeCronInChinese('1-59/2 * * * *')).toBe('每小时的第1-59分钟(间隔2分钟)');
    })
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
    it('step hour with range', function () {
        expect(humanizeCronInChinese('* 0-12/3 * * *')).toBe('每日0-12时的每一分钟(间隔3小时)');
    });
    it('alternative day in week name', function () {
        expect(humanizeCronInChinese('30 15 * * Fri')).toBe('每周五15:30');
    });
    it('alternative month name', function () {
        expect(humanizeCronInChinese('0 1 * May fri')).toBe('5月的每周五01:00');
    });
    it('specific time', function () {
        expect(humanizeCronInChinese('11 11 11 11 *')).toBe('11月11日11:11');
    });
    it('two ranges in a day with different hours', function () {
        expect(humanizeCronInChinese('*/5 14,18 * * *')).toBe('每日14,18时的每5分钟');
    });
})
