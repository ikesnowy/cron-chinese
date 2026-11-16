// Quartz cron 解析采用与 Linux crontab 相互独立的「求值 → 特征 → 模板」引擎：
// 先把每个字段求值成实际命中的值集合（星期、月份等小集合直接全量展开），
// 再从值集合提取特征（单值 / 连续区间 / 等差步进 / 列表 / 小补集），
// 按特征挑选最合适的中文模板，未命中特征的走逐段字面翻译兜底。
// 等价表达式（如 MON-TUE,WED-FRI 与 MON-FRI）因此得到一致的输出，
// 新的表达场景只需往模板里加 case，不受解析顺序影响。

type ValueKind =
  | 'full' // 覆盖整个定义域（* 或 ?）
  | 'single' // 单值
  | 'range' // 连续区间
  | 'step-to-end' // 等差数列，一直覆盖到定义域尽头
  | 'step-bounded' // 等差数列，提前截止
  | 'list'; // 兜底：逐段字面翻译

interface ValueDescriptor {
  kind: ValueKind;
  values: number[];
  literal: string; // 兜底用的字面片段（名称已替换为数字）
  start: number;
  end: number;
  step: number;
}

interface Field {
  full: boolean;
  values: number[]; // 实际命中值；星期字段按周一到周日排序
  literal: string;
}

interface FieldOptions {
  min: number;
  max: number;
  names?: string[]; // names[i] 对应值 min + i
  wrap?: boolean; // 星期字段允许环绕区间（如 FRI-MON）
  zeroAsSunday?: boolean; // 星期字段宽容地把 0 当作周日
  displayRank?: (value: number) => number; // 值的展示序（星期按周一到周日）
}

// 「日」/「周」字段中的 L、W、# 属于符号语义，无法求值成具体数字，单独收集为裸文本
interface DateField {
  field: Field;
  specials: string[];
}

const YEAR_MIN = 1970;
const YEAR_MAX = 2099;

const MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

// Quartz 周字段取值 1-7，且 1 = 周日
const DOW_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DOW_DISPLAY_ORDER = [2, 3, 4, 5, 6, 7, 1]; // 周一到周日
const DOW_CHARS = ['日', '一', '二', '三', '四', '五', '六'];

const ITEM_PATTERN =
  /^(\*|\d+|[A-Za-z]{3})(?:-(\*|\d+|[A-Za-z]{3}))?(?:\/(\d+))?$/;

const ANY_FIELD: Field = { full: true, values: [], literal: '' };

const dowRank = (value: number) => DOW_DISPLAY_ORDER.indexOf(value);
const dowName = (value: number) => `周${DOW_CHARS[value - 1]}`;

const DOW_OPTIONS: FieldOptions = {
  min: 1,
  max: 7,
  names: DOW_NAMES,
  wrap: true,
  zeroAsSunday: true,
  displayRank: dowRank,
};

/**
 * 将 Quartz 格式的 cron 表达式转换为中文描述。
 *
 * Quartz 格式（6 或 7 个字段）：
 *   秒 分 时 日 月 周 [年]
 *
 * 与 Linux crontab 的关键差异：
 * - 首字段为「秒」（0-59），crontab 没有秒字段。
 * - 「周」字段取值 1-7，且 1 = 星期日（crontab 为 0-6，0 = 星期日）。
 * - 使用 `?` 表示「不指定」，当「日」或「周」其中之一被指定时，另一个必须用 `?`。
 * - 支持 `L`（最后）、`W`（最近的工作日）、`#`（第几个周几）等扩展语法。
 * - 可选的第 7 个字段为「年」。
 */
export function humanizeQuartz(cron: string): string {
  const tokens = cron.trim().split(/\s+/);
  if (tokens.length !== 6 && tokens.length !== 7) {
    throw new Error(
      `Quartz cron 表达式需要 6 或 7 个字段（秒 分 时 日 月 周 [年]），实际为 ${tokens.length} 个：${cron}`,
    );
  }
  const [second, minute, hour, dayOfMonth, month, dayOfWeek, year] = tokens;

  const time = renderTime(
    evaluateField(second, { min: 0, max: 59 }),
    evaluateField(minute, { min: 0, max: 59 }),
    evaluateField(hour, { min: 0, max: 23 }),
  );
  const date = renderDate(
    evaluateDayOfMonth(dayOfMonth),
    evaluateField(month, { min: 1, max: 12, names: MONTH_NAMES }),
    evaluateDayOfWeek(dayOfWeek),
    year === undefined
      ? ANY_FIELD
      : evaluateField(year, { min: YEAR_MIN, max: YEAR_MAX }),
    time,
  );
  return date + time;
}

