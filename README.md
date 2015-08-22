amazon-wish-list-total
=====================

A Google Chrome extension that totals up the price of all items in the current
Amazon wish list, and displays it unobtrusively below the wish list title.

![Screenshot](https://raw.githubusercontent.com/jasontbradshaw/amazon-wish-list-total/master/screenshots/screenshot-1.png)

Description
----
Ever get tired of having to manually total up the items in your wish list, click
a button to figure out how much it all costs, or add all the items to the cart
to get that one magic number?

Worry no more! This extension adds an unobtrusive total price below the wish
list title, and updates it dynamically when items are added or deleted.

It supports both the "normal" and "compact" views for wish lists, multiple
currencies, and uses the "Used & New" price for items that aren't currently
available!

Changelog
----
#### 1.3.0
* Fix "Ship-to" address overlap
* Improve currency parsing/detection
* Use average price (instead of lowest price) when items have a price range
* Handle "Unavailable" items
* Handle wish lists that aren't on `/wishlist/` URLs

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
