import { BadRequestException } from '@nestjs/common';

type JsonObject = Record<string, unknown>;

export function asObject(value: unknown, label = 'request body'): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(label + ' must be an object');
  }
  return value as JsonObject;
}

export function rejectUnknown(
  value: JsonObject,
  allowed: readonly string[],
  label = 'request body',
) {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedSet.has(key));
  if (unknown.length) {
    throw new BadRequestException(
      label + ' contains unsupported field(s): ' + unknown.join(', '),
    );
  }
}

export function stringField(
  value: JsonObject,
  key: string,
  options: { min?: number; max?: number; optional?: boolean } = {},
): string | undefined {
  const raw = value[key];
  if (raw === undefined || raw === null) {
    if (options.optional) return undefined;
    throw new BadRequestException(key + ' is required');
  }
  if (typeof raw !== 'string') {
    throw new BadRequestException(key + ' must be a string');
  }
  const normalized = raw.trim();
  if (!normalized && !options.optional) {
    throw new BadRequestException(key + ' is required');
  }
  if (options.min && normalized.length < options.min) {
    throw new BadRequestException(key + ' is too short');
  }
  if (options.max && normalized.length > options.max) {
    throw new BadRequestException(key + ' is too long');
  }
  return normalized || undefined;
}

export function booleanField(value: JsonObject, key: string): boolean {
  if (typeof value[key] !== 'boolean') {
    throw new BadRequestException(key + ' must be a boolean');
  }
  return value[key] as boolean;
}

export function finiteNumberField(
  value: JsonObject,
  key: string,
  options: {
    min?: number;
    max?: number;
    optional?: boolean;
  } = {},
): number | undefined {
  const raw = value[key];
  if (raw === undefined || raw === null || raw === '') {
    if (options.optional) return undefined;
    throw new BadRequestException(key + ' is required');
  }
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(numeric)) {
    throw new BadRequestException(key + ' must be a finite number');
  }
  if (options.min !== undefined && numeric < options.min) {
    throw new BadRequestException(key + ' is below the allowed minimum');
  }
  if (options.max !== undefined && numeric > options.max) {
    throw new BadRequestException(key + ' is above the allowed maximum');
  }
  return numeric;
}

export function enumField<T extends string>(
  value: JsonObject,
  key: string,
  allowed: readonly T[],
): T {
  const raw = stringField(value, key);
  if (!raw || !allowed.includes(raw as T)) {
    throw new BadRequestException(
      key + ' must be one of: ' + allowed.join(', '),
    );
  }
  return raw as T;
}

export function isoDateField(
  value: JsonObject,
  key: string,
  options: { optional?: boolean; future?: boolean } = {},
): string | undefined {
  const raw = stringField(value, key, { optional: options.optional });
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(key + ' must be a valid ISO date');
  }
  if (options.future && parsed <= new Date()) {
    throw new BadRequestException(key + ' must be in the future');
  }
  return parsed.toISOString();
}

export function arrayField(
  value: JsonObject,
  key: string,
  options: { optional?: boolean; max?: number } = {},
): unknown[] {
  const raw = value[key];
  if (raw === undefined || raw === null) {
    if (options.optional) return [];
    throw new BadRequestException(key + ' is required');
  }
  if (!Array.isArray(raw)) {
    throw new BadRequestException(key + ' must be an array');
  }
  if (options.max !== undefined && raw.length > options.max) {
    throw new BadRequestException(
      key + ' exceeds the maximum of ' + options.max + ' items',
    );
  }
  return raw;
}

export function currencyField(value: JsonObject, key = 'currency'): string {
  const raw = stringField(value, key);
  const normalized = raw?.toUpperCase() || '';
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new BadRequestException(key + ' must be a 3-letter ISO 4217 code');
  }
  return normalized;
}
