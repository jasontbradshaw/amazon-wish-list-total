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
const parseCurrency = (s) => {
  // Pare down our string to include only digits, commas, periods, and single
  // literal spaces instead of multiple whitespace characters.
  s = (s || '')
      .replace(/[^0-9.,\s]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Get all the possible numbers in the string.
  const parts = s.split(/\s/g);

  const values = parts.map((part) => {
    // Use the number's final non-digit character to detect whether it's
    // formatted with periods (1,234.56) or commas (1.234,56).
    const commaSeparated = part.replace(/[^.,]+/g, '').endsWith(',');

    // If it's comma-separated, normalize it to a decimal number.
    if (commaSeparated) {
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
    loading_text: 'Calculating wish list total…',
    subtotal_text: (n) => `Subtotal (${n} item${(n === 1 ? '' : 's')})`,
  });

  const spanishTemplate = Object.freeze({
    loading_text: 'Cálculo lista de artículos deseados total de…',
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
      loading_text: '计算愿望清单总…',
      subtotal_text: (n) => `小计 (${n} 件商品)`,
    },

    '.co.jp': {
      currency_code: 'JPY',
      loading_text: 'ウィッシュリスト合計を計算…',
      subtotal_text: (n) => `小計 (${n} 商品)`,
    },

    '.com.br': {
      currency_code: 'BRL',
      loading_text: 'Calculando lista de desejos total de…',
      subtotal_text: (n) => `Subtotal (${n} iten${(n === 1 ? '' : 's')})`,
    },

    '.de': {
      currency_code: 'EUR',
      loading_text: 'Berechnung Wunschzettel insgesamt…',
      subtotal_text: (n) => `Summe (${n} Artikel)`,
    },

    '.fr': {
      currency_code: 'EUR',
      loading_text: 'Calcul liste de souhaits totale…',
      subtotal_text: (n) => `Sous-total (${n} article${(n === 1 ? '' : 's')}))`,
    },

    '.it': {
      currency_code: 'EUR',
      loading_text: 'Calcolo lista dei desideri totale…',
      subtotal_text: (n) => `Totale provvisorio (${n} articol${(n === 1 ? 'o' : 'i')})`,
    },

    '.nl': {
      currency_code: 'EUR',
      loading_text: 'Berekenen wens lijst totaal…',
      subtotal_text: (n) => `Summe (${n} Artikel)`,
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
  const $want = selectFirstFrom($item, '[id^="itemRequested_"]', '[name^="requestedQty"]');
  const $have = selectFirstFrom($item, '[id^="itemPurchased_"]', '[name^="purchasedQty"]');
  const $editLink = selectFirstFrom($item, '[id^="itemEditLabel_"]');

  // If the item isn't available, attempt to use the "Used & New" price.
  let $price = selectFirstFrom($item, '[id^="itemPrice_"]');
  if (!$price || !$price.innerText.trim()) {
    $price = selectFirstFrom($item, '.itemUsedAndNewPrice');
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
    price = parseCurrency($price.innerText);
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
  // we get will be 0, meaning the item won't affect overall calculations.
  if ($item.closest('.g-item-sortable-removed')) {
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
  return selectFrom($page, '.g-items-section [id^="item_"]').map(($item) => {
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

  let $price;
  if (attrs.loading) {
    $price = DOM`
      <div id="${elementId}" class="animation-fade-in">
        <i>${LOCALE.loading_text}</i>
      </div>
    `;
  } else {
    // Format the total price as the locale dictates.
    const localeTotal = attrs.total_price.toLocaleString(undefined, {
      style: 'currency',
      currency: LOCALE.currency_code,
      currencyDisplay: 'symbol',
    });

    $price = DOM`
      <div id="${elementId}">
        <span class="total-text">${LOCALE.subtotal_text(attrs.total_count)}</span>:
        <span class="total-price a-color-price">
          ${localeTotal}
        </span>
      </div>
    `;
  }

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
const renderIntoRootFromDatabase = ($root, database, previousHash = null) => {
  // Render our items into the DOM, assuming it still exists!
  const totals = calculateItemTotals(database.values());

  // If the hash has changed since the last rendering, we need to re-render.
  const currentHash = hashDatbaseForRendering(database);
  if (currentHash !== previousHash) {
    $root.innerHTML = render(totals).outerHTML;
  }

  return currentHash;
};

//
// MAIN
//

(() => {
  // Build our root element, the one we'll render everything in to.
  const $root = document.body.appendChild(document.createElement('div'));

  // Do an initial render of a loading message. This will be replaced once we
  // successfully calculate the totals.
  $root.appendChild(render({ loading: true }));

  // The database of items we're currently displaying. This is used so we can
  // poll the current page for changes instead of having to scrape the entire
  // list constantly.
  const database = new Map();

  // We set this to `null` explicitly so that the first time the database is
  // _actually_ hashed, it will force a render and replace the loading message.
  let databaseHash = null;

  // Continuously check the current page for user changes to add to the
  // database.
  setInterval(() => {
    const items = parsePage(document.documentElement);
    updateDatabaseFromItems(database, items);

    // Update the hash to reflect what was just rendered.
    databaseHash = renderIntoRootFromDatabase($root, database, databaseHash);
  }, 100);
})();
