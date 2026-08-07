/**
 * fnop-carousel-align.js
 *
 * Shared alignment guard for UIkit sliders configured with center: true.
 * Opt in by adding  data-fnop-align  to the element that carries  uk-slider.
 *
 * When UIkit silently falls back to finite mode (its internal finite() ORs the
 * attribute with its own geometry check), a centred slider shows a half-tile of
 * empty space beside the first tile. This script detects that condition and
 * re-initialises the slider with center: false.
 *
 * Logic (per element, per viewport):
 *   1. Measure: does the content overflow the container?
 *   2. Read UIkit.slider(el).finite  (the resolved value, not the attribute).
 *   3. overflows && finite  → destroy, rewrite uk-slider with center:false, re-init.
 *   4. !overflows           → hide nav controls (nowhere to navigate).
 *   5. Otherwise            → leave it alone (loop is working, centring is fine).
 *
 * Re-runs on resize (debounced) and on shopify:section:load.
 */
(function () {
  'use strict';

  var DEBOUNCE_MS = 200;
  var ATTR = 'data-fnop-align';
  var REINIT_FLAG = 'data-fnop-align-reinit';

  /* ── helpers ─────────────────────────────────────────────────────── */

  function contentWidth(sliderEl) {
    var items = sliderEl.querySelector('.uk-slider-items');
    if (!items) return 0;
    var w = 0;
    for (var i = 0; i < items.children.length; i++) {
      w += items.children[i].offsetWidth;
    }
    return w;
  }

  function containerWidth(sliderEl) {
    var c = sliderEl.querySelector('.uk-slider-container');
    return c ? c.offsetWidth : sliderEl.offsetWidth;
  }

  function hideControls(sliderEl) {
    var navs = sliderEl.querySelectorAll('[uk-slidenav-previous], [uk-slidenav-next], [uk-slider-item]');
    for (var i = 0; i < navs.length; i++) navs[i].setAttribute('hidden', '');
    var dots = sliderEl.querySelectorAll('.uk-slider-nav');
    for (var j = 0; j < dots.length; j++) dots[j].setAttribute('hidden', '');
  }

  function showControls(sliderEl) {
    var navs = sliderEl.querySelectorAll('[uk-slidenav-previous], [uk-slidenav-next], [uk-slider-item]');
    for (var i = 0; i < navs.length; i++) navs[i].removeAttribute('hidden');
    var dots = sliderEl.querySelectorAll('.uk-slider-nav');
    for (var j = 0; j < dots.length; j++) dots[j].removeAttribute('hidden');
  }

  /* Replace  center: true  with  center: false  in a UIkit options string */
  function patchCenter(opts) {
    return opts.replace(/center\s*:\s*true/gi, 'center: false');
  }

  /* ── per-element guard ───────────────────────────────────────────── */

  function guard(el) {
    if (!window.UIkit) return;

    var slider = UIkit.slider(el);
    if (!slider) return;

    var overflows = contentWidth(el) > containerWidth(el);
    var isFinite = slider.finite;

    if (overflows && isFinite) {
      /* Case 3 — centring broke because UIkit fell back to finite.
         Destroy, rewrite with center:false, re-init. */
      var opts = el.getAttribute('uk-slider') || '';
      slider.$destroy();
      el.removeAttribute('uk-slider');

      /* Clean up leftover UIkit state on items */
      var items = el.querySelectorAll('.uk-slider-items > *');
      for (var i = 0; i < items.length; i++) {
        items[i].style.removeProperty('order');
        items[i].classList.remove('uk-slide-active');
        items[i].removeAttribute('inert');
        items[i].removeAttribute('aria-hidden');
        items[i].removeAttribute('tabindex');
      }
      var list = el.querySelector('.uk-slider-items');
      if (list) list.style.transform = 'none';

      var patched = patchCenter(opts);
      el.setAttribute('uk-slider', patched);
      el.setAttribute(REINIT_FLAG, '');
      UIkit.slider(el);
      showControls(el);
    } else if (!overflows) {
      /* Case 4 — everything fits, no navigation needed. */
      /* Strip stray uk-slide-active / uk-active left by UIkit before $destroy */
      var fitItems = el.querySelectorAll('.uk-slider-items > *');
      for (var k = 0; k < fitItems.length; k++) {
        fitItems[k].classList.remove('uk-slide-active', 'uk-active');
      }
      hideControls(el);
    } else {
      /* Case 5 — overflows and loop is working. Leave it alone. */
      showControls(el);
    }
  }

  /* ── orchestration ───────────────────────────────────────────────── */

  function runAll() {
    var els = document.querySelectorAll('[' + ATTR + ']');
    for (var i = 0; i < els.length; i++) guard(els[i]);
  }

  function boot() {
    if (!window.UIkit) {
      /* UIkit not loaded yet — poll briefly */
      var tries = 0;
      var poll = setInterval(function () {
        tries++;
        if (window.UIkit) { clearInterval(poll); runAll(); }
        if (tries >= 30) clearInterval(poll);
      }, 150);
    } else {
      runAll();
    }
  }

  /* Wait for DOM + a frame so UIkit has initialised its sliders */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 120); });
  } else {
    setTimeout(boot, 120);
  }

  /* Resize — debounced */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      /* On resize, previously re-inited sliders may need to go back to centred.
         Restore original opts before re-evaluating. */
      var els = document.querySelectorAll('[' + REINIT_FLAG + ']');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var origOpts = el.getAttribute('data-fnop-align-orig');
        if (origOpts) {
          var slider = UIkit.slider(el);
          if (slider) slider.$destroy();
          el.removeAttribute('uk-slider');
          var list = el.querySelector('.uk-slider-items');
          if (list) list.style.transform = 'none';
          var items = el.querySelectorAll('.uk-slider-items > *');
          for (var j = 0; j < items.length; j++) {
            items[j].style.removeProperty('order');
            items[j].classList.remove('uk-slide-active');
            items[j].removeAttribute('inert');
            items[j].removeAttribute('aria-hidden');
            items[j].removeAttribute('tabindex');
          }
          el.setAttribute('uk-slider', origOpts);
          el.removeAttribute(REINIT_FLAG);
          UIkit.slider(el);
        }
      }
      /* Now re-evaluate all */
      setTimeout(runAll, 80);
    }, DEBOUNCE_MS);
  });

  /* Theme editor support */
  document.addEventListener('shopify:section:load', function () { setTimeout(boot, 200); });

  /* ── save original opts on first encounter ───────────────────────── */
  var origObserver = new MutationObserver(function () {
    var els = document.querySelectorAll('[' + ATTR + '][uk-slider]');
    for (var i = 0; i < els.length; i++) {
      if (!els[i].hasAttribute('data-fnop-align-orig')) {
        els[i].setAttribute('data-fnop-align-orig', els[i].getAttribute('uk-slider'));
      }
    }
  });
  origObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['uk-slider'] });

  /* Also capture any already present */
  document.addEventListener('DOMContentLoaded', function () {
    var els = document.querySelectorAll('[' + ATTR + '][uk-slider]');
    for (var i = 0; i < els.length; i++) {
      if (!els[i].hasAttribute('data-fnop-align-orig')) {
        els[i].setAttribute('data-fnop-align-orig', els[i].getAttribute('uk-slider'));
      }
    }
  });
})();
