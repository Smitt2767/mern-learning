type LogLevel = "debug" | "info" | "success" | "warn" | "error";

interface LogStyle {
  badge: string;
  color: string;
  bgColor: string;
}

const LOG_STYLES: Record<LogLevel, LogStyle> = {
  debug: {
    badge: "DEBUG",
    color: "\x1b[36m",
    bgColor: "background:#6c757d;color:#fff",
  },
  info: {
    badge: "INFO",
    color: "\x1b[34m",
    bgColor: "background:#0d6efd;color:#fff",
  },
  success: {
    badge: "SUCCESS",
    color: "\x1b[32m",
    bgColor: "background:#198754;color:#fff",
  },
  warn: {
    badge: "WARN",
    color: "\x1b[33m",
    bgColor: "background:#ffc107;color:#000",
  },
  error: {
    badge: "ERROR",
    color: "\x1b[31m",
    bgColor: "background:#dc3545;color:#fff",
  },
};

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

class Logger {
  private readonly isBrowser: boolean;

  constructor() {
    this.isBrowser =
      typeof globalThis !== "undefined" &&
      typeof (globalThis as Record<string, unknown>).window !== "undefined" &&
      typeof (globalThis as Record<string, unknown>).document !== "undefined";
  }

  debug(...args: unknown[]): void {
    this.print("debug", args);
  }

  info(...args: unknown[]): void {
    this.print("info", args);
  }

  success(...args: unknown[]): void {
    this.print("success", args);
  }

  warn(...args: unknown[]): void {
    this.print("warn", args);
  }

  error(...args: unknown[]): void {
    this.print("error", args);
  }

  private print(level: LogLevel, args: unknown[]): void {
    if (this.isBrowser) {
      this.printBrowser(level, args);
    } else {
      this.printNode(level, args);
    }
  }

  private printNode(level: LogLevel, args: unknown[]): void {
    const style = LOG_STYLES[level];
    const timestamp = this.getTimestamp();
    const badge = `${style.color}${BOLD} ${style.badge} ${RESET}`;
    const time = `${DIM}${timestamp}${RESET}`;

    const consoleFn = this.getConsoleFn(level);
    consoleFn(`${badge} ${time}`, ...args);
  }

  private printBrowser(level: LogLevel, args: unknown[]): void {
    const style = LOG_STYLES[level];
    const timestamp = this.getTimestamp();

    const badgeStyle = `${style.bgColor};padding:2px 6px;border-radius:3px;font-weight:bold`;
    const timeStyle = "color:#aaa;font-size:0.85em";
    const msgStyle = "color:inherit;font-weight:normal";

    const consoleFn = this.getConsoleFn(level);
    consoleFn(
      `%c ${style.badge} %c ${timestamp} %c`,
      badgeStyle,
      timeStyle,
      msgStyle,
      ...args,
    );
  }

  private getConsoleFn(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case "debug":
        return console.debug.bind(console);
      case "info":
        return console.info.bind(console);
      case "success":
        return console.log.bind(console);
      case "warn":
        return console.warn.bind(console);
      case "error":
        return console.error.bind(console);
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const ms = String(now.getMilliseconds()).padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  }
}

export const logger = new Logger();