// ---------- 求值：字段 → 实际命中的值集合 ----------

function evaluateField(raw: string, options: FieldOptions): Field {
  if (raw === '*' || raw === '?') {
    return ANY_FIELD;
  }
  const values = new Set<number>();
  const literals: string[] = [];
  for (const item of raw.split(',')) {
    const segment = expandItem(item, options);
    literals.push(segment.compact);
    for (const value of segment.values) {
      values.add(value);
    }
  }
  const sorted = [...values];
  const displayRank = options.displayRank;
  sorted.sort(
    displayRank ? (a, b) => displayRank(a) - displayRank(b) : (a, b) => a - b,
  );
  return { full: false, values: sorted, literal: literals.join(',') };
}

function expandItem(
  item: string,
  options: FieldOptions,
): { values: number[]; compact: string } {
  const match = ITEM_PATTERN.exec(item);
  if (match === null) {
    throw new Error(`无法解析 Quartz 字段片段："${item}"`);
  }
  const [, startToken, endToken, stepToken] = match;
  const step = stepToken === undefined ? 1 : Number(stepToken);
  if (step < 1) {
    throw new Error(`步进值必须是正整数："${item}"`);
  }

  let start: number;
  let end: number;
  if (startToken === '*') {
    start = options.min;
    end = options.max;
  } else {
    start = resolveToken(startToken, options);
    if (endToken === undefined) {
      // “5/15”表示从 5 一直到定义域尽头；“5”则只是单值
      end = stepToken === undefined ? start : options.max;
    } else if (endToken === '*') {
      end = options.max;
    } else {
      end = resolveToken(endToken, options);
    }
    assertInRange(start, options, item);
    if (endToken !== undefined) {
      assertInRange(end, options, item);
    }
  }

  if (start > end) {
    if (options.wrap !== true) {
      throw new Error(`区间起点大于终点："${item}"`);
    }
    // 星期字段允许环绕区间：FRI-MON 等价于周五、六、日、一
    const values: number[] = [];
    for (let v = start; v <= options.max; v += step) {
      values.push(v);
    }
    for (let v = options.min; v <= end; v += step) {
      values.push(v);
    }
    return { values, compact: values.join(',') };
  }

  const values: number[] = [];
  for (let v = start; v <= end; v += step) {
    values.push(v);
  }
  const compact =
    step > 1 || values.length === 1 ? values.join(',') : `${start}-${end}`;
  return { values, compact };
}

function resolveToken(token: string, options: FieldOptions): number {
  if (options.names !== undefined) {
    const index = options.names.indexOf(token.toUpperCase());
    if (index >= 0) {
      return options.min + index;
    }
  }
  const value = Number(token);
  if (Number.isNaN(value)) {
    throw new Error(`无法识别的字段值："${token}"`);
  }
  // Quartz 周字段合法取值是 1-7，这里宽容地把 0 也当作周日
  return options.zeroAsSunday === true && value === 0 ? 1 : value;
}

function assertInRange(
  value: number,
  options: FieldOptions,
  item: string,
): void {
  if (value < options.min || value > options.max) {
    throw new Error(
      `字段值 ${value} 超出范围 [${options.min}, ${options.max}]："${item}"`,
    );
  }
}

function evaluateDayOfMonth(raw: string): DateField {
  if (raw === '*' || raw === '?') {
    return { field: ANY_FIELD, specials: [] };
  }
  const specials: string[] = [];
  const items: string[] = [];
  for (const item of raw.split(',')) {
    if (/^l$/i.test(item)) {
      specials.push('最后一天');
      continue;
    }
    if (/^lw$/i.test(item)) {
      specials.push('最后一个工作日');
      continue;
    }
    const match = /^(\d+)w$/i.exec(item);
    if (match !== null) {
      const day = Number(match[1]);
      if (day < 1 || day > 31) {
        throw new Error(`「日」字段取值超出范围 [1, 31]："${item}"`);
      }
      specials.push(`距离${day}日最近的工作日`);
      continue;
    }
    items.push(item);
  }
  return {
    field:
      items.length === 0
        ? ANY_FIELD
        : evaluateField(items.join(','), { min: 1, max: 31 }),
    specials,
  };
}

