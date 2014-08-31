var $ = window.$;
var accounting = window.accounting;

var ITEMS_SELECTOR_FULL = '.g-items-section > [data-itemid]';
var ITEMS_SELECTOR_COMPACT = '.g-compact-items tr + tr'; // skip the header
var PRICE_PARENT_SELECTOR = '.top-nav-container .profile.a-declarative.top .profile-layout-aid-top';

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
    total_price: need * price,
  };
};

// given a jQuery object of items, parses them into an array of parsed items.
// also includes totals for count and price and stores them on the array object.
var parseItems = function ($items) {
  // turn the items jQuery object into an array of parsed items
  var items = [];
  $items.each(function () { return items.push(parseItem($(this))); });

  // the total number of needed items, taking quantity into account
  items.total_count = items.reduce(function (count, cur) {
    return count + cur.need;
  }, 0);

  // the total price of all the items, taking the quantity into account
  items.total_price = items.reduce(function (total, cur) {
    return total + cur.total_price;
  }, 0);

  return items;
};

// grabs all items, parses them, and returns the result
var getParsedItems = function () { return parseItems(getItemElements()); };

// wait for the wishlist items to appear, then call the callback with the parsed
// list of their attributes.
var onItems = function (callback) {
  var delay = 100;
  var backoff = 1.1;

  // the number of polls we need the count to be identical for and larger than
  // zero before we assume we've got all the items we're going to get.
  var initialSameCount = 3;
  var sameCount = initialSameCount;
  var lastCount = 0;

  var wait = function () {
    var items = getParsedItems();

    if (items.length > 0) {
      if (sameCount <= 0) {
        // call the callback with the parsed array
        return callback.call(null, items);
      } else if (items.length !== lastCount) {
        // we got a different number of items, reset the 'same' count and keep
        // waiting for it to settle down.
        sameCount = initialSameCount;
        lastCount = items.length;
      } else {
        // we got the same number of items, decrement the 'same' count
        sameCount--;
      }
    }

    // try again
    setTimeout(wait, delay);
    delay = Math.round(delay * backoff);
  };

  // start waiting!
  wait();
};

// builds and returns the HTML for the total price element
var tmplPriceElement = function (attrs) {
  return (
    '<div id="wishlist-total">' +
      '<span class="total-text">Subtotal (' + attrs.total_count + ' item' + (attrs.total_count === 1 ? '' : 's') + ')</span>: ' +
      '<span class="total-price a-color-price">' + accounting.formatMoney(attrs.total_price) + '</span>' +
    '</div>'
  );
};

// run it!
onItems(function (items) {
  // add the total to the DOM
  $(PRICE_PARENT_SELECTOR).append(tmplPriceElement({
    total_count: items.total_count,
    total_price: items.total_price,
  }));
});
