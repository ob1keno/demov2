/* Порт механик боевого сайта в дизайн designs4.
   Каталог: поиск/наличие/сортировка/пагинация. Заявка: localStorage + мессенджер.
   Шапка: свёртывание, бургер, поиск. Аналитика: 9 целей Метрики. */
(function () {
  "use strict";

  /* ─────────── утилиты ─────────── */
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };
  function norm(value) {
    return String(value || "").toLowerCase().replace(/ё/g, "е").replace(/\u00ad/g, "").trim();
  }
  function priceOf(text) {
    var cleaned = String(text || "").replace(/[\s\u2009\u00a0\u202f]/g, "").replace(",", ".");
    var match = cleaned.match(/\d+(?:\.\d+)?/);
    if (!match) return null;
    var value = Number(match[0]);
    return isNaN(value) ? null : Math.round(value * 100) / 100;
  }
  function word(n) {
    var mod100 = n % 100, mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 14) return "моделей";
    if (mod10 === 1) return "модель";
    if (mod10 >= 2 && mod10 <= 4) return "модели";
    return "моделей";
  }

  /* ─────────── метрика: 9 целей ─────────── */
  var GOALS = {
    calc: "lead_calc", whatsapp: "lead_whatsapp", telegram: "lead_telegram",
    phone: "lead_phone", email: "lead_email",
    add: "request_add", open: "request_open", send: "request_send", search: "search_used",
  };
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  function goal(name) {
    try { window.ym(window.__METRIKA_ID || 0, "reachGoal", GOALS[name] || name); } catch (error) {}
  }
  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (/wa\.me|whatsapp/.test(href)) goal("whatsapp");
    else if (/t\.me|telegram/.test(href)) goal("telegram");
    else if (href.indexOf("tel:") === 0) goal("phone");
    else if (href.indexOf("mailto:") === 0) goal("email");
    else if (/запросить расчёт|расчёт/i.test(link.textContent || "")) goal("calc");
  }, true);

  /* ─────────── шапка ─────────── */
  var header = document.getElementById("siteHeader");
  function measureHeader() {
    if (!header) return;
    document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
  }
  measureHeader();
  window.addEventListener("resize", measureHeader);
  if (header) {
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y > 60) header.classList.add("is-compact");
      else if (y < 20) header.classList.remove("is-compact");
      measureHeader();
      lastY = y;
    }, { passive: true });
  }
  var burger = document.getElementById("navBurger");
  if (burger) {
    burger.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", document.body.classList.contains("nav-open") ? "true" : "false");
    });
  }
  var searchOpen = document.getElementById("searchOpen");
  var searchOverlay = document.getElementById("searchOverlay");
  if (searchOpen && searchOverlay) {
    searchOpen.addEventListener("click", function () {
      searchOverlay.classList.add("is-open");
      var input = document.getElementById("mobileSearchInput");
      if (input) { input.focus(); }
    });
    searchOverlay.addEventListener("click", function (event) {
      if (event.target === searchOverlay) searchOverlay.classList.remove("is-open");
    });
  }

  /* ─────────── заявка ─────────── */
  var KEY = "timkush-selection";
  var selection = [];
  try { selection = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (error) { selection = []; }

  function saveSelection() {
    try { localStorage.setItem(KEY, JSON.stringify(selection)); } catch (error) {}
    renderSelection();
  }
  function isSelected(id) {
    return selection.some(function (item) { return item.id === id; });
  }
  function renderSelection() {
    var counter = document.getElementById("selectionCount");
    if (counter) counter.textContent = selection.length;
    $$("[data-select]").forEach(function (button) {
      var on = isSelected(button.getAttribute("data-select"));
      button.classList.toggle("is", on);
      var keep = button.getAttribute("data-label") === "keep";
      if (!keep) {
        button.textContent = on ? "В заявке ✓" : (button.getAttribute("data-default") || "В заявку");
      }
    });
    var drawer = document.getElementById("selectionDrawer");
    if (!drawer) return;
    var list = $("[data-selection-list]", drawer);
    if (!list) return;
    list.innerHTML = selection.map(function (item) {
      return '<li><span>' + item.name + '</span><b>' + (item.price || "") + "</b>" +
        '<button type="button" data-remove="' + item.id + '" aria-label="Убрать">×</button></li>';
    }).join("");
    var empty = $("[data-selection-empty]", drawer);
    if (empty) empty.hidden = selection.length > 0;
    var request = document.getElementById("selectionRequest");
    if (request) {
      var text = ["Заявка с сайта Timkush:"]
        .concat(selection.map(function (item) { return "— " + item.name + " (" + item.price + ")"; }))
        .join("\n");
      request.href = "https://wa.me/79288040422?text=" + encodeURIComponent(text);
      var telegram = document.getElementById("selectionRequestTg");
      if (telegram) telegram.href = "https://t.me/Asia_mr_kush05";
      request.setAttribute("data-ready", String(selection.length > 0));
    }
  }

  document.addEventListener("click", function (event) {
    var add = event.target.closest("[data-select]");
    if (add) {
      var id = add.getAttribute("data-select");
      var card = add.closest("[data-product-id]") || add.closest("article");
      if (isSelected(id)) {
        selection = selection.filter(function (item) { return item.id !== id; });
      } else {
        selection.push({
          id: id,
          name: (card && card.getAttribute("data-name")) || add.getAttribute("data-name") || id,
          sku: (card && card.getAttribute("data-sku")) || "",
          url: (card && card.getAttribute("data-url")) || "",
          image: (card && card.getAttribute("data-image")) || "",
          price: add.getAttribute("data-price") || "",
        });
        goal("add");
        add.classList.add("is-just-added");
        setTimeout(function () { add.classList.remove("is-just-added"); }, 900);
      }
      saveSelection();
      return;
    }
    var remove = event.target.closest("[data-remove]");
    if (remove) {
      var removeId = remove.getAttribute("data-remove");
      selection = selection.filter(function (item) { return item.id !== removeId; });
      saveSelection();
      return;
    }
    var open = event.target.closest("[data-selection-open]");
    if (open) {
      event.preventDefault();
      var drawer = document.getElementById("selectionDrawer");
      var overlay = document.getElementById("selectionOverlay");
      if (drawer) drawer.classList.remove("translate-x-full");
      if (drawer) drawer.classList.add("is-open");
      if (overlay) overlay.classList.add("is-open");
      goal("open");
      return;
    }
    var close = event.target.closest("[data-selection-close]");
    if (close || event.target.id === "selectionOverlay") {
      var openDrawer = document.getElementById("selectionDrawer");
      var openOverlay = document.getElementById("selectionOverlay");
      if (openDrawer) { openDrawer.classList.add("translate-x-full"); openDrawer.classList.remove("is-open"); }
      if (openOverlay) openOverlay.classList.remove("is-open");
    }
  }, true);
  document.addEventListener("click", function (event) {
    if (event.target.id === "selectionRequest" || event.target.id === "selectionRequestTg") goal("send");
  }, true);

  /* ─────────── каталог ─────────── */
  var PAGE_SIZE = 24;
  var currentPage = 1;

  function gridOf(root) { return $("[data-page-size]", root || document); }
  function readCards(grid) {
    if (!grid) return [];
    return $$("article[data-search]", grid).map(function (node, index) {
      var priceNode = $("[data-price], .pr", node);
      return {
        node: node,
        search: norm(node.getAttribute("data-search")),
        paused: node.getAttribute("data-paused") === "1",
        stock: node.getAttribute("data-stock") === "1",
        price: priceNode ? priceOf(priceNode.textContent) : null,
        order: Number(node.getAttribute("data-order") || index),
        visibleIndex: -1,
      };
    });
  }
  var filterState = {
    q: norm(new URLSearchParams(location.search).get("q") || ""),
    stock: new URLSearchParams(location.search).get("stock") === "1",
    sort: (function () {
      var value = new URLSearchParams(location.search).get("sort") || "";
      return value === "price-asc" || value === "price-desc" ? value : "";
    })(),
  };
  function sortMode() { return filterState.sort; }
  function stockOnly() { return filterState.stock; }
  function query() { return filterState.q; }
  function plan(cards, search, options) {
    var visible = cards.filter(function (card) {
      if (card.paused) return false;
      if (search && !card.search.includes(search)) return false;
      if (options.stockOnly && !card.stock) return false;
      return true;
    });
    if (options.sort === "price-asc") {
      visible.sort(function (a, b) {
        var pa = a.price === null ? Infinity : a.price, pb = b.price === null ? Infinity : b.price;
        return pa === pb ? a.order - b.order : pa - pb;
      });
    } else if (options.sort === "price-desc") {
      visible.sort(function (a, b) {
        var pa = a.price === null ? -Infinity : a.price, pb = b.price === null ? -Infinity : b.price;
        return pa === pb ? a.order - b.order : pb - pa;
      });
    } else {
      visible.sort(function (a, b) { return a.order - b.order; });
    }
    visible.forEach(function (card, index) { card.visibleIndex = index; });
    var total = visible.length;
    var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    var page = Math.min(Math.max(currentPage, 1), pages);
    var start = (page - 1) * PAGE_SIZE;
    visible.forEach(function (card) {
      card.hide = card.visibleIndex < start || card.visibleIndex >= start + PAGE_SIZE;
    });
    cards.forEach(function (card) { if (card.visibleIndex < 0) card.hide = true; });
    return { cards: cards, visible: visible, page: page, pages: pages, total: total, shown: Math.max(0, Math.min(PAGE_SIZE, total - start)) };
  }

  function applyCatalog(page) {
    var grid = gridOf();
    if (!grid) return null;
    var cards = readCards(grid);
    if (!cards.length) return null;
    if (page) currentPage = page;
    var state = plan(cards, query(), { stockOnly: stockOnly(), sort: sortMode() });

    state.cards.forEach(function (card) {
      var hidden = Boolean(card.hide);
      var display = hidden ? "none" : "";
      if (card.node.style.display !== display) card.node.style.display = display;
    });

    var fragment = document.createDocumentFragment();
    state.visible.forEach(function (card) { fragment.appendChild(card.node); });
    state.cards.forEach(function (card) { if (card.visibleIndex < 0) fragment.appendChild(card.node); });
    grid.appendChild(fragment);

    currentPage = state.page;

    var size = grid.getAttribute("data-page-size");
    if (size) grid.setAttribute("data-pages", String(state.pages));

    var visibleCount = document.getElementById("catalogVisibleCount");
    if (visibleCount) visibleCount.textContent = String(state.total);

    var empty = document.getElementById("catalogEmpty");
    if (empty) empty.hidden = state.total !== 0;
    var filterEmpty = document.getElementById("catalogFilterEmpty");
    if (filterEmpty) {
      filterEmpty.hidden = !(state.total === 0 && (query() || stockOnly()));
    }

    // подпись под h1: обновляем только число показанных моделей,
    // текст боевой страницы («71 модель · у 57 из 71 цены указаны…») сохраняем
    var caption = document.querySelector("[data-count-line]");
    if (caption) {
      caption.textContent = caption.textContent.replace(
        /^\d+\s+\S+/,
        state.total + " " + word(state.total)
      );
    } else {
      // страницы порта без боевой подписи (коллекции, подкатегории): как в port-home
      var plainCaption = document.querySelector("h1 + p, h1 + .note");
      if (plainCaption) plainCaption.textContent = state.total + " " + word(state.total);
    }

    $$("[data-pager]").forEach(function (box) {
      var label = $("[data-pager-label]", box);
      if (label) label.textContent = state.page + " / " + state.pages;
      var prev = $("[data-pager-prev]", box);
      var next = $("[data-pager-next]", box);
      if (prev) prev.disabled = state.page <= 1;
      if (next) next.disabled = state.page >= state.pages;
      var shown = $("[data-pager-shown]", box);
      if (shown) shown.textContent = String(state.shown);
      var totalNode = $("[data-pager-total]", box);
      if (totalNode) totalNode.textContent = String(state.total);
      box.hidden = state.pages <= 1;
    });

    var badge = document.querySelector(".catalog-toolbar-badge");
    if (badge) badge.textContent = String(state.total);
    var toolbar = document.querySelector("#catalogToolbarReset");
    if (toolbar) toolbar.hidden = !(query() || stockOnly() || sortMode());

    return state;
  }

  function writeCatalogUrl() {
    var params = new URLSearchParams();
    if (filterState.q) params.set("q", filterState.q);
    if (filterState.stock) params.set("stock", "1");
    if (filterState.sort) params.set("sort", filterState.sort);
    var next = params.toString();
    try {
      history.replaceState(null, "", location.pathname + (next ? "?" + next : "") + location.hash);
    } catch (error) {}
  }

  var grid = gridOf();
  if (grid) {
    var searchInput = $("#catalogControls [data-search-input]") || $("[data-search-input]");
    var stockToggle = $("[data-stock-toggle]");
    var sortSelect = $("[data-sort]");

    if (searchInput) {
      searchInput.value = new URLSearchParams(location.search).get("q") || "";
      var timer = 0;
      searchInput.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          filterState.q = norm(searchInput.value);
          currentPage = 1;
          writeCatalogUrl();
          applyCatalog(1);
          if (searchInput.value.trim()) goal("search");
        }, 180);
      });
    }
    if (stockToggle) {
      stockToggle.checked = stockOnly();
      stockToggle.addEventListener("change", function () {
        filterState.stock = stockToggle.checked;
        currentPage = 1;
        writeCatalogUrl();
        applyCatalog(1);
      });
    }
    if (sortSelect) {
      sortSelect.value = sortMode();
      sortSelect.addEventListener("change", function () {
        filterState.sort = sortSelect.value;
        currentPage = 1;
        writeCatalogUrl();
        applyCatalog(1);
      });
    }
    var reset = document.getElementById("catalogToolbarReset");
    if (reset) {
      reset.addEventListener("click", function () {
        filterState.q = "";
        filterState.stock = false;
        filterState.sort = "";
        if (searchInput) searchInput.value = "";
        if (stockToggle) stockToggle.checked = false;
        if (sortSelect) sortSelect.value = "";
        currentPage = 1;
        writeCatalogUrl();
        applyCatalog(1);
      });
    }
    document.addEventListener("click", function (event) {
      var prev = event.target.closest("[data-pager-prev]");
      var next = event.target.closest("[data-pager-next]");
      if (prev && !prev.disabled) { applyCatalog(currentPage - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
      if (next && !next.disabled) { applyCatalog(currentPage + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
    applyCatalog(currentPage);
  }

  document.querySelectorAll(".variant-row input").forEach(function (input) {
    input.addEventListener("change", function () {
      var price = document.getElementById("productPrice");
      if (price) price.textContent = input.value;
      document.querySelectorAll(".variant-row").forEach(function (row) {
        row.classList.toggle("is-on", row.contains(input));
      });
    });
  });

  document.addEventListener("click", function (event) {
    var thumb = event.target.closest("[data-gallery-thumb]");
    if (!thumb) return;
    var main = document.getElementById("galleryMain");
    var source = thumb.getAttribute("data-gallery-thumb");
    if (main && main.tagName === "IMG") main.src = source;
    else if (main) main.style.backgroundImage = "url(" + source + ")";
    document.querySelectorAll("[data-gallery-thumb]").forEach(function (node) {
      node.classList.toggle("is-on", node === thumb);
    });
  });

  document.addEventListener("click", function (event) {
    var open = event.target.closest("#mobileFilters");
    var close = event.target.closest("[data-sheet-close], [data-sheet-apply]");
    var sheet = document.getElementById("catalogAside");
    var overlay = document.getElementById("catalogAsideOverlay");
    if (open && sheet) {
      sheet.classList.add("is-open");
      if (overlay) overlay.classList.add("is-open");
      event.preventDefault();
    }
    if (close || event.target.id === "catalogAsideOverlay") {
      if (sheet) sheet.classList.remove("is-open");
      if (overlay) overlay.classList.remove("is-open");
    }
  });

  renderSelection();
})();