function evaluateDayOfWeek(raw: string): DateField {
  if (raw === '*' || raw === '?') {
    return { field: ANY_FIELD, specials: [] };
  }
  const specials: string[] = [];
  const items: string[] = [];
  for (const item of raw.split(',')) {
    if (/^l$/i.test(item)) {
      // 周字段单独的 L 表示周六
      items.push('7');
      continue;
    }
    const nth = /^(\d+)#(\d+)$/.exec(item);
    if (nth !== null) {
      const day = quartzDowValue(Number(nth[1]), item);
      const ordinal = Number(nth[2]);
      if (ordinal < 1 || ordinal > 5) {
        throw new Error(`「第几个周几」的序数取值范围是 [1, 5]："${item}"`);
      }
      specials.push(`第${ordinal}个${dowName(day)}`);
      continue;
    }
    const last = /^(\d+)l$/i.exec(item);
    if (last !== null) {
      specials.push(
        `最后一个${dowName(quartzDowValue(Number(last[1]), item))}`,
      );
      continue;
    }
    items.push(item);
  }
  return {
    field:
      items.length === 0
        ? ANY_FIELD
        : evaluateField(items.join(','), DOW_OPTIONS),
    specials,
  };
}

function quartzDowValue(value: number, item: string): number {
  const day = value === 0 ? 1 : value;
  if (day < 1 || day > 7) {
    throw new Error(`「周」字段取值超出范围 [1, 7]："${item}"`);
  }
  return day;
}

// ---------- 特征提取：值集合 → 取值描述符 ----------

interface DescribeOptions {
  allowStep?: boolean; // 周字段不做步进渲染（「每隔2天」语义有歧义）
  rank?: (value: number) => number; // 连续性判断所用的展示序
  // 小定义域（如 12 个月）中，提前截止的步进集合最多只有几个元素，
  // 直接列举比「1-7月每3个月」这类需要心算的区间+步进更直观
  listBoundedStep?: boolean;
}

function describe(
  field: Field,
  min: number,
  max: number,
  options: DescribeOptions = {},
): ValueDescriptor {
  const rank = options.rank ?? ((value: number) => value);
  const values = field.values;
  const count = values.length;
  const base = {
    values,
    literal: field.literal,
    start: count > 0 ? values[0] : min,
    end: count > 0 ? values[count - 1] : min,
    step: 1,
  };
  if (field.full || count === 0 || count === max - min + 1) {
    return { kind: 'full', ...base };
  }
  if (count === 1) {
    return { kind: 'single', ...base };
  }
  const diffs = values
    .slice(1)
    .map((value, index) => rank(value) - rank(values[index]));
  const uniform = diffs.every((diff) => diff === diffs[0]);
  if (uniform && diffs[0] === 1) {
    return { kind: 'range', ...base };
  }
  // 少于 3 个值的等差更可能是巧合（如 15,45），按列表处理
  if (uniform && (options.allowStep ?? true) && count >= 3) {
    const step = diffs[0];
    // 末值再走一步就越过定义域尽头，说明步进覆盖到了尽头
    if (values[count - 1] + step > max) {
      return { kind: 'step-to-end', ...base, step };
    }
    if (options.listBoundedStep !== true) {
      return { kind: 'step-bounded', ...base, step };
    }
  }
  return { kind: 'list', ...base };
}

// ---------- 文本模板：描述符 → 中文短语 ----------

function subPhrase(descriptor: ValueDescriptor, unit: string): string {
  switch (descriptor.kind) {
    case 'single':
      return `第${descriptor.start}${unit}`;
    case 'range':
      return `第${descriptor.start}-${descriptor.end}${unit}`;
    case 'step-to-end':
      return descriptor.start === 0
        ? `每${descriptor.step}${unit}`
        : `第${descriptor.start}${unit}起，每隔${descriptor.step}${unit}`;
    case 'step-bounded':
      return `第${descriptor.start}-${descriptor.end}${unit}（间隔${descriptor.step}${unit}）`;
    default:
      return `第${descriptor.literal}${unit}`;
  }
}

function hourPhrase(descriptor: ValueDescriptor): string {
  switch (descriptor.kind) {
    case 'single':
      return `${descriptor.start}时`;
    case 'range':
      return `${descriptor.start}-${descriptor.end}时`;
    case 'step-to-end':
      return descriptor.start === 0
        ? `每${descriptor.step}小时`
        : `${descriptor.start}时起，每隔${descriptor.step}小时`;
    case 'step-bounded':
      return `${descriptor.start}-${descriptor.end}时（间隔${descriptor.step}小时）`;
    default:
      return `${descriptor.literal}时`;
  }
}

