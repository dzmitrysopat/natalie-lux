(function () {
  'use strict';

  var header = document.querySelector('.header');
  var nav = document.getElementById('site-nav');
  var burger = document.querySelector('.burger');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canHover = window.matchMedia('(hover: hover)');

  /* ---------- Текущий год в подвале ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Бургер-меню ---------- */
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- Плавная прокрутка между блоками ---------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute('href');
    var target = id.length > 1 ? document.querySelector(id) : null;
    var isTop = id === '#top';
    if (!target && !isTop) return;

    e.preventDefault();
    setMenu(false);

    var top = isTop ? 0 : target.getBoundingClientRect().top + window.pageYOffset - header.offsetHeight;
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion.matches ? 'auto' : 'smooth' });

    if (history.pushState) history.pushState(null, '', id);
  });

  /* ---------- Подсветка текущего раздела в меню ---------- */
  var sections = ['catalog', 'delivery', 'about', 'contacts']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = document.querySelectorAll('.nav__link');

  function setActive(id) {
    navLinks.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---------- Баннеры «Доставка» / «О нас»: текст по наведению на слово ---------- */
  document.querySelectorAll('[data-banner]').forEach(function (banner) {
    var trigger = banner.querySelector('.banner__trigger');

    function setOpen(open) {
      banner.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    }

    // мышь: открываем при наведении на слово, закрываем когда курсор покинул баннер
    trigger.addEventListener('mouseenter', function () { if (canHover.matches) setOpen(true); });
    banner.addEventListener('mouseleave', function () { if (canHover.matches) setOpen(false); });

    // клавиатура и тач: переключаем кликом
    trigger.addEventListener('click', function (e) {
      var fromMouse = canHover.matches && e.detail > 0;
      if (fromMouse) return;
      setOpen(!banner.classList.contains('is-open'));
    });
  });
})();
