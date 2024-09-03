// This code is modified from the original source at [jotai-valtio](https://github.com/jotaijs/jotai-valtio), licensed under the MIT license.

import { atom } from "jotai";
import { snapshot, subscribe } from "valtio";

const isObject = (x) => typeof x === "object" && x !== null;

const applyChanges = (proxyObject, previousValue, nextValue) => {
  const updateProperty = (key, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(proxyObject, key);
    if (!descriptor || descriptor.writable) {
      proxyObject[key] = value;
    }
  };

  const allKeys = new Set([
    ...Object.getOwnPropertyNames(previousValue),
    ...Object.getOwnPropertySymbols(previousValue),
    ...Object.getOwnPropertyNames(nextValue),
    ...Object.getOwnPropertySymbols(nextValue),
  ]);

  for (const key of allKeys) {
    if (!(key in nextValue)) {
      updateProperty(key, undefined);
    } else if (!(key in previousValue)) {
      updateProperty(key, nextValue[key]);
    } else if (!Object.is(previousValue[key], nextValue[key])) {
      if (
        isObject(proxyObject[key]) &&
        isObject(previousValue[key]) &&
        isObject(nextValue[key])
      ) {
        applyChanges(proxyObject[key], previousValue[key], nextValue[key]);
      } else {
        updateProperty(key, nextValue[key]);
      }
    }
  }
};

export const atomWithProxy = (proxyObject, key) => {
  const baseAtom = atom(snapshot(proxyObject)[key]);

  baseAtom.onMount = (setValue) => {
    const callback = () => {
      setValue(snapshot(proxyObject)[key]);
    };
    const unsub = subscribe(proxyObject, callback);
    callback();
    return unsub;
  };

  return atom(
    (get) => get(baseAtom),
    (get, _set, update) => {
      const currentValue = snapshot(proxyObject)[key];
      const newValue =
        typeof update === "function" ? update(currentValue) : update;

      if (isObject(currentValue) && isObject(newValue)) {
        applyChanges(proxyObject[key], currentValue, newValue);
      } else {
        proxyObject[key] = newValue;
      }
    },
  );
};
