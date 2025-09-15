import { toDateTimeMsString } from '../utils/util';

// 简化的日志记录器，仅输出到控制台
export class Logger {
  log(...data: any[]) {
    console.log(this.formatMessage('[LOG]', ...data));
  }

  info(...data: any[]) {
    console.info(this.formatMessage('[INFO]', ...data));
  }

  warn(...data: any[]) {
    console.warn(this.formatMessage('[WARN]', ...data));
  }

  error(...data: any[]) {
    console.error(this.formatMessage('[ERROR]', ...data));
  }

  private formatItem(v: any): string {
    const type = typeof v;
    if (type === 'string') {
      return v;
    }
    if (type === 'object' && v instanceof Error) {
      return v.stack || v.message;
    }
    try {
        return JSON.stringify(v, null, 2);
    } catch {
        return '[Circular Object]';
    }
  }

  private formatMessage(level: string, ...data: any[]): string {
      const time = toDateTimeMsString(new Date());
      const messageParts = data.map(v => this.formatItem(v));
      return `${time} ${level} ${messageParts.join(' ')}`;
  }
}