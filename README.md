[![Chrome Web Store Badge](https://raw.githubusercontent.com/jasontbradshaw/amazon-wish-list-total/master/screenshots/badge.png)](https://chrome.google.com/webstore/detail/amazon-wish-list-total/boekbkconiendicldakeboooeilaldmh)

amazon-wish-list-total
=====================

A Google Chrome extension that totals up the price of all items in the current
Amazon wish list, and displays it unobtrusively on the left side of the screen.

![Screenshot](https://raw.githubusercontent.com/jasontbradshaw/amazon-wish-list-total/master/screenshots/screenshot.png)

Description
----
Ever get tired of having to manually total up the items in your wish list, click
a button to figure out how much it all costs, or add all the items to the cart
to get that one magic number?

Worry no more! This extension adds an unobtrusive total price to the left side of
the screen, and updates it dynamically when items are added or deleted.

Changelog
----
#### 1.5.0
* Redesign total to float at the bottom left of the page for easier viewing

#### 1.4.1
* Add fallback selector for when one of the preferred selectors isn't found

#### 1.4.0
* Localize all text

#### 1.3.0
* Fix "Ship-to" address overlap
* Fix total mouse selection (it's now possible!)
* Use average price (instead of lowest price) when items have a price range
* Handle "Unavailable" items
* Improve currency parsing/detection
* Handle wish lists that aren't on `/wishlist/` URLs
* Re-render total element only when the wish list changes, not constantly
* Make the extension _much_ smaller in size (17K v.s. 250K)
* Re-write extension in ES6

#### 1.2.1
* Update total element selector, warn when it's not found

#### 1.2.0
* Use the "Used & New" price for unavailable items

#### 1.1.1
* Attempt to detect and use the regional currency symbol
* Make wish list id and item detection more robust

#### 1.1.0
* Parses all pages of wish list items to show a complete total, not just a total
  for the current page!
* Enabled for use on amazon.co.uk, as well as all other regional variants
