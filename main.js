var $ = window.$;
var accounting = window.accounting;

var ITEMS_SELECTOR = '.g-items-section > [data-itemid]';

// wait for the wishlist items to appear, then call the callback with the jQuery
// object containing them.
var withItems = function (callback) {
  // only wait if the URL contains "wishlist"
  if (/\/wishlist\//g.test(window.location)) {
    var delay = 100;
    var maxDelay = 1000;
    var backoff = 1.1;

    // the number of polls we need the count to be identical for and larger than
    // zero before we assume we've got all the items we're going to get.
    var initialSameCount = 5;
    var sameCount = initialSameCount;
    var lastCount = 0;

    var wait = function () {
      var $items = $(ITEMS_SELECTOR);

      if ($items.length > 0) {
        if (sameCount <= 0) {
          // we're done
          return callback.call(null, $items);
        } else if ($items.length !== lastCount) {
          // we got a different number of items, reset the 'same' count and keep
          // waiting for it to settle down.
          sameCount = initialSameCount;
          lastCount = $items.length;
        } else {
          // we got the same number of items, decrement the 'same' count
          sameCount--;
        }
      }

      // try again if we haven't waited too long already
      if (delay < maxDelay) {
        setTimeout(wait, delay);
        delay = Math.round(delay * backoff);
      }
    };

    // start waiting!
    wait();
  }
};


// given an item, parses it and returns data for it
var parseItem = function ($item) {
  var name = $item.find('[id^="itemName_"]').text().trim() || '';
  var price = accounting.parse($item.find('[id^="itemPrice_"]').text().trim());
  var usedPrice = accounting.parse($item.find('.itemUsedAndNewPrice').text().trim());

  // luckily, these show up even when not visible on the page!
  var want = parseInt($item.find('[id^="itemRequested_"]').text().trim(), 10) || 1;
  var have = parseInt($item.find('[id^="itemPurchased"]').text().trim(), 10) || 0;
  var need = want - have;

  return {
    name: name,

    want: want,
    have: have,
    need: need,

    price: price,
    used_price: usedPrice,

    total_price: need * price,
    total_used_price: need * usedPrice,
  };
};

withItems(function ($items) {
  var items = [];
  $items.each(function () {
    return items.push(parseItem($(this)));
  });

  var totalCount = items.reduce(function (count, cur) {
    return count + cur.need;
  }, 0);

  var totalPrice = items.reduce(function (total, cur) {
    return total + cur.total_price;
  }, 0);

  console.log('items:', items);
  console.log('totals:', totalCount, totalPrice);

  // add a price beneath the wishlist title
  var $priceParent = $('.top-nav-container .profile.a-declarative.top .profile-layout-aid-top');

  // use the styles/format of the shopping cart total
  var $total = $(
    '<span id="wishlist-total" class="a-size-medium a-text-bold">' +
      '<span>Subtotal (' + totalCount + ' item' + (totalCount === 1 ? '' : 's') + '):</span> ' +
      '<span class="a-size-medium a-color-price sc-price sc-white-space-nowrap sc-price-sign">' +
        accounting.formatMoney(totalPrice) +
      '</span>' +
    '</span>'
  );

  $total.appendTo($priceParent);
});
