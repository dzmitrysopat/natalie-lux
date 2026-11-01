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

  /* ==========================================================
     Каталог: данные из data/shop.json
     Формат: { categories: [{id, name}], items: [{name, category, price,
              description, image, image2, image3}] }
     (вместо image/image2/image3 можно указать массив "images")
     ========================================================== */
  var DATA_URL = 'data/shop.json';
  var PAGE_SIZE = 9;       // сколько карточек показывать за раз
  var CURRENCY = 'BYN';

  var gridEl = document.getElementById('productGrid');
  var filtersEl = document.getElementById('filters');
  var moreBtn = document.getElementById('loadMore');

  var state = { items: [], categories: [], category: 'all', shown: PAGE_SIZE, rendered: 0 };
  var swipers = [];

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;   // textContent — без риска внедрения HTML из JSON
    return node;
  }

  function getImages(p) {
    if (Array.isArray(p.images)) return p.images.filter(Boolean);
    return [p.image, p.image2, p.image3].filter(Boolean);
  }

  function formatPrice(value) {
    return Number(value).toLocaleString('ru-RU') + ' ' + CURRENCY;
  }

  function filteredItems() {
    if (state.category === 'all') return state.items;
    return state.items.filter(function (p) { return p.category === state.category; });
  }

  /* --- фильтры --- */
  function renderFilters() {
    filtersEl.innerHTML = '';
    [{ id: 'all', name: 'Все' }].concat(state.categories).forEach(function (cat) {
      var li = el('li');
      var btn = el('button', 'filters__item', cat.name);
      var active = cat.id === state.category;
      btn.type = 'button';
      btn.dataset.category = cat.id;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
      li.appendChild(btn);
      filtersEl.appendChild(li);
    });
  }

  filtersEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-category]');
    if (!btn || btn.dataset.category === state.category) return;
    state.category = btn.dataset.category;
    state.shown = PAGE_SIZE;
    renderFilters();
    renderProducts(true);
  });

  /* --- карточка товара --- */
  function createCard(p) {
    var li = el('li', 'card');
    var images = getImages(p);
    if (!window.Swiper) images = images.slice(0, 1);   // если слайдер не загрузился — только первое фото

    var media = el('div', 'card__media swiper');
    var wrapper = el('div', 'swiper-wrapper');
    images.forEach(function (src) {
      var slide = el('div', 'swiper-slide');
      var img = el('img', 'card__img');
      img.src = src;
      img.alt = p.alt || p.name;
      img.width = 357;
      img.height = 457;
      img.loading = 'lazy';
      img.decoding = 'async';
      slide.appendChild(img);
      wrapper.appendChild(slide);
    });
    media.appendChild(wrapper);

    var dots = el('div', 'card__dots');
    li.appendChild(media);
    li.appendChild(dots);
    li.appendChild(el('h3', 'card__title', p.name));
    if (p.description) li.appendChild(el('p', 'card__meta', p.description));
    li.appendChild(el('p', 'card__price', formatPrice(p.price)));

    if (window.Swiper && images.length > 1) {
      swipers.push(new Swiper(media, {
        rewind: true,
        slidesPerView: 1,
        spaceBetween: 10,
        grabCursor: true,
        keyboard: { enabled: true, onlyInViewport: true },
        pagination: { el: dots, clickable: true },
        autoplay: reduceMotion.matches ? false : { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }
      }));
    }
    return li;
  }

  /* --- список --- */
  function renderProducts(reset) {
    if (reset) {
      swipers.forEach(function (s) { s.destroy(true, true); });
      swipers = [];
      gridEl.innerHTML = '';
      state.rendered = 0;
    }

    var list = filteredItems();
    var fragment = document.createDocumentFragment();
    list.slice(state.rendered, state.shown).forEach(function (p) {
      fragment.appendChild(createCard(p));
    });
    gridEl.appendChild(fragment);
    state.rendered = Math.min(state.shown, list.length);

    if (!list.length) {
      gridEl.appendChild(el('li', 'grid__empty', 'В этой категории пока нет товаров.'));
    }
    moreBtn.hidden = list.length <= state.shown;
  }

  moreBtn.addEventListener('click', function () {
    state.shown += PAGE_SIZE;
    renderProducts(false);
  });

  /* --- SEO: разметка Product/Offer, генерируется из тех же данных --- */
  function injectSchema(items) {
    var tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.map(function (p, i) {
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            description: p.description || undefined,
            image: getImages(p),
            offers: {
              '@type': 'Offer',
              price: p.price,
              priceCurrency: CURRENCY,
              availability: 'https://schema.org/InStock'
            }
          }
        };
      })
    });
    document.head.appendChild(tag);
  }

  /* --- загрузка --- */
  fetch(DATA_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      state.items = Array.isArray(data) ? data : (data.items || []);
      state.categories = data.categories || [];
      if (!state.categories.length) {                       // категории не заданы — берём из товаров
        var seen = {};
        state.items.forEach(function (p) {
          if (p.category && !seen[p.category]) {
            seen[p.category] = true;
            state.categories.push({ id: p.category, name: p.category });
          }
        });
      }
      renderFilters();
      renderProducts(true);
      injectSchema(state.items);
    })
    .catch(function (err) {
      console.error('Не удалось загрузить каталог:', err);
      gridEl.innerHTML = '';
      gridEl.appendChild(el('li', 'grid__empty',
        'Не удалось загрузить каталог. Если вы открыли index.html двойным кликом, запустите сайт через локальный сервер.'));
    });
})();
