/* ============================================================
   READER — return the visitor to exactly where they left off.
   The browser's own Back button restores scroll position natively;
   this makes the on-page "Back" link behave the same way when the
   reader arrived from within the site.
   ============================================================ */
(function () {
  "use strict";
  var cameFromSite =
    window.history.length > 1 &&
    document.referrer &&
    document.referrer.indexOf(window.location.host) !== -1;

  Array.prototype.forEach.call(document.querySelectorAll("[data-back]"), function (a) {
    a.addEventListener("click", function (e) {
      if (cameFromSite) {
        e.preventDefault();
        window.history.back();
      }
      /* otherwise the href (../index.html#words) handles a direct visit */
    });
  });
})();
