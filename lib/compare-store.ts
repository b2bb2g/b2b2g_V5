"use client";

// Tiny cross-component store for the bookmark compare picker: separate
// client islands (one toggle per card + the floating bar) share one
// selection without a context provider wrapping the server page.
const MAX_COMPARE = 3;

let selected: string[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeCompare(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCompareSnapshot(): string[] {
  return selected;
}

export function getCompareServerSnapshot(): string[] {
  return [];
}

export function toggleCompare(id: string) {
  if (selected.includes(id)) {
    selected = selected.filter((item) => item !== id);
  } else if (selected.length < MAX_COMPARE) {
    selected = [...selected, id];
  } else {
    return;
  }
  emit();
}

export function clearCompare() {
  if (!selected.length) return;
  selected = [];
  emit();
}
