'use strict';

// AJAX!
const ajax = window.nanoajax.ajax;

// Configuration options.
const TOTAL_PARENT_SELECTOR = '.profile-layout-aid-top';
const ELEMENT_ID = 'wishlist-total';

// Select the given elements from the document and return them as an array.
const $ = function (selectorOrElement, selector) {
  let el = selectorOrElement;
  if (typeof selectorOrElement === 'string') {
    el = document;
    selector = selectorOrElement;
  }

  return Array.prototype.slice.call(el.querySelectorAll(selector));
};

// Given a `$scope` DOM element and some selectors, returns an array of DOM
// nodes matching the first selector that finds something, otherwise an empty
// array if no selectors find anything.
const $$ = function ($scope) {
  let $items = [];
  for (let i = 1; i < arguments.length; i++) {
    $items = $($scope, arguments[i]);
    if ($items.length > 0) { break; }
  }

  return $items;
};

// Given an element and a selector, returns the closest matching parent node
// (including the element itself), or `null` if none matches.
const closest = function ($el, selector) {
  let $current = $el;
  while ($current && !$current.matches(selector)) {
    $current = $current.parentElement;
  }

  return $current || null;
};

// Build and return a DOM element for our element.
const buildPriceElement = function (attrs) {
  attrs = attrs || {};

  const el = document.createElement('div');
  el.id = ELEMENT_ID;

  if (attrs.loading) {
    el.innerHTML = '<i>Calculating wish list total…</i>';
  } else {
    const itemsPlural = `item${(attrs.total_count === 1 ? '' : 's')}`;

    // TODO: Use the built-in currenct formatting, as detected from the symbol!
    const localeTotal = attrs.total_price.toLocaleString(undefined, {
      // Always show two fraction digits since we're showing currency.
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    el.innerHTML = `
      <span class="total-text">Subtotal ${attrs.total_count} ${itemsPlural})</span>:
      <span class="total-price a-color-price">
        ${attrs.currency_symbol}${localeTotal}
      </span>
    `;
  }

  return el;
};

// The database of items we're currently displaying. This is used so we can poll
// the current page for changes instead of having to scrape the entire list
// constantly.
const ITEMS = {};

// Add a loading message that will be replaced later with our parsed info
$(TOTAL_PARENT_SELECTOR)[0].appendChild(buildPriceElement({ loading: true }));

// Finds the id of the currently-viewed wish list and returns it as a string.
const getCurrentWishListId = function () {
  const $state = $('script[type="a-state"][data-a-state*="navState"]');

  if ($state.length > 0) {
    const json = JSON.parse($state[0].textContent);
    return json.linkArgs.id;
  } else {
    return null;
  }
};

// Returns either the value of the given element if possible, otherwise its
// text.
const valOrText = function ($el) { return $el.value || $el.innerText; };

// Turns a currency string into a single floating point number. Parses only the
// first value (as determined by whitespace separation) found in the string.
const parseCurrency = function (s) {
  return parseFloat(
    (s || '')
    .trim()
    .split(/\s/)[0]
    .replace(/[^0-9.,]+/g, '')
  , 10);
};

// Given a string price, returns the most likely currency symbol it includes, or
// null if none could be found.
const parseCurrencySymbol = function (price) {
  // strip numbers, words, spaces, and delimiters, hopefully leaving a symbol
  return (price || '').replace(/(?:\s|\d|\.|\,)+/g, '');
};

// Given a DOM node for an item, parses it and returns JSON data for it.
const parseItem = function ($item) {
  // Each item element hopefully has an id like "id_ITEMIDSTUFF"
  const id = $item.id.split('_')[1];

  const $name = $$($item, '[id^="itemName_"]', '.g-title a');
  const $want = $$($item, '[id^="itemRequested_"]', '[name^="requestedQty"]');
  const $have = $$($item, '[id^="itemPurchased_"]', '[name^="purchasedQty"]');

  // If the item isn't available, attempt to use the "Used & New" price.
  let $price = $($item, '[id^="itemPrice_"]');
  if ($price.length === 0 || !$price[0].innerText.trim()) {
    $price = $($item, '.itemUsedAndNewPrice');
  }

  let itemName = '';
  if ($name.length > 0) { itemName = $name[0].innerText.trim(); }

  // This will deal nicely with parsing values that have a range, like '$29.95 -
  // $33.95' since it will parses out only the first value. Occasionally, items
  // will become "Unavailable", in which case they can't contribute to the total
  // list price and are set to a price of zero.
  let price = 0;
  let currencySymbol = '';
  if ($price[0] && $price[0].innerText.trim().toLowerCase() !== 'unavailable') {
    price = parseCurrency($price[0].innerText);
    currencySymbol = parseCurrencySymbol($price[0].innerText);
  }

  // luckily, these show up even when not visible on the page!
  let want = 1;
  if ($want.length > 0) { want = parseInt(valOrText($want[0]), 10) || 1; }

  let have = 0;
  if ($have.length > 0) { have = parseInt(valOrText($have[0]), 10) || 0; }

  let need = Math.max(0, want - have);

  // Set all counts to zero if the item has been deleted. This means the totals
  // we get will be 0, meaning the item won't affect overall calculations.
  if (closest($item, '.g-item-sortable-removed')) {
    want = 0;
    have = 0;
    need = 0;
  }

  return {
    id: id,
    name: itemName,
    currency_symbol: currencySymbol,

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
const parsePage = function ($page) {
  // Parse all items into an array of JSON objects.
  return $($page, '.g-items-section [id^="item_"]').map(function ($item) {
    // Deleted items get parsed as having no price, which effectively deletes
    // them from the database (a useful thing so we don't have to do a real
    // delete).
    return parseItem($item);
  });
};

// Given an array of wish list pages, parses the items out of each of them and
// returns a JSON object representing the overall wish list.
const parseWishList = function (pages) {
  const items = [];
  pages.forEach(function ($page) {
    items.push.apply(items, parsePage($page));
  });
  return items;
};

// given a list of items, calculates overall price and count for them
const calculateItemTotals = function (items) {
  // the total number of needed items, taking quantity into account
  const totalCount = items.reduce(function (count, item) {
    // only count items that we found a price for, i.e. that were available on
    // Amazon and not just from other retailers.
    return count + (item.price ? item.counts.need : 0);
  }, 0);

  // the total price of all the items, taking the quantity into account
  const totalPrice = items.reduce(function (total, item) {
    return total + item.total_price;
  }, 0);

  // find a valid currency symbol if one exists
  let currencySymbol;
  items.forEach(function (item) {
    currencySymbol = currencySymbol || item.currency_symbol;
  });

  return {
    currency_symbol: currencySymbol || '',
    total_count: totalCount,
    total_price: totalPrice,
  };
};

// Download all available pages for the given wish list and return them to the
// callback as an array of DOM elements.
const fetchWishListPages = function (id, callback, pages) {
  // Any pages that have been fetched so far, defaulting to none at all.
  pages = pages || [];
  const pageNumber = pages.length + 1;

  console.log(`fetching wish list page ${pageNumber}...`);

  // fetch the given page of results, parse them, and call the callback with
  // them.
  const url = window.location.pathname.split(id)[0] + id;
  ajax(`${url}?page=${pageNumber}`, function (code, responseText) {
    if (code >= 200 && code < 300) {
      // parse the downloaded data into a document and add it to our accumulated
      // pages list.
      const $page = document.implementation.createHTMLDocument();
      $page.documentElement.innerHTML = responseText;
      pages.push($page);

      // If we have another page to download (i.e. we have an accessible "Next"
      // link), continue, otherwise return.
      const $nextPage = $($page, '#wishlistPagination .a-last:not(.a-disabled) a');
      if ($nextPage.length > 0) {
        fetchWishListPages(id, callback, pages);
      } else {
        console.log('done fetching!');
        return callback(pages);
      }
    } else {
      // log an error and return nothing if we failed
      console.error('failed to fetch page', arguments);
      return callback([]);
    }
  });
};

// Add the given items to our wish list database, overwriting any existing ones.
const updateDatabaseFromItems = function (items) {
  items.forEach(function (item) {
    ITEMS[item.id] = item;
  });
};

// Given a wish list id, downloads all its pages, parses the items, adds them to
// the global database, then calls the given callback.
const updateDatabaseFromAPI = function (id, callback) {
  callback = callback || function () {};

  fetchWishListPages(id, function (pages) {
    const items = parseWishList(pages);
    updateDatabaseFromItems(items);

    // Notify that we've finished adding the items to the global database.
    callback(null);
  });
};

const renderItemsFromDatabase = function () {
  // Collect all the items into a single list.
  const items = Object.keys(ITEMS).map(function (k) { return ITEMS[k]; });

  // Render our items into the DOM, assuming it still exists!
  const totals = calculateItemTotals(items);
  const $el = $(`#${ELEMENT_ID}`)[0];
  if ($el) {
    $el.parentNode.replaceChild(buildPriceElement(totals), $el);
  }
};

// Populate the items database with an initial full download. Once we've
// finished the initial download, start doing screen-scrape updates too.
const WISH_LIST_ID = getCurrentWishListId();
updateDatabaseFromAPI(WISH_LIST_ID, function () {
  // Continuously check the current page for user changes to add to the
  // database.
  setInterval(function () {
    const items = parsePage(document.documentElement);
    updateDatabaseFromItems(items);
    renderItemsFromDatabase();
  }, 250);

  // Periodically do an update from the API in case other pages have changed.
  setInterval(function () {
    updateDatabaseFromAPI(WISH_LIST_ID);
  }, 3 * 60 * 1000);
});
