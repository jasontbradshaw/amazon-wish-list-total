import Html exposing (Html, div, span, text)
import Html.Attributes exposing (class, id)
import StartApp.Simple as StartApp

-- A single item in a wish list, parsed from the DOM.
type alias WishListItem =
  { id : String
  , name : String

  , haveCount : Int
  , needCount : Int
  , wantCount : Int

  , price : Float
  , totalPrice : Float
  }

type alias Model =
  { items : List WishListItem
  , updating : Bool
  }


type Action = UpdateItems


update : Action -> Model -> Model
update action model =
  case action of
    UpdateItems -> model


view : Signal.Address Action -> Model -> Html
view address model =
  div [ id "wishlist-total" ]
    [ span [ class "total-text" ] [ text "Subtotal (0 items): " ]
    , span [ class "total-price a-color-price" ] [ text "$0.00" ]
    ]


main = StartApp.start
  { model = { updating = False, total = 0.0 }
  , update = update
  , view = view
  }
