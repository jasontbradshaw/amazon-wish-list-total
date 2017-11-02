[![Chrome Web Store Badge](https://raw.githubusercontent.com/jasontbradshaw/amazon-wish-list-total/master/images/badge-chrome.png)](https://chrome.google.com/webstore/detail/amazon-wish-list-total/boekbkconiendicldakeboooeilaldmh)
[![Firefox Add-on Badge](https://raw.githubusercontent.com/jasontbradshaw/amazon-wish-list-total/master/images/badge-firefox.png)](https://addons.mozilla.org/en-US/firefox/addon/amazon_wish_list_total/)

Amazon Wish List Total
======================

An extension that keeps a running total of all the items its seen in the current
Amazon wish list, and displays it unobtrusively on the left side of the screen.

![Screenshot](https://raw.githubusercontent.com/jasontbradshaw/amazon-wish-list-total/master/images/screenshot.png)

Description
----
This extension aims to make your life a bit easier by tracking all the items
it's seen within any of your Amazon wish lists, then displaying an unobtrusive
running total price at the bottom left of your screen.

To see the total for your _entire_ list, you'll need to scroll to the very
bottom of it so all the items will load!

Change Log
----
#### 1.9.0
* Reduce resource usage.

#### 1.8.0
* Support smaller screens by changing the style to conserve space when a smaller
  screen is detected.
* Support Firefox for Android!
* Show a loading spinner until all items in the current list have been parsed
  and added to the total.

#### 1.7.3
* Add support for new infinite-scrolling wish lists (needs new URL permissions
  to work on the new list URLs at `/hz/wishlist`).

#### 1.7.2
* Fix the perpetual "Calulating total..." bug (thanks to @Shakathesaint and J.
  Hobbs for helping me track this down!)

#### 1.7.1
* Prevent the total from obscuring the rest of the page during printing (thanks,
  @supertinyrobot!)

#### 1.7.0
* Amazon disabled the method we were using to determine the full wish list total
  automatically, so now you can only initially see the total for the page you're
  looking at.

  The work around is to manually page through the entire list. The extension
  will still correctly determine the total when you do this, but we can't do it
  automatically anymore :(

  I'm as sad about this as you are, believe me! I tried to find a way around
  this, but either there isn't one or I just couldn't find it. Sorry!

#### 1.6.2
* Ensure empty lists show a zero total, not a perpetual loading message

#### 1.6.1
* Add some smaller pre-built extension icons

#### 1.6.0
* Don't accidentally reveal when items have been bought for you

#### 1.5.2
* Redesign extension icon

#### 1.5.1
* Use correct currency code for amazon.in (thanks [@ashishsinghxyz](https://github.com/ashishsinghxyz)!)

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
