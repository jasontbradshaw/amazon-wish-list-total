[![Chrome Web Store Badge](https://raw.githubusercontent.com/jasontbradshaw/amazon-wish-list-total/master/images/badge.png)](https://chrome.google.com/webstore/detail/amazon-wish-list-total/boekbkconiendicldakeboooeilaldmh)

Amazon Wish List Total
======================

A Google Chrome extension that keeps a running total of all the items its seen
in the current Amazon wish list, and displays it unobtrusively on the left side
of the screen.

![Screenshot](https://raw.githubusercontent.com/jasontbradshaw/amazon-wish-list-total/master/images/screenshot.png)

Description
----
This extension aims to make your life a bit easier by tracking all the items
it's seen within any of your Amazon wish lists, then displaying an unobtrusive
running total price at the bottom left of your screen.

Once upon a time, this extension displayed the _full_ total for the entire list
you were on by by making several requests to Amazon's servers for the wish list
data, then parsing them and summing everything up. Sadly, in August 2016, Amazon
made that exceedingly difficult, if not impossible, and I had to remove the
feature.

Luckily, single-page lists are unaffected since all the data is available on the
current page! However, to see the full total for your multi-page wish list, you
now have manually page through the entire list. This is still better than
manually adding everything up yourself, but clearly isn't ideal. I know, I know:
I miss the old way too!

If you have any suggestions (or better yet, code) for how to programmatically
determine the full total for a wish list, I'd love to hear about it!

Changelog
----
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
