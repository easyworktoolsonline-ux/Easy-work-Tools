/* =====================================================================
   EasyWorkTools.online - shared lazy library loader
   ---------------------------------------------------------------------
   Nine tools need a third-party library (pdf-lib, pdf.js, JSZip, heic2any).
   Their combined weight is 2.7 MB, and not one byte of it is needed until
   the visitor picks a file. Fetching it on page load put 260 KB on the
   critical path of a tool whose first paint is a form.

   This loader is the single definition of that behaviour, so the nine
   tools cannot drift apart. It is deliberately small and dependency-free.

   Contract:

     window.EwtLibs.load('pdf.min')     -> Promise, resolved when the
                                           global is ready to use
     window.EwtLibs.preload('pdf.min')  -> starts the fetch, returns nothing
     window.EwtLibs.url('pdf.min')      -> the resolved same-origin URL

   Guarantees that matter, each of which has bitten a hand-rolled version:

   1. PER-SRC CACHE. A second call for the same library returns the first
      promise. It never fetches twice and never creates a second pending
      promise, so a user who picks three files waits for one download.

   2. A FAILED FETCH IS CACHED AS A FAILURE, not retried forever. The
      rejection is handled by the caller, and a later call gets the same
      rejected promise rather than hanging on a new request that will also
      fail. The pending promise carries a no-op catch so an unhandled
      rejection never reaches the console.

   3. PRELOAD IS IDEMPOTENT and is exactly the same code path as load(),
      so a preload that has already completed is not re-fetched when the
      button handler calls load().

   The load is same-origin (assets/vendor/), which means it is covered by the
   site's own cache headers and costs no third-party request.
   ===================================================================== */
(function (global) {
  'use strict';

  var BASE = '/assets/vendor/';

  /* file name -> the global the library defines once it has run */
  var LIBS = {
    'pdf-lib.min.js': 'PDFLib',
    'pdf.min.js': 'pdfjsLib',
    'jszip.min.js': 'JSZip',
    'heic2any.min.js': 'heic2any',
    'pdf.worker.min.js': null       // worker, loaded by pdf.js itself
  };

  var cache = Object.create(null);

  function entry(name) {
    if (!Object.prototype.hasOwnProperty.call(LIBS, name)) {
      return Promise.reject(new Error('Unknown library: ' + name));
    }
    if (cache[name]) return cache[name];

    var globalName = LIBS[name];
    if (globalName && global[globalName]) {
      // already present (another script tag loaded it): resolve immediately
      cache[name] = Promise.resolve(global[globalName]);
      return cache[name];
    }

    cache[name] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = BASE + name;
      s.async = false;          // preserve execution order when several load
      s.onload = function () {
        if (globalName && !global[globalName]) {
          reject(new Error(name + ' loaded but did not define ' + globalName));
          return;
        }
        resolve(globalName ? global[globalName] : true);
      };
      s.onerror = function () {
        reject(new Error('Could not load ' + name + '. Check your connection and try again.'));
      };
      document.head.appendChild(s);
    });

    // Swallow the rejection here so an un-awaited preload never surfaces as an
    // unhandled rejection. Callers that care still see it on their own .catch.
    cache[name].catch(function () { /* handled by the caller, or nothing to do */ });

    return cache[name];
  }

  global.EwtLibs = {
    load: entry,
    preload: function (name) { entry(name); },
    url: function (name) { return BASE + name; },
    isLoaded: function (name) {
      var g = LIBS[name];
      return !!(g && global[g]);
    }
  };
})(window);
