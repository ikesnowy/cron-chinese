import { describe, it, expect } from 'vitest';
import { humanizeCronInChinese } from '../index.js';

describe('cron translation tests', function () {
    it('every minute', function () {
        expect(humanizeCronInChinese('* * * * *')).toBe('每分钟');
    });
    it('every 2 minute', function () {
        expect(humanizeCronInChinese('*/2 * * * *')).toBe('每隔2分钟');
    });
    it('every odd minute', function () {
        expect(humanizeCronInChinese('1-59/2 * * * *')).toBe('每小时的第1-59分钟(间隔2分钟)');
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
    it('weekday midnight', function () {
        expect(humanizeCronInChinese('0 23 * * MON-fri')).toBe('每周一~周五23:00');
    });
    it('month name range', function () {
        expect(humanizeCronInChinese('23 12 * JAN-feb *')).toBe('1-2月每日12:23');
    });

    describe('date part: anyCount === 2 (one specific field)', function () {
        it('specific dayInWeek single value', function () {
            expect(humanizeCronInChinese('0 0 * * 1')).toBe('每周一00:00');
        });
        it('specific dayInMonth single value', function () {
            expect(humanizeCronInChinese('0 0 15 * *')).toBe('每月15日00:00');
        });
        it('specific month single value', function () {
            expect(humanizeCronInChinese('0 0 * 3 *')).toBe('3月每日00:00');
        });
        it('specific month range (numeric)', function () {
            expect(humanizeCronInChinese('0 0 * 1-5 *')).toBe('1-5月每日00:00');
        });
        it('specific month list', function () {
            expect(humanizeCronInChinese('30 14 * 1,4,7 *')).toBe('1,4,7月每日14:30');
        });
        it('specific dayInWeek single value by english name (WED)', function () {
            expect(humanizeCronInChinese('0 0 * * WED')).toBe('每周三00:00');
        });
        it('specific dayInWeek list by english names', function () {
            expect(humanizeCronInChinese('0 0 * * MON,WED,FRI')).toBe('每周一、三、五00:00');
        });
    });

    describe('date part: anyCount === 1 (two specific fields)', function () {
        it('month is any: dayInMonth or dayInWeek', function () {
            expect(humanizeCronInChinese('0 0 10 * 1')).toBe('每月10日或周一00:00');
        });
        it('dayInMonth is any: month and dayInWeek', function () {
            expect(humanizeCronInChinese('0 0 * 6 1')).toBe('6月的每周一00:00');
        });
    });

    describe('date part: anyCount === 0 (all specific)', function () {
        it('month + dayInMonth + dayInWeek', function () {
            expect(humanizeCronInChinese('0 0 5 3 1')).toBe('3月5日或周一00:00');
        });
    });

    describe('date part: month / day stepping', function () {
        it('dayInMonth stepping from any (*/5)', function () {
            expect(humanizeCronInChinese('0 0 */5 * *')).toBe('每月每5日00:00');
        });
        it('dayInMonth stepping with start value (3/2)', function () {
            expect(humanizeCronInChinese('0 0 3/2 * *')).toBe('每月3日(间隔2日)00:00');
        });
        it('month stepping from any (*/3)', function () {
            expect(humanizeCronInChinese('0 0 1 */3 *')).toBe('每3月1日00:00');
        });
        it('month range stepping (MAR/2)', function () {
            expect(humanizeCronInChinese('0 0 * MAR/2 *')).toBe('3月(间隔2月)每日00:00');
        });
        it('month name range lowercase (jan-dec)', function () {
            expect(humanizeCronInChinese('0 0 * jan-dec *')).toBe('1-12月每日00:00');
        });
    });

    describe('time part: anyCount === 1, hour is any', function () {
        it('minute stepping without range/list', function () {
            expect(humanizeCronInChinese('*/5 * * * *')).toBe('每隔5分钟');
        });
        it('minute stepping with start value (5/3)', function () {
            expect(humanizeCronInChinese('5/3 * * * *')).toBe('每小时的第5分钟起,每隔3分钟');
        });
        it('minute stepping with range', function () {
            expect(humanizeCronInChinese('1-59/2 * * * *')).toBe('每小时的第1-59分钟(间隔2分钟)');
        });
        it('minute plain value', function () {
            expect(humanizeCronInChinese('30 * * * *')).toBe('每小时的第30分钟');
        });
    });

    describe('time part: anyCount === 1, hour specific', function () {
        it('hour range', function () {
            expect(humanizeCronInChinese('0 9-17 * * *')).toBe('每日9-17时的第0分钟');
        });
        it('hour range with step', function () {
            expect(humanizeCronInChinese('0 9-17/3 * * *')).toBe('每日9-17时(间隔3小时)的第0分钟');
        });
        it('hour stepping without range/list', function () {
            expect(humanizeCronInChinese('* */3 * * *')).toBe('每隔3小时');
        });
    });

    describe('time part: anyCount === 0 (hour and minute specific)', function () {
        it('single point time', function () {
            expect(humanizeCronInChinese('11 11 11 11 *')).toBe('11月11日11:11');
        });
        it('minute range becomes HH:MM-HH:MM', function () {
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
    });
});
