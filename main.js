'use strict';

//
// UTILS
//

// Given a `$el` DOM element and some selectors, returns an array of DOM nodes
// matching the first selector that finds something, otherwise an empty array if
// no selectors match.
const selectFrom = ($el, ...selectors) => {
  for (let i = 0, len = selectors.length; i < len; i++) {
    const $items = $el.querySelectorAll(selectors[i]);
    if ($items.length > 0) { return Array.from($items); }
  }

  return [];
};

// Same as `#select`, but returns the first result, or `null` if no result
// matched.
const selectFirstFrom = (...args) => selectFrom(...args)[0] || null;

// Escapes the given string for direct use as HTML. The result is _not_ suitable
// for use in script tags or style blocks!
const escapeHTML = (s) => (s || '').replace(/[<>"]/g, (c) => {
  switch (c) {
  case '<':
    return '&lt;';
  case '>':
    return '&gt;';
  case '"':
    return '&quot;';
  default:
    throw new Error(`Invalid HTML escape character: '${c}'`);
  }
});

// A tagged template function for building a DOM element. Returns an array of
// constructed DOM elements, possibly containing only a single item if only a
// single item was specified in the string.
const DOM = (strings, ...values) => {
  const parts = [];
  for (let i = 0, len = Math.max(strings.length, values.length); i < len; i++) {
    const s = strings[i];
    const v = values[i];

    if (s) { parts.push(s); }
    if (v) { parts.push(escapeHTML(v)); }
  }

  const el = document.createElement('div');
  el.innerHTML = parts.join('').trim();

  return Array.from(el.childNodes);
};

// Turns a currency string into a single floating point number. If the number
// has thousands separators _or_ uses commas instead of periods to separate the
// fraction, we normalize the number to a decimal fraction first. If multiple
// currency values are included in the string, an average of all of them is
// returned.
const parseCurrency = (s, currency_code) => {
  // Pare down our string to include only digits, commas, periods, and single
  // literal spaces instead of multiple whitespace characters.
  s = (s || '')
      .replace(/[^0-9.,\s]+/g, '')
      .replace(/\s+/g, ' ')
      .replace(/(\d)\s\.\s(\d)/g, '$1.$2') // Handle amazon.co.uk correctly.
      .trim();

  // Get all the possible numbers in the string.
  const parts = s.split(/\s/g);

  const values = parts.map((part) => {
    // Use the number's final non-digit character to detect whether it's
    // formatted with periods (1,234.56) or commas (1.234,56).
    const commaSeparated = part.replace(/[^.,]+/g, '').endsWith(',');

    // If it's comma-separated, normalize it to a decimal number.
    //
    // JPY, unlike our other supported currencies, doesn't use decimal places
    // (Yen are typically displayed only as whole numbers) and displays as e.g.
    // `123,456`; we skip its normalization to get the correct value.
    if (commaSeparated && currency_code != 'JPY') {
      // Turns '1.234,56' into '1234.56'.
      const commaParts = part.split(',');
      part = commaParts[0].replace(/\./g, '') + '.' + commaParts[1];
    } else {
      part = part.replace(/,/g, '');
    }

    // Turn our now-normalized value into a base-10 float.
    return parseFloat(part, 10);
  });

  // Calculate and return the average of the parsed values.
  return values.reduce((sum, value) => {
    return sum + value;
  }, 0) / parts.length;
};

// Returns either the value of the given element if possible, otherwise its
// text.
const valOrText = ($el) => { return $el.value || $el.innerText; };

//
// EXTENSION
//

