"use client";

/**
 * Browser page translation (Chrome's "Translate this page" in particular)
 * replaces text nodes with its own elements. When React later removes or
 * inserts next to a text node that is no longer where it left it, the DOM
 * throws and the whole page fails. Visitors abroad often translate the
 * Georgian pages, so these two calls skip that impossible case instead of
 * throwing; everything else behaves exactly as before.
 * See https://github.com/facebook/react/issues/11538.
 */
if (typeof window !== "undefined" && typeof Node === "function" && Node.prototype) {
  const prototype = Node.prototype as Node & { __translateGuard?: boolean };
  if (!prototype.__translateGuard) {
    prototype.__translateGuard = true;
    const removeChild = prototype.removeChild;
    prototype.removeChild = function guardedRemoveChild<T extends Node>(this: Node, child: T): T {
      if (child.parentNode !== this) return child;
      return removeChild.call(this, child) as T;
    };
    const insertBefore = prototype.insertBefore;
    prototype.insertBefore = function guardedInsertBefore<T extends Node>(this: Node, node: T, reference: Node | null): T {
      if (reference && reference.parentNode !== this) return insertBefore.call(this, node, null) as T;
      return insertBefore.call(this, node, reference) as T;
    };
  }
}

export function TranslateGuard() {
  return null;
}
