# Esperanto reading assistant (Legado-helpanto)

You may visit a [live demo](https://www.attac.us/esperanto-reader/demo/) of esperanto-reader.

## Usage

### Installation

Include the CSS:

```html
<link rel="stylesheet" href="esperanto-reader.css">
```

Either automatically load the dictionary from a JSON file:

```html
<script src="esperanto-reader.js" data-vortaro="dictionary.json"></script>
```
 
Or generate the dictionary object in JavaScript:

```js
const esperantoReader = require("esperanto-reader");
const dictionary = { entries: { ... } };

document.addEventListener("DOMContentLoaded", () => {
    esperantoReader(dictionary);
});
```

### Composing a bilingual document

### Composing a dictionary file

### License

Copyright © 2018 Jackson Willis.

Esperanto-reader is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with this program. If not, see http://www.gnu.org/licenses/.