var $ = window.$;
var accounting = window.accounting;

// config
var POLL_INTERVAL = 500;

var ITEMS_SELECTOR_FULL = '.g-items-section > [data-itemid]';
var ITEMS_SELECTOR_COMPACT = '.g-compact-items tr + tr'; // skip the header
var TOTAL_ID = 'wishlist-total';

// insert a dummy total element that will be updated with new content later
var $total = $('<div/>')
    .insertAfter('.top-nav-container .g-profile-stable.clip-text:first');

// builds and returns the HTML for the total price element
var tmplPriceElement = function (attrs) {
  return (
    '<div id="' + TOTAL_ID + '">' +
      '<span class="total-text">Subtotal (' + attrs.total_count + ' item' + (attrs.total_count === 1 ? '' : 's') + ')</span>: ' +
      '<span class="total-price a-color-price">' + accounting.formatMoney(attrs.total_price) + '</span>' +
    '</div>'
  );
};

// if the selector finds things, returns a jQuery object, otherwise null. can
// supply a $scope element as the first argument, and that jQuery element will
// be used as the scope for the given selector(s). if more than one selector
// argument is supplied, the first that returns something will be returned.
var select = function ($scope) {
  var selectorsStart = 0;
  var context;

  // if we were given a jQuery object as our first argument, scope to it
  if (typeof $scope !== 'string') {
    context = $scope;
    selectorsStart = 1;
  }

  var $items;
  for (var i = selectorsStart, length = arguments.length; i < length; i++) {
    $items = $(arguments[i], context);
    if ($items.length > 0) { break; }
  }

  return $items && $items.length > 0 ? $items : null;
};

// returns either the value of the given element if possible, otherwise its text
var valOrText = function ($el) { return $el.val() || $el.text(); };

// returns the items on the page, regardless of what view the wishlist is in
var getItemElements = function () {
  // each returns either a jQuery object of the items, or null
  return select(ITEMS_SELECTOR_FULL, ITEMS_SELECTOR_COMPACT);
};

// given an item, parses it and returns JSON data for it
var parseItem = function ($item) {
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

  return {
    name: name,

    want: want,
    have: have,
    need: need,

    price: price,
    total_price: need * price
  };
};

// given a jQuery object of items, parses them into an array of parsed items.
// also includes totals for count and price and stores them on the array object.
var parseItems = function ($items) {
  // turn the items jQuery object into an array of parsed items
  var items = [];
  if ($items) {
    $items.each(function () {
      // skip removed items
      if ($(this).is(':not(.g-item-sortable-removed)')) {
        items.push(parseItem($(this)));
      }
    });
  }

  // the total number of needed items, taking quantity into account
  items.total_count = items.reduce(function (count, cur) {
    // only count items that we found a price for, i.e. that were available on
    // Amazon and not just from other retailers.
    return count + (cur.price ? cur.need : 0);
  }, 0);

  // the total price of all the items, taking the quantity into account
  items.total_price = items.reduce(function (total, cur) {
    return total + cur.total_price;
  }, 0);

  return items;
};

// grabs all items, parses them, and returns the result
var getParsedItems = function () { return parseItems(getItemElements()); };

// check for new items continuously. this is the simplest way to be correct :(
var lastTotal = null;
setInterval(function () {
  var items = getParsedItems();

  // if the total has changed, update the DOM
  if (items.total_price !== lastTotal) {
    lastTotal = items.total_price;
    $total.replaceWith(tmplPriceElement({
      total_count: items.total_count,
      total_price: items.total_price
    }));
  }
}, POLL_INTERVAL);
