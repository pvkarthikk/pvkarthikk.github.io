/* =========================================================
   pvkarthikk.github.io — theme, navigation, live repositories
   Zero dependencies. Progressive enhancement over static HTML.
   ========================================================= */

(function () {
  'use strict';

  var API_URL = 'https://api.github.com/users/pvkarthikk/repos?sort=updated&per_page=100';
  var OWNER = 'pvkarthikk';
  var SITE_REPO = 'pvkarthikk.github.io';
  var SAVED_LABEL = 'saved snapshot';

  var LANGUAGE_COLORS = {
    'Dart': '#00B4AB',
    'Python': '#3572A5',
    'C++': '#F34B7D',
    'C': '#555555',
    'C#': '#178600',
    'TypeScript': '#3178C6',
    'JavaScript': '#F1E05A',
    'HTML': '#E34C26',
    'CSS': '#563D7C',
    'Shell': '#89E051',
    'CMake': '#DA3434',
    'Rust': '#DEA584',
    'Go': '#00ADD8',
    'Java': '#B07219',
    'Kotlin': '#A97BFF',
    'Swift': '#F05138',
    'Ruby': '#701516'
  };

  var root = document.documentElement;
  var grid = document.getElementById('repo-grid');
  var filtersEl = document.getElementById('repo-filters');
  var statusEl = document.getElementById('repo-status');
  var header = document.querySelector('.site-header');
  var navToggle = document.querySelector('[data-nav-toggle]');
  var themeToggle = document.querySelector('[data-theme-toggle]');

  var state = {
    filter: 'all',
    source: 'saved'
  };

  /* -------------------------------------------------------
     Theme
     ------------------------------------------------------- */

  function storedTheme() {
    try {
      var value = localStorage.getItem('theme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B0F14' : '#FAFAFA');

    if (themeToggle) {
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }

    if (persist) {
      try {
        localStorage.setItem('theme', theme);
      } catch (error) {
        /* Storage may be unavailable; the theme still applies for this visit. */
      }
    }
  }

  if (themeToggle) {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  var colorScheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (colorScheme) {
    var onSchemeChange = function (event) {
      if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light', false);
    };
    if (typeof colorScheme.addEventListener === 'function') {
      colorScheme.addEventListener('change', onSchemeChange);
    } else if (typeof colorScheme.addListener === 'function') {
      colorScheme.addListener(onSchemeChange);
    }
  }

  /* -------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------- */

  function setNav(open) {
    if (!header || !navToggle) return;
    header.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (header && navToggle) {
    navToggle.addEventListener('click', function () {
      setNav(!header.classList.contains('nav-open'));
    });

    header.addEventListener('click', function (event) {
      if (event.target.closest('.site-nav a')) setNav(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('nav-open')) {
        setNav(false);
        navToggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (header.classList.contains('nav-open') && !header.contains(event.target)) {
        setNav(false);
      }
    });

    var wide = window.matchMedia ? window.matchMedia('(min-width: 821px)') : null;
    if (wide && typeof wide.addEventListener === 'function') {
      wide.addEventListener('change', function (event) {
        if (event.matches) setNav(false);
      });
    }
  }

  /* -------------------------------------------------------
     Repository grid
     ------------------------------------------------------- */

  if (!grid || !filtersEl || !statusEl) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function normalizeLanguage(language) {
    return language || 'Other';
  }

  function languageColor(language) {
    return LANGUAGE_COLORS[language] || '#8B949E';
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    try {
      return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
    } catch (error) {
      return '';
    }
  }

  function isNotableFork(repo) {
    // Keep forks only when they carry a real description and some community signal.
    return Boolean(repo.fork && repo.description && repo.stargazers_count > 0);
  }

  function normalizeRepos(payload) {
    if (!Array.isArray(payload)) return [];

    return payload
      .filter(function (repo) {
        return repo && repo.name && repo.html_url && repo.name !== SITE_REPO;
      })
      .filter(function (repo) {
        return !repo.fork || isNotableFork(repo);
      })
      .map(function (repo) {
        var language = normalizeLanguage(repo.language);
        return {
          name: repo.name,
          description: repo.description && String(repo.description).trim()
            ? String(repo.description).trim()
            : 'No description yet — explore the source code on GitHub.',
          language: language,
          languageColor: languageColor(language),
          stars: Number(repo.stargazers_count) || 0,
          url: repo.html_url,
          pagesUrl: repo.has_pages ? 'https://' + OWNER + '.github.io/' + encodeURIComponent(repo.name) + '/' : null,
          updated: formatDate(repo.updated_at),
          fork: Boolean(repo.fork)
        };
      });
  }

  var starIcon = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"><path d="M8 1.8 9.8 5.6l4.2.6-3 3 .7 4.2L8 11.4l-3.7 2-.7-4.2-3-3 4.2-.6L8 1.8Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>';
  var externalIcon = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var headExternalIcon = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M5 11 11 5M6 5h5v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function repoCard(repo) {
    var pages = repo.pagesUrl
      ? '<a class="repo-link" href="' + escapeHtml(repo.pagesUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="Open GitHub Pages site for ' + escapeHtml(repo.name) + '">GitHub Pages ' + externalIcon + '</a>'
      : '';

    var forkPill = repo.fork ? '<span class="repo-pill">Fork</span>' : '';
    var updated = repo.updated ? '<span>' + escapeHtml(repo.updated) + '</span>' : '';

    return [
      '<article class="repo-card" data-language="' + escapeHtml(repo.language) + '">',
      '  <div class="repo-card__head">',
      '    <h3 class="repo-card__title"><a href="' + escapeHtml(repo.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(repo.name) + '</a></h3>',
      '    <span class="repo-card__ext" aria-hidden="true">' + headExternalIcon + '</span>',
      '  </div>',
      '  <p class="repo-card__desc">' + escapeHtml(repo.description) + '</p>',
      '  <div class="repo-card__meta">',
      '    <span class="repo-lang"><span class="lang-dot" style="--dot:' + repo.languageColor + '"></span>' + escapeHtml(repo.language) + '</span>',
      '    <span class="repo-stat" aria-label="' + repo.stars + (repo.stars === 1 ? ' star' : ' stars') + '">' + starIcon + repo.stars + '</span>',
      '    ' + updated,
      '    ' + forkPill,
      '  </div>',
      '  <div class="repo-card__links">',
      '    <a class="repo-link" href="' + escapeHtml(repo.url) + '" target="_blank" rel="noopener noreferrer" aria-label="View source code for ' + escapeHtml(repo.name) + '">Source code ' + externalIcon + '</a>',
      '    ' + pages,
      '  </div>',
      '</article>'
    ].join('\n');
  }

  function cards() {
    return Array.prototype.slice.call(grid.querySelectorAll('.repo-card'));
  }

  function buildFilters() {
    var counts = new Map();
    cards().forEach(function (card) {
      var language = card.getAttribute('data-language') || 'Other';
      counts.set(language, (counts.get(language) || 0) + 1);
    });

    if (state.filter !== 'all' && !counts.has(state.filter)) state.filter = 'all';

    var languages = Array.from(counts.entries()).sort(function (a, b) {
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    });

    var options = [['all', 'All', cards().length]].concat(languages.map(function (entry) {
      return [entry[0], entry[0], entry[1]];
    }));

    filtersEl.innerHTML = options.map(function (option) {
      var value = option[0];
      var label = option[1];
      var count = option[2];
      var pressed = value === state.filter;
      return '<button type="button" class="chip" data-filter="' + escapeHtml(value) + '" aria-pressed="' + pressed + '" aria-label="Filter by ' + escapeHtml(label) + ', ' + count + ' repositories"><span>' + escapeHtml(label) + '</span><span class="chip__count">' + count + '</span></button>';
    }).join('');
  }

  function updateStatus() {
    var all = cards();
    var visible = all.filter(function (card) {
      return !card.hidden;
    }).length;
    var source = state.source === 'live' ? 'live from GitHub' : SAVED_LABEL;
    var language = state.filter === 'all' ? 'all languages' : state.filter;

    if (state.filter === 'all') {
      statusEl.textContent = all.length + ' repositories · ' + source;
    } else {
      statusEl.textContent = visible + ' of ' + all.length + ' · ' + language + ' · ' + source;
    }
  }

  function applyFilter(filter) {
    state.filter = filter || 'all';

    cards().forEach(function (card) {
      card.hidden = state.filter !== 'all' && card.getAttribute('data-language') !== state.filter;
    });

    filtersEl.querySelectorAll('.chip').forEach(function (chip) {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('data-filter') === state.filter));
    });

    updateStatus();
  }

  filtersEl.addEventListener('click', function (event) {
    var chip = event.target.closest('.chip');
    if (!chip) return;
    applyFilter(chip.getAttribute('data-filter'));
  });

  function renderRepos(repos) {
    grid.innerHTML = repos.map(repoCard).join('\n');
    state.source = 'live';
    buildFilters();
    applyFilter(state.filter);
  }

  async function loadRepos() {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = controller ? window.setTimeout(function () { controller.abort(); }, 9000) : null;

    try {
      var response = await fetch(API_URL, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller ? controller.signal : undefined
      });

      if (!response.ok) throw new Error('GitHub API responded with ' + response.status);

      var payload = await response.json();
      var repos = normalizeRepos(payload);
      if (!repos.length) throw new Error('No public repositories returned');

      renderRepos(repos);
    } catch (error) {
      state.source = 'saved';
      updateStatus();
      if (window.console && console.warn) {
        console.warn('Using the saved repository snapshot. Live GitHub data unavailable:', error.message);
      }
    } finally {
      if (timeout) window.clearTimeout(timeout);
    }
  }

  buildFilters();
  applyFilter('all');
  loadRepos();
})();
