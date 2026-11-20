/* Safari fix for pdf.js (v5.4.1): Safari has no async iteration on ReadableStream, which pdf.js uses to read page text
   (`for await (const chunk of stream)`) on the page and in its worker; the pdf.js legacy build does not patch it.
   Standard polyfill, added only where missing (Chrome/Firefox keep their own). Loaded before pdf.js. */
(function (g) {
  var RS = g.ReadableStream;
  if (!RS || typeof Symbol === 'undefined' || !Symbol.asyncIterator || RS.prototype[Symbol.asyncIterator]) return;
  function iter(opts) {
    var reader = this.getReader(), keep = !!(opts && opts.preventCancel), done = false;
    var it = {
      next: function () { if (done) return Promise.resolve({ value: undefined, done: true });
        return reader.read().then(function (r) { if (r.done) { done = true; reader.releaseLock(); } return r; }); },
      'return': function (v) { if (done) return Promise.resolve({ value: v, done: true }); done = true;
        var p = keep ? Promise.resolve() : reader.cancel(v);
        return p.then(function () { reader.releaseLock(); return { value: v, done: true }; }); }
    };
    it[Symbol.asyncIterator] = function () { return this; };
    return it;
  }
  Object.defineProperty(RS.prototype, Symbol.asyncIterator, { value: iter, writable: true, configurable: true });
  if (!RS.prototype.values) Object.defineProperty(RS.prototype, 'values', { value: iter, writable: true, configurable: true });
})(typeof globalThis !== 'undefined' ? globalThis : self);
