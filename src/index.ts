import { humanizeCrontab } from './parsers/crontab';
import { humanizeQuartz } from './parsers/quartz';

export type CronParserKind = 'auto' | 'crontab' | 'quartz';

export interface HumanizeCronOptions {
  /**
   * 指定 cron 表达式的方言：
   * - 'auto'（默认）：按字段数量自动识别（≥6 个字段视为 Quartz，否则为 crontab）
   * - 'crontab'：标准 Linux crontab（5 字段）
   * - 'quartz'：Quartz（6 或 7 字段）
   */
  parser?: CronParserKind;
}

/**
 * 将 cron 表达式转换为中文描述。
 */
export function humanizeCronInChinese(
  cron: string,
  options: HumanizeCronOptions = {},
): string {
  const kind = options.parser ?? 'auto';
  const resolved = kind === 'auto' ? detectParser(cron) : kind;
  return resolved === 'quartz' ? humanizeQuartz(cron) : humanizeCrontab(cron);
}

function detectParser(cron: string): 'crontab' | 'quartz' {
  // Quartz 使用 6 或 7 个字段；标准 crontab 使用 5 个。
  return cron.trim().split(/\s+/).length >= 6 ? 'quartz' : 'crontab';
}

export { humanizeCrontab, humanizeQuartz };