// Information about the current locale, including how to translate the
// different text in the application.
const LOCALE = (() => {
  const englishTemplate = Object.freeze({
    subtotal_text: (n) => `Subtotal (${n} item${(n === 1 ? '' : 's')})`,
  });

  const spanishTemplate = Object.freeze({
    subtotal_text: (n) => `Subtotal (${n} producto${(n === 1 ? '' : 's')})`,
  });

  const localizationData = {
    // ENGLISH
    '.ca': Object.assign({
      currency_code: 'CAD',
    }, englishTemplate),

    '.co.uk': Object.assign({
      currency_code: 'GBP',
    }, englishTemplate),

    '.com': Object.assign({
      currency_code: 'USD',
    }, englishTemplate),

    '.com.au': Object.assign({
      currency_code: 'AUD',
    }, englishTemplate),

    '.ie': Object.assign({
      currency_code: 'EUR',
    }, englishTemplate),

    '.in': Object.assign({
      currency_code: 'INR',
    }, englishTemplate),

    // SPANISH
    '.com.mx': Object.assign({
      currency_code: 'MXN',
    }, spanishTemplate),

    '.es': Object.assign({
      currency_code: 'EUR',
    }, spanishTemplate),

    // OTHER
    '.cn': {
      currency_code: 'CNY',
      subtotal_text: (n) => `小计 (${n} 件商品)`,
    },

    '.co.jp': {
      currency_code: 'JPY',
      subtotal_text: (n) => `小計 (${n} 商品)`,
    },

    '.com.br': {
      currency_code: 'BRL',
      subtotal_text: (n) => `Subtotal (${n} iten${(n === 1 ? '' : 's')})`,
    },

    '.de': {
      currency_code: 'EUR',
      subtotal_text: (n) => `Summe (${n} Artikel)`,
    },

    '.fr': {
      currency_code: 'EUR',
      subtotal_text: (n) => `Sous-total (${n} article${(n === 1 ? '' : 's')}))`,
    },

    '.it': {
      currency_code: 'EUR',
      subtotal_text: (n) => `Totale provvisorio (${n} articol${(n === 1 ? 'o' : 'i')})`,
    },

    '.nl': {
      currency_code: 'EUR',
      subtotal_text: (n) => `Summe (${n} Artikel)`,
    },

    '.com.tr': {
      currency_code: 'TRY',
      subtotal_text: (n) => `Ara toplam (${n} ürün)`,
    },

    '.se': {
      currency_code: 'SEK',
      subtotal_text: (n) => `Delsumma (${n} ${(n === 1 ? 'artikel' : 'artiklar')})`,
    },
  };

  // Return the first localization data that matches our domain ending.
  for (const ending in localizationData) {
    if (Object.prototype.hasOwnProperty.call(localizationData, ending)) {
      const matcher = new RegExp(`${ending.replace(/\./g, '[.]')}$`);
      if (matcher.test(window.location.hostname)) {
        return localizationData[ending];
      }
    }
  }

  // Default to USA, for lack of a better option.
  return localizationData['.com'];
})();

// Given a DOM node for an item, parses it and returns JSON data for it.
const parseItem = ($item) => {
  // Each item element hopefully has an id like "id_ITEMIDSTUFF"
  const id = $item.id.split('_')[1];

  const $name = selectFirstFrom($item, '[id^="itemName_"]', '.g-title a');
  const $want = selectFirstFrom($item, '[id^="itemRequested_"]', '[name^="requestedQty"]', '[id^="item-quantity-requested_"]');
  const $have = selectFirstFrom($item, '[id^="itemPurchased_"]', '[name^="purchasedQty"]', '[id^="item-quantity-purchased_"]');
  const $editLink = selectFirstFrom($item, '[id^="itemEditLabel_"]');

  // If the item isn't available, attempt to use the "Used & New" price.
  let $price = selectFirstFrom($item, '[id^="itemPrice_"]');
  if (!$price || !$price.innerText.trim()) {
    $price = selectFirstFrom($item, '.itemUsedAndNewPrice', '[id^="used-and-new_"] span:first-of-type');
  }

  let itemName = '';
  if ($name) { itemName = $name.innerText.trim(); }

  // Items are "blacked-out" if someone bought them for you, but they remain on
  // your list.
  let isBlackedOut = false;
  if ($editLink) {
    try {
      const data = JSON.parse(
        // Typically, data exists in this attribute.
        $editLink.dataset.regDispatchModal ||

        // NOTE: This doesn't show up for me, but apparently it replaces
        // `reg-dispatch-modal` data for some people. Hence, we fall back to it
        // if the former doesn't exist!
        $editLink.dataset.aModal
      );

      isBlackedOut = Boolean(data.data.showBlackoutMsg);
    } catch (e) {
      // Fall back to ignoring this feature if we can't parse the data.
    }
  }

  // This will deal nicely with parsing values that have a range, like "$29.95 -
  // $33.95" since it will parses out only the first value. Occasionally, items
  // will have a price of "Unavailable", in which case they can't contribute to
  // the total list price and are set to a price of zero. If the price has no
  // digits in it at all, we assume it's unavailable/broken and set its value to
  // 0.
  let price = 0;
  if ($price && /\d/.test($price.innerText)) {
    price = parseCurrency($price.innerText, LOCALE.currency_code);
  }

  // Luckily, these show up in the HTML even when not visible on the page!
  let want = 1;
  if ($want) { want = parseInt(valOrText($want), 10) || 1; }

  // Only set the `have` count if the item isn't blacked out; we don't want to
  // spoil any surprises, after all!
  let have = 0;
  if ($have && !isBlackedOut) { have = parseInt(valOrText($have), 10) || 0; }

  let need = Math.max(0, want - have);

  // Set all counts to zero if the item has been deleted. This means the totals
  // we get will be 0, meaning the item won't affect overall calculations. We
  // have to do some extra "filtering" in order to detect items that have
  // _actually_ been deleted, since Amazon fails to remove the
  // `.g-item-sortable-removed` class after an item has been un-deleted.
  if ($item.closest('.g-item-sortable-removed') &&
      $item.querySelector('.a-alert-content') &&
      $item.querySelector('.a-alert-content').textContent.match(/deleted/i)) {
    want = 0;
    have = 0;
    need = 0;
  }

  return {
    id: id,
    name: itemName,

    counts: {
      have: have,
      need: need,
      want: want,
    },

    price: price,
    total_price: need * price,
  };
};

// Given a DOM document representing a single wish list page, parses it into an
// array of individual JSON wish list items.
const parsePage = ($page) => {
  // Parse all items into an array of JSON objects.
  return selectFrom($page, '.g-items-section [id^="itemMain_"]', '.g-items-section [id^="item_"]', '#awl-list-items [id^="itemWrapper_"').map(($item) => {
    // Deleted items get parsed as having no price, which effectively deletes
    // them from the database (a useful thing so we don't have to do a real
    // delete).
    return parseItem($item);
  });
};

// Add the given items to our wish list database, overwriting any existing ones.
const updateDatabaseFromItems = (database, items) => {
  items.forEach((item) => { database.set(item.id, item); });
};

// Build and return a single DOM element for our whole application.
const render = (attrs = {}) => {
  // The name of our element. If you change this, you'll need to change the CSS
  // to match.
  const elementId = 'wishlist-total';

  // Format the total price as the locale dictates.
  const localeTotal = attrs.total_price.toLocaleString(undefined, {
    style: 'currency',
    currency: LOCALE.currency_code,
    currencyDisplay: 'symbol',
  });

  // Show the loading spinner until we're done loading all the wish list items.
  let loadingClass = '';
  if (attrs.loading) {
    loadingClass = 'loading';
  }

  const $price = DOM`
    <div id="${elementId}" class="${loadingClass}">
      <span class="total-text">${LOCALE.subtotal_text(attrs.total_count)}</span>:
      <span class="total-price a-color-price">
        ${localeTotal}
      </span>

      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
        <circle cx="50" cy="50" fill="none" stroke-linecap="round" r="40" stroke-width="10" stroke="#dddddd" stroke-dasharray="62.83185307179586 62.83185307179586">
          <animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform>
        </circle>
      </svg>
    </div>
  `;

  return $price[0];
};

