import Html exposing (Html, div, span, text)
import Html.Attributes exposing (class, id)
import Set exposing (..)
import StartApp.Simple as StartApp
import WishList


type alias Model =
  { items : Set WishList.Item
  , totalPrice : Float
  , loading : Bool
  }


type Action = UpdateItems


update : Action -> Model -> Model
update action model =
  case action of
    UpdateItems -> model


view : Signal.Address Action -> Model -> Html
view address model =
  div [ id "wishlist-total" ]
    [ span [ class "total-text" ]
      [ text ("Subtotal (" ++ toString (size model.items) ++ " items): ") ]
    , span [ class "total-price a-color-price" ]
      [ text ("$" ++ toString model.totalPrice)]
    ]


main = StartApp.start
  { model = { loading = False, totalPrice = 0, items = Set.empty }
  , update = update
  , view = view
  }
