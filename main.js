var $ = window.$;
var accounting = window.accounting;

// config
var ITEMS_SELECTOR = '.g-items-section [id^="item_"]';
var ELEMENT_ID = 'wishlist-total';

// the database of items we're currently displaying. this is used so we can poll
// the current page for changes instead of having to scrape the entire list
// constantly.
var ITEMS = {};

// add a loading message that will be replaced later with our parsed info
$(
  '<div id="' + ELEMENT_ID + '">' +
    '<i>Calculating wish list total…</i>' +
  '</div>'
).insertAfter('.top-nav-container .g-profile-stable.clip-text:first');

// builds and returns the HTML for the total price element
var tmplPriceElement = function (attrs) {
  return (
    '<div id="' + ELEMENT_ID + '">' +
      '<span class="total-text">Subtotal (' + attrs.total_count + ' item' + (attrs.total_count === 1 ? '' : 's') + ')</span>: ' +
      '<span class="total-price a-color-price">' + accounting.formatMoney(attrs.total_price) + '</span>' +
    '</div>'
  );
};

// finds the id of the currently-viewed wish list and returns it as a string
var getCurrentWishListId = function () {
  var $state = $('script[type="a-state"][data-a-state*="navState"]');
  var json = JSON.parse($state.text());
  return json.linkArgs.id;
};

// given a `$scope` jQuery element and some selectors, returns a jQuery object
// matching the first selector that finds something, otherwise null if no
// selectors find anything.
var select = function ($scope) {
  var $items;
  for (var i = 1, length = arguments.length; i < length; i++) {
    $items = $(arguments[i], $scope);
    if ($items.length > 0) { break; }
  }

  return $items && $items.length > 0 ? $items : null;
};

// returns either the value of the given element if possible, otherwise its text
var valOrText = function ($el) { return $el.val() || $el.text(); };

// given a jQuery object for an item, parses it and returns JSON data for it
var parseItem = function ($item) {
  // each item element has an id like "id_ASDFETC"
  var id = $item.attr('id').split('_')[1];

  var $name = select($item, '[id^="itemName_"]', '.g-title a:first') || $();
  var $price = select($item, '[id^="itemPrice_"]') || $();

  var $want = select($item, '[id^="itemRequested_"]', '[name^="requestedQty"]') || $();
  var $have = select($item, '[id^="itemPurchased_"]', '[name^="purchasedQty"]') || $();

  var name = $name.text().trim();

  // this also happens to deal nicely with parsing values that have a range,
  // like '$29.95 - $33.95'. it just parses the first value, which is what we
  // would do anyway.
  var price = accounting.parse($price.text().trim());

  // luckily, these show up even when not visible on the page!
  var want = parseInt(valOrText($want), 10) || 1;
  var have = parseInt(valOrText($have), 10) || 0;
  var need = Math.max(0, want - have);

  // set all counts to zero if the item has been deleted. this means the totals
  // we get will be 0, meaning the item won't affect overall calculations.
  if ($item.closest('.g-item-sortable-removed').length > 0) {
    want = 0;
    have = 0;
    need = 0;
  }

  return {
    id: id,
    name: name,

    counts: {
      have: have,
      need: need,
      want: want
    },

    price: price,
    total_price: need * price
  };
};

// given a jQuery object representing a single wish list page, parses it into an
// array of individual JSON wish list items.
var parsePage = function ($page) {
  // turn the items jQuery object into an array of parsed items
  var $items = select($page, ITEMS_SELECTOR);
  var items = ($items || []).map(function () {
    // deleted items get parsed as having no price, which effectively deletes
    // them from the database (a useful thing so we don't have to do a real
    // delete).
    return parseItem($(this));
  });

  // turn it into a proper array, not a jQuery object
  return Array.prototype.slice.call(items);
};

// given an array of wish list pages, parses the items out of each of them and
// returns a JSON object representing the overall wish list.
var parseWishList = function (pages) {
  var items = [];
  pages.forEach(function ($page) {
    items.push.apply(items, parsePage($page));
  });
  return items;
};

// given a list of items, calculates overall price and count for them
var calculateItemTotals = function (items) {
  // the total number of needed items, taking quantity into account
  var totalCount = items.reduce(function (count, item) {
    // only count items that we found a price for, i.e. that were available on
    // Amazon and not just from other retailers.
    return count + (item.price ? item.counts.need : 0);
  }, 0);

  // the total price of all the items, taking the quantity into account
  var totalPrice = items.reduce(function (total, item) {
    return total + item.total_price;
  }, 0);

  return {
    total_count: totalCount,
    total_price: totalPrice
  };
};

// download all available pages for the given wish list and return them to the
// callback as an array of jQuery objects.
var fetchWishListPages = function (id, callback, pages) {
  // pages that have been fetched so far
  pages = pages || [];
  var pageNumber = pages.length + 1;

  console.log('fetching wish list page ' + pageNumber + '...');

  var url = window.location.pathname.split(id)[0] + id + '?' + $.param({
    page: pageNumber
  });

  // fetch the given page of results, parse them, and call the callback with
  // them.
  $.ajax({
    url: url,
    method: 'GET'
  }).done(function (data) {
    // parse the downloaded data into a jQuery object and add it to our
    // accumulated pages list.
    var $page = $(data);
    pages = pages.concat([$page]);

    // check whether there's an accessible "Next" link
    var $next = $page.find('#wishlistPagination .a-last:not(.a-disabled) a:first');
    var hasNextPage = $next.length > 0;

    // if we have another page to download, continue, otherwise return
    if (hasNextPage) {
      fetchWishListPages(id, callback, pages);
    } else {
      callback.call(null, pages);
    }
  }).fail(function () {
    // log an error and return nothing if we failed
    console.error('Failed to fetch page!', arguments);
    callback.call(null, []);
  });
};

// update the existing items with
var updateDatabaseFromItems = function (items) {
  items.forEach(function (item) {
    ITEMS[item.id] = item;
  });
};

// given a wish list id, downloads all its pages, parses the items, adds them to
// the global database, then calls the given callback.
var updateDatabaseFromAPI = function (id, callback) {
  fetchWishListPages(id, function (pages) {
    var items = parseWishList(pages);
    updateDatabaseFromItems(items);

    // notify that we've finished adding the items to the global database
    callback.call(null);
  });
};

var renderItemsFromDatabase = function () {
  // collect all the items into a single list
  var items = [];
  Object.keys(ITEMS).forEach(function (key) { items.push(ITEMS[key]); });

  var totals = calculateItemTotals(items);
  $('#' + ELEMENT_ID).replaceWith(tmplPriceElement(totals));
};

// populate the items database with an initial full download. once we've
// finished the initial download, start doing screen-scrape updates too.
var WISH_LIST_ID = getCurrentWishListId();
updateDatabaseFromAPI(WISH_LIST_ID, function () {
  // continuously check the current page for user changes to add to the database
  setInterval(function () {
    var items = parsePage($('html'));
    updateDatabaseFromItems(items);
    renderItemsFromDatabase();
  }, 250);

  // periodically do an update from the API in case other pages have changed
  setInterval(function () {
    updateDatabaseFromAPI(WISH_LIST_ID);
  }, 3 * 60 * 1000);
});