// Given an iterable of item objects, calculates overall price and count.
const calculateItemTotals = (items) => {
  let totalCount = 0;
  let totalPrice = 0;
  for (const item of items) {
    // Only count items that we found a price for, i.e. that were available on
    // Amazon and not just from other retailers.
    totalCount = totalCount + (item.price ? item.counts.need : 0);
    totalPrice = totalPrice + item.total_price;
  }

  return {
    total_count: totalCount,
    total_price: totalPrice,
  };
};

// Hashes the given database and returns a unique value that changes when the
// database meaningfully changes.
const hashDatbaseForRendering = (database) => {
  const totals = calculateItemTotals(database.values());
  return (totals.total_count * 31) + (totals.total_price * 7);
};

// Re-render into `$root` only if the hash has changed since the last render.
// Returns the new hash of the given database as calculated by
// `#hashDatbaseForRendering`.
const renderIntoRootFromDatabase = ($root, allItemsLoaded, database, previousHash = null) => {
  // Render our items into the DOM, assuming it still exists!
  const attrs = calculateItemTotals(database.values());
  attrs.loading = !allItemsLoaded;

  // If the hash has changed since the last rendering, we need to re-render.
  const currentHash = hashDatbaseForRendering(database) + allItemsLoaded;
  if (currentHash !== previousHash) {
    $root.innerHTML = render(attrs).outerHTML;
  }

  return currentHash;
};

//
// MAIN
//

(() => {
  // Build our root element, the one we'll render everything in to.
  const $root = document.body.appendChild(document.createElement('div'));

  // The database of items we're currently displaying. This is used so we can
  // poll the current page for changes instead of having to scrape the entire
  // list constantly.
  const database = new Map();

  // We set this to `null` explicitly so that the first time the database is
  // _actually_ hashed, it will force a render and replace the loading message.
  let DATABASE_HASH = null;

  // The last time the DOM changed in any way.
  let LAST_CHANGE_TIME = 0;

  // The interval that parses the page and looks for changes. If no DOM changes
  // happen within a short timeout, this cancels itself to save resources.
  let LAST_CHANGE_INTERVAL = null;

  // The number of milliseconds between update polls, and the amount of time to
  // wait before canceling the update poller interval.
  const updateIntervalMS = 250;

  // Check the current page for user changes to add to the database. If no DOM
  // change has been detected in a while, cancel the interval that re-parses the
  // page.
  const update = () => {
    const items = parsePage(document.documentElement);
    updateDatabaseFromItems(database, items);

    // Once we find the "end of list" marker element, this means that the page
    // won't be loading anymore elements and we can consider ourselves "loaded".
    const allItemsLoaded = Boolean(selectFirstFrom(
      document.documentElement,
      '#endOfListMarker',
      '#no-items-section-anywhere'
    ));

    // Update the hash to reflect what was just rendered.
    DATABASE_HASH = renderIntoRootFromDatabase(
      $root,
      allItemsLoaded,
      database,
      DATABASE_HASH
    );

    // If it's been too long without an update, cancel this interval.
    if (Date.now() > LAST_CHANGE_TIME + updateIntervalMS) {
      clearInterval(LAST_CHANGE_INTERVAL);
      LAST_CHANGE_INTERVAL = null;
    }
  };

  new MutationObserver(() => {
    // Mark the last time we observed a change so `#update()` can know how long
    // it's been since the most recent change.
    LAST_CHANGE_TIME = Date.now();

    // Restart the debounced update interval if it cancelled itself.
    if (!LAST_CHANGE_INTERVAL) {
      // Also trigger on the "leading edge" for maximum responsiveness.
      update();
      LAST_CHANGE_INTERVAL = setInterval(update, updateIntervalMS);
    }
  }).observe(document.documentElement, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
  });

  // Kick off the initial update event to ensure that we capture all possible
  // page state without having to wait for the DOM to change.
  update();
})();
