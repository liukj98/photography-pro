import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== 类型安全工具函数 ====================

/**
 * 安全地访问对象属性，避免 null/undefined 错误
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key];
}

/**
 * 安全地执行数组 map 操作
 */
export function safeMap<T, R>(arr: T[] | null | undefined, fn: (item: T, index: number) => R): R[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(fn);
}

/**
 * 安全地执行数组 filter 操作
 */
export function safeFilter<T>(arr: T[] | null | undefined, fn: (item: T, index: number) => boolean): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(fn);
}

/**
 * 从错误对象中提取错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '发生未知错误';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('密码至少需要 8 个字符');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码需要包含大写字母');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('密码需要包含小写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码需要包含数字');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