function dayOfMonthPhrase(descriptor: ValueDescriptor): string {
  switch (descriptor.kind) {
    case 'single':
      return `${descriptor.start}日`;
    case 'range':
      return `${descriptor.start}-${descriptor.end}日`;
    case 'step-to-end':
      return descriptor.start === 1
        ? `每${descriptor.step}日`
        : `${descriptor.start}日起，每隔${descriptor.step}日`;
    case 'step-bounded':
      return `${descriptor.start}-${descriptor.end}日（间隔${descriptor.step}日）`;
    default:
      return `${descriptor.literal}日`;
  }
}

function monthPhrase(descriptor: ValueDescriptor): string {
  switch (descriptor.kind) {
    case 'single':
      return `${descriptor.start}月`;
    case 'range':
      return `${descriptor.start}-${descriptor.end}月`;
    case 'step-to-end':
      return descriptor.start === 1
        ? `每${descriptor.step}个月`
        : `${descriptor.start}月起每${descriptor.step}个月`;
    case 'step-bounded':
      return `${descriptor.start}-${descriptor.end}月每${descriptor.step}个月`;
    default:
      return `${descriptor.literal}月`;
  }
}

function yearPhrase(descriptor: ValueDescriptor): string {
  switch (descriptor.kind) {
    case 'single':
      return `${descriptor.start}年`;
    case 'range':
      return `${descriptor.start}-${descriptor.end}年`;
    case 'step-to-end':
      return `${descriptor.start}年起每${descriptor.step}年`;
    case 'step-bounded':
      return `${descriptor.start}-${descriptor.end}年每${descriptor.step}年`;
    default:
      return `${descriptor.literal}年`;
  }
}

function dayOfWeekPhrase(descriptor: ValueDescriptor): string {
  // 无「每」前缀的“周X”文本，由调用方组合成「每周X」
  switch (descriptor.kind) {
    case 'single':
      return dowName(descriptor.start);
    case 'range':
      return `${dowName(descriptor.start)}~${dowName(descriptor.end)}`;
    default:
      // 星期集合很小（≤7），列表直接按求值后的值翻译
      return `周${descriptor.values.map((v) => DOW_CHARS[v - 1]).join('、')}`;
  }
}

// ---------- 组合：日期 + 时间 ----------

function renderDate(
  dayOfMonth: DateField,
  month: Field,
  dayOfWeek: DateField,
  year: Field,
  time: string,
): string {
  const yearDescriptor = describe(year, YEAR_MIN, YEAR_MAX);
  const monthDescriptor = describe(month, 1, 12, { listBoundedStep: true });
  const domDescriptor = describe(dayOfMonth.field, 1, 31);
  const dowDescriptor = describe(dayOfWeek.field, 1, 7, {
    allowStep: false,
    rank: dowRank,
  });

  const monthText =
    monthDescriptor.kind === 'full' ? '' : monthPhrase(monthDescriptor);
  const domTexts = [
    ...(domDescriptor.kind === 'full' ? [] : [dayOfMonthPhrase(domDescriptor)]),
    ...dayOfMonth.specials,
  ];
  const dowTexts = [
    ...(dowDescriptor.kind === 'full' ? [] : [dayOfWeekPhrase(dowDescriptor)]),
    ...dayOfWeek.specials,
  ];

  let dateText: string;
  if (domTexts.length > 0 && dowTexts.length > 0) {
    // Quartz 不允许「日」和「周」同时受限，这里宽容地按「或」组合
    dateText =
      monthText === ''
        ? `每月${domTexts.join('或')}或${dowTexts.join('或')}`
        : `${monthText}${domTexts.join('或')}或${dowTexts.join('或')}`;
  } else if (domTexts.length > 0) {
    if (monthText === '') {
      dateText = `每月${domTexts.join('或')}`;
    } else if (domDescriptor.kind === 'full') {
      // 只有 L/W 这类特殊 token 时用「3月的最后一天」语序
      dateText = `${monthText}的${dayOfMonth.specials.join('或')}`;
    } else {
      dateText = `${monthText}${domTexts.join('或')}`;
    }
  } else if (dowTexts.length > 0) {
    const exceptText = exceptPhrase(dowDescriptor);
    if (exceptText !== null) {
      // 命中的星期不连续、且未命中的远少于命中的：除周六外每日
      dateText = `${monthText}${exceptText}每日`;
    } else if (monthText === '') {
      dateText =
        dowDescriptor.kind === 'full'
          ? `每月${dowTexts.join('或')}` // 只有 nL / n#m 这类特殊 token
          : `每${dowTexts.join('或')}`;
    } else {
      dateText =
        dowDescriptor.kind === 'full'
          ? `${monthText}的${dayOfWeek.specials.join('或')}`
          : `${monthText}的每${dowTexts.join('或')}`;
    }
  } else {
    dateText = monthText === '' ? '每日' : `${monthText}每日`;
  }

  if (time.startsWith('每') && dateText.endsWith('每日')) {
    dateText = dateText.slice(0, -'每日'.length);
  }

  const yearPrefix =
    yearDescriptor.kind === 'full' ? '' : yearPhrase(yearDescriptor);
  return yearPrefix + dateText;
}

