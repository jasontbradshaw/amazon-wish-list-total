(function () {
  'use strict';

  // Create a new element for our app and add it to `body`.
  const el = document.createElement('div');
  el.id = 'amazon-wish-list-total';
  document.body.appendChild(el);

  // Launch our app into our element.
  Elm.embed(Elm.Main, el);
}());
