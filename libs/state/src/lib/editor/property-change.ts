import { get, set, unset } from 'lodash-es';
import { create } from 'mutative';

export enum PropertyChangeType {
  KEY,
  VALUE,
  CLEAR,
}

export interface PropertyChange {
  type: PropertyChangeType;
  path: string[];
  newPath?: string[];
  value?: unknown;
}

const modifyTargetKey = <T extends Record<string, unknown>>(
  target: T,
  { path, newPath }: Omit<PropertyChange, 'type'>,
): T => {
  if (!newPath?.length) {
    throw new Error('Unable to modify target key without newPath');
  }

  const oldKey = path[path.length - 1];
  const newKey = newPath[path.length - 1];

  // Modify key without changing position in object
  const modifyKey = (p: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(p).map(([k, v]) => [k === oldKey ? newKey : k, v]));

  if (newPath.length > 1) {
    const parentPath = newPath.slice(0, -1);
    const parent = get(target, parentPath);
    const newParent = modifyKey(parent);

    return create(target, (draft) => {
      set(draft, parentPath, newParent);
    });
  } else {
    return modifyKey(target) as T;
  }
};

const modifyTargetValue = <T extends Record<string, unknown>>(
  target: T,
  { path, value }: Omit<PropertyChange, 'type'>,
): T =>
  create(target, (draft) => {
    set(draft, path, value);
  });

const modifyTargetClear = <T extends Record<string, unknown>>(
  target: T,
  { path }: Omit<PropertyChange, 'type'>,
): T =>
  create(target, (draft) => {
    unset(draft, path);
  });

export const modifyPropertyTarget = <T extends Record<string, unknown>>(
  target: T,
  { type, ...change }: PropertyChange,
): T => {
  switch (type) {
    case PropertyChangeType.KEY:
      return modifyTargetKey(target, change);
    case PropertyChangeType.VALUE:
      return modifyTargetValue(target, change);
    case PropertyChangeType.CLEAR:
      return modifyTargetClear(target, change);
  }
};
