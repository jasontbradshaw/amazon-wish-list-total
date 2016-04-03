module WishList where

import Char
import Http
import List.Extra
import Maybe.Extra
import Regex exposing (Regex, regex)
import String
import Task exposing (Task, andThen, succeed)

-- Native, so imported last to avoid possible errors!
import DOM exposing (Node)


-- A single item in a wish list.
type alias Item =
  { id : String -- The unique id for this item.
  , name : String -- The name of this item.

  -- Whether the item has been semi-removed from the list and should be excluded
  -- from totals. This happens when a user clicks the "Delete" button, but the
  -- item is still showing it's "Please keep me!" banner.
  , hasBeenRemoved : Bool

  , haveCount : Int -- The number of units of this item we already have.
  , wantCount : Int -- The total number of units of this item we want.
  , needCount : Int -- The number of units of this item needed to achieve `want`.

  -- The price for a single unit of this item.
  , unitPrice : Float

  -- The combined price for the number of needed units of this item.
  , totalPrice : Float
  }


-- A single page of a wish list.
type alias Page =
  { hasNext : Bool -- Whether there's another page after this one.
  , index : Int -- The 1-based index of the page relative to the entire list.
  , items : List Item -- All the items found on this page.
  }


-- A simple record type for building an element that doesn't have to be
-- exported, but can act as documentation when building an item from scratch.
-- This contains only the essential attributes need for building an item; the
-- rest of the required `Item` properties are calculated from these.
type alias ItemConstructor =
  -- See `Item` above for descriptions of these.
  { id : String
  , name : String
  , hasBeenRemoved : Bool
  , haveCount : Int
  , wantCount : Int
  , unitPrice : Float
  }


-- Given some standard attributes, creates an Item record.
makeItem : ItemConstructor -> Item
makeItem props =
  let
    needCount = props.wantCount - props.haveCount
  in
    { id = props.id
    , name = props.name

    , hasBeenRemoved = props.hasBeenRemoved

    , haveCount = props.haveCount
    , wantCount = props.wantCount
    , needCount = needCount

    , unitPrice = props.unitPrice
    , totalPrice = props.unitPrice * (toFloat needCount)
    }


-- Given a URL, returns a task that either fails with an error or succeeds with
-- a parsed HTML document node.
downloadHtmlNode : String -> Task Http.Error Node
downloadHtmlNode url =
  Http.getString url
    `andThen` \html -> succeed (DOM.parseHtml html)


-- Determines whether the given list has another page after it.
hasNextPage : Node -> Bool
hasNextPage doc =
  DOM.selectIn doc "#wishListPagination .a-last:not(.a-disabled) a"
    |> Maybe.Extra.isJust


-- Given an item node, returns the trimmed price text for it, or the empty
-- string if no price text could be found.
getItemPriceText : Node -> String
getItemPriceText itemNode =
  let
    -- Returns the trimmed text of the node found by the given selector. If no
    -- node is found, returns the empty string.
    getTrimmedNodeText =
      \selector -> DOM.selectIn itemNode selector
        |> DOM.withDefaultNode
        |> DOM.text
        |> String.trim

    -- We attempt to use this node first if it's available and non-empty.
    priceText = getTrimmedNodeText "[id^=\"itemPrice_\"]"
  in
    if String.isEmpty priceText then
      -- Fall back to this text if the first one didn't give us a price. If this
      -- doesn't give us a price either, we return the empty string.
      getTrimmedNodeText ".itemUsedAndNewPrice"
    else
      priceText


parseCurrency : String -> Maybe Float
parseCurrency s =
  let
    -- Pare our string down to only numbers, periods, and commas. This has the
    -- effect of throwing out all whitespace and currency symbols, leaving us
    -- with a number.
    s = Regex.replace Regex.All (regex "[^0-9.,]+") (\_ -> "") s

    -- Turn the string into a list of its parts, which may be delimited by
    -- decimals and/or commas, to support both European and American
    -- conventions.
    sParts = Regex.split Regex.All (regex "[,.]") s

    -- The fractional part is always the final part of the string. If we had an
    -- empty currency string for some reason, we default it to 0 here.
    fractionPart = List.Extra.last sParts |> Maybe.withDefault "0"

    -- The whole part is everything excluding the fractional part.
    wholePart = List.take ((List.length sParts) - 1) sParts
      |> String.join ""

    -- Combine the parts into something parseable by `String.toFloat`.
    cleanS = wholePart ++ "." ++ fractionPart
  in
    String.toFloat cleanS
      |> Result.toMaybe


parsePrice : String -> Float
parsePrice s =
  let
    -- Items with a price range have two currency strings separated by hyphens
    -- surrounded by whitespace.
    priceStrings = Regex.split Regex.All (regex "\\s+-\\s+") (String.trim s)

    -- Parse all the prices we got (zero or more) and keep those that parsed.
    prices = List.filterMap parseCurrency priceStrings
  in
    -- If we got a price range, return the average of the two prices.
    (List.sum prices) / (List.length prices |> toFloat)


parseItem : Node -> Item
parseItem itemNode =
  let
    name = DOM.selectIn itemNode "[id^=\"itemName_\"]"
      |> DOM.withDefaultNode
      |> DOM.text
      |> String.trim

    id = DOM.attribute itemNode "data-itemid"
      |> Maybe.withDefault ""
      |> String.trim

    hasBeenRemoved = DOM.closest itemNode ".g-item-sortable-removed"
      |> Maybe.Extra.isJust

    haveCount = DOM.selectIn itemNode "[id^=\"itemPurchased_\"]"
      |> DOM.withDefaultNode
      |> DOM.text
      |> String.filter Char.isDigit
      |> String.toInt
      |> Result.withDefault 0

    wantCount = DOM.selectIn itemNode "[id^=\"itemRequested_\"]"
      |> DOM.withDefaultNode
      |> DOM.text
      |> String.filter Char.isDigit
      |> String.toInt
      |> Result.withDefault 1

    unitPrice = parsePrice (getItemPriceText itemNode)
  in
    makeItem { id = id
             , name = name
             , hasBeenRemoved = hasBeenRemoved
             , haveCount = haveCount
             , wantCount = wantCount
             , unitPrice = unitPrice
             }


parseItems : Node -> List Item
parseItems pageDoc =
  let
    itemsSelector = ".g-items-section .g-item-sortable[data-itemid]"
    itemElements = DOM.selectAllIn pageDoc itemsSelector
  in
    List.map parseItem itemElements


parsePage : Node -> Int -> Page
parsePage pageDoc index =
  { hasNext = hasNextPage pageDoc
  , index = index
  , items = parseItems pageDoc
  }


-- Given a wish list id and a page number, returns a Page representing it.
getPage : String -> Int -> Task Http.Error Page
getPage id index =
  let
    url = Http.url ("/gp/registry/wishlist/" ++ id) [ ("page", toString index) ]
  in
    downloadHtmlNode url `andThen` \pageDoc -> succeed (parsePage pageDoc index)
