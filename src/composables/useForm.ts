import { cloneDeep, isEqual, unset } from 'lodash';
import {
  computed,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  shallowRef,
  toValue,
} from 'vue';

export type FormValidateFn<T extends object> = (_model: T) => boolean;

export interface UseFormOptions<T extends object> {
  /** Reactive form model compared against the baseline snapshot */
  source: Ref<T>;
  /**
   * Lodash-style paths removed on copies before comparison (e.g. `uuid`, `config.transient`)
   */
  ignorePaths?: MaybeRefOrGetter<string[] | undefined>;
  /**
   * When omitted, validity is always true
   */
  validate?: FormValidateFn<T>;
}

export interface UseFormReturn {
  /** True when current `source` differs from the baseline (after ignoring paths) */
  hasChanges: ComputedRef<boolean>;
  isValid: ComputedRef<boolean>;
  /** Replace baseline with a deep clone of the current `source` */
  resetBaseline: () => void;
  /** Clear baseline so `hasChanges` is false until the next `resetBaseline` */
  clearBaseline: () => void;
}

function normalizeForCompare<T extends object>(value: T, paths: string[]): T {
  const copy = cloneDeep(value);
  for (const path of paths) {
    unset(copy as Record<string, unknown>, path);
  }
  return copy;
}

/**
 * Tracks edits against a baseline snapshot and optional validation.
 * Call `resetBaseline` after loading or saving so the current model becomes the new “clean” state.
 */
export function useForm<T extends object>(
  options: UseFormOptions<T>,
): UseFormReturn {
  const { source, validate } = options;

  const defaultValidate: FormValidateFn<T> = () => true;
  const validateFn = validate ?? defaultValidate;

  const baseline = shallowRef<T | null>(null);

  const resolvedIgnorePaths = (): string[] =>
    toValue(options.ignorePaths) ?? [];

  const hasChanges = computed(() => {
    if (baseline.value === null) {
      return false;
    }
    const paths = resolvedIgnorePaths();
    return !isEqual(
      normalizeForCompare(source.value, paths),
      normalizeForCompare(baseline.value, paths),
    );
  });

  const isValid = computed(() => validateFn(source.value));

  const resetBaseline = () => {
    baseline.value = cloneDeep(source.value);
  };

  const clearBaseline = () => {
    baseline.value = null;
  };

  return {
    hasChanges,
    isValid,
    resetBaseline,
    clearBaseline,
  };
}
