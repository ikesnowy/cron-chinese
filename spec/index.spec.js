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
})