function exceptPhrase(dowDescriptor: ValueDescriptor): string | null {
  // 仅当命中的星期不连续（列表形态）且未命中天数远少于命中天数时取反
  if (dowDescriptor.kind !== 'list') {
    return null;
  }
  const missing = DOW_DISPLAY_ORDER.filter(
    (value) => !dowDescriptor.values.includes(value),
  );
  if (
    missing.length === 0 ||
    missing.length * 2 > dowDescriptor.values.length
  ) {
    return null;
  }
  return `除${missing.map(dowName).join('、')}外`;
}

function renderTime(second: Field, minute: Field, hour: Field): string {
  const hourDescriptor = describe(hour, 0, 23);
  const minuteDescriptor = describe(minute, 0, 59);
  const secondDescriptor = describe(second, 0, 59);

  let text: string;
  if (hourDescriptor.kind === 'full') {
    if (minuteDescriptor.kind === 'full') {
      text = '每分钟';
    } else if (
      minuteDescriptor.kind === 'step-to-end' &&
      minuteDescriptor.start === 0
    ) {
      text = `每隔${minuteDescriptor.step}分钟`;
    } else {
      text = `每小时的${subPhrase(minuteDescriptor, '分钟')}`;
    }
  } else if (minuteDescriptor.kind === 'full') {
    if (hourDescriptor.kind === 'step-to-end') {
      // 步进覆盖到尽头的小时（每隔3小时 / 5时起，每隔3小时）已蕴含每小时内的每一分钟
      text =
        hourDescriptor.start === 0
          ? `每隔${hourDescriptor.step}小时`
          : `${hourDescriptor.start}时起，每隔${hourDescriptor.step}小时`;
    } else {
      text = `${hourPhrase(hourDescriptor)}的每一分钟`;
    }
  } else if (
    hourDescriptor.kind === 'single' &&
    (minuteDescriptor.kind === 'single' || minuteDescriptor.kind === 'range')
  ) {
    // 钟点形式：09:00 / 09:00-09:30
    const hourText = String(hourDescriptor.start).padStart(2, '0');
    const from = `${hourText}:${String(minuteDescriptor.start).padStart(2, '0')}`;
    text =
      minuteDescriptor.kind === 'single'
        ? from
        : `${from}-${hourText}:${String(minuteDescriptor.end).padStart(2, '0')}`;
  } else {
    text = `${hourPhrase(hourDescriptor)}的${subPhrase(minuteDescriptor, '分钟')}`;
  }

  return withSeconds(text, secondDescriptor);
}

function withSeconds(text: string, second: ValueDescriptor): string {
  if (second.kind === 'full') {
    return text === '每分钟' ? '每秒' : `${text}的每一秒`;
  }
  if (second.kind === 'single' && second.start === 0) {
    return text; // 整分触发，最常见的情形，省略秒
  }
  if (text === '每分钟') {
    if (second.kind === 'step-to-end' && second.start === 0) {
      return `每隔${second.step}秒`;
    }
    return `每分钟的${subPhrase(second, '秒')}`;
  }
  if (/^\d{2}:\d{2}$/.test(text) && second.kind === 'single') {
    // 钟点形式直接扩展为 HH:MM:SS
    return `${text}:${String(second.start).padStart(2, '0')}`;
  }
  if (second.kind === 'step-to-end' && second.start === 0) {
    return `${text}的每${second.step}秒`;
  }
  return `${text}的${subPhrase(second, '秒')}`;
}
