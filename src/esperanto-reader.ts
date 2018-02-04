/* This file is part of Esperanto-reader.
 *
 * Esperanto-reader is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Esperanto-reader is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Esperanto-reader.  If not, see <http://www.gnu.org/licenses/>.
*/

;(function() {

    "use strict";

    // the `dictionary` object is described by schema.json

    function getEntry(dictionary, phrase) {
        return dictionary["entries"][phrase] || null;
    }

    function getDefinitionPairs(dictionary, phrase) {
        const entry = getEntry(dictionary, phrase);

        if (!entry) {
            return [];
        }

        const components = entry["refs"] || [];
        const terms = [phrase].concat(components);

        return terms.map(function (term) {
            return [term, dictionary["entries"][term]];
        });
    }

    function getWiktionaryLink(phrase) {
        return "https://wiktionary.org/wiki/" + encodeURIComponent(phrase) + "#Esperanto";
    }

    function getPhrase(node) {
        return ((node as HTMLElement).dataset.eo || node.innerText).toLowerCase();
    }

    function buildDefinitionList(pairs) {
        let list = document.createElement("dl");

        pairs.forEach(function (pair) {
            const phrase = pair[0];
            const entry = pair[1];

            const definition = entry["en"];

            let term = document.createElement("dt");

            if (entry["noLink"]) {
                term.innerText = phrase;
            }
            else {
                let link = document.createElement("a");
                link.href = getWiktionaryLink(phrase);
                link.target = "_blank";
                link.innerText = phrase;

                term.appendChild(link);
            }

            term.setAttribute("lang", "eo");

            let details = document.createElement("dd");
            details.innerText = definition;

            list.appendChild(term);
            list.appendChild(details);
        });

        return list;
    }

    function select(node) {
        if (node) {
            node.classList.add(selectedNodeClass);
        }
    }

    function deselect(node) {
        if (node) {
            node.classList.remove(selectedNodeClass);
        }
    }

    const selectedNodeClass = "eo-selected";
    const tooltipClass = "eo-tooltip";
    const noEntryClass = "no-entry";

    function createTooltip() {
        let tooltip = document.createElement("div");
        tooltip.classList.add("eo-tooltip");
        tooltip.setAttribute("role", "tooltip");
        tooltip.setAttribute("aria-hidden", "true");

        let closeButton = document.createElement("button");
        closeButton.classList.add("eo-close");
        closeButton.innerText = "X";
        closeButton.setAttribute("aria-label", "Close");
        closeButton.disabled = true;

        let tooltipBody = document.createElement("div");

        tooltip.appendChild(closeButton);
        tooltip.appendChild(tooltipBody);
        document.body.appendChild(tooltip);

        return { tooltip, tooltipBody, closeButton };
    }

    function esperantoReader(dictionary) {
        let lastNode = null;
        let tooltipShouldPersist = false;

        let { tooltip, tooltipBody, closeButton } = createTooltip();

        function loadTooltip(node) {
            tooltipBody.innerHTML = "";

            const phrase = getPhrase(node);
            const pairs = getDefinitionPairs(dictionary, phrase);

            if (pairs.length === 0) {
                tooltipBody.innerHTML = "<p>No dictionary entry for <strong>" + phrase + "</strong>.</p>";
            }
            else {
                tooltipBody.appendChild(buildDefinitionList(pairs));
            }

            tooltip.style.top = (node.offsetTop + node.offsetHeight) + "px";
            tooltip.style.left = (node.offsetLeft + (node.offsetWidth / 2)) + "px";

            tooltip.setAttribute("aria-hidden", "false");

            // keep the tooltip within the horizontal bounds of the node's parent element

            const parentRightBound = node.parentElement.getBoundingClientRect().right;
            const tooltipRightBound = tooltip.getBoundingClientRect().right;

            if (tooltipRightBound > parentRightBound) {
                tooltip.style.left = (parentRightBound - tooltip.offsetWidth) + "px";
            }

            let lastNode = document.querySelector("[data-eo][aria-describedby]");
            if (lastNode) {
                lastNode.removeAttribute("aria-describedby");
            }

            const randomId = "eo-tooltip-" + Math.random().toString(36).slice(2);

            tooltip.id = randomId;
            node.setAttribute("aria-describedby", randomId);
        }

        function setPersistence(persistence) {
            tooltipShouldPersist = persistence;
            closeButton.disabled = !persistence;
        }

        function closeTooltip() {
            tooltip.setAttribute("aria-hidden", "true");
            setPersistence(false);
        }

        // All the nodes in the document which can open the tooltip
        let eoNodes = document.querySelectorAll("[data-eo]");

        [].slice.call(eoNodes).forEach((node) => {

            // Call attention to words with no dictionary entries (for dictionary authors).
            const phrase = getPhrase(node);
            if (!getEntry(dictionary, phrase)) {
                node.classList.add(noEntryClass);
            }

            // Add a tabindex you can tab through them
            node.setAttribute("tabindex", "0");

            node.addEventListener("click", (event) => {
                event.stopPropagation();
            });

            function onfocus() {
                loadTooltip(node);
                lastNode = node;
                setPersistence(true);
            }

            node.addEventListener("focus", onfocus);
            node.addEventListener("touchstart", onfocus);

            let focusTimeout = null;

            node.addEventListener("mouseenter", () => {
                clearTimeout(focusTimeout);

                focusTimeout = setTimeout(function() {
                    if (!tooltipShouldPersist) {
                        loadTooltip(node);
                    }
                }, 500);
            });

            node.addEventListener("mouseleave", () => {
                clearTimeout(focusTimeout);

                if (!tooltipShouldPersist) {
                    closeTooltip();
                }
            });
        });

        closeButton.addEventListener("click", closeTooltip);

        // Clicks on parts of the page which are not `data-eo` nodes should also dismiss the tooltip...
        const html = document.body.parentElement;
        html.addEventListener("click", closeTooltip);

        // ...but clicking *inside* the tooltip should be safe.
        tooltip.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        document.addEventListener("keypress", (event) => {
            if (event.key === "Escape") {
                closeTooltip();
            }
        });
    }

    window["esperantoReader"] = esperantoReader;

    // autoload stuff

    document.addEventListener("DOMContentLoaded", function() {
        var pointerElement = <HTMLElement>document.querySelector("script[data-vortaro]");

        var dictionaryUrl = pointerElement && pointerElement.dataset["vortaro"];
        if (dictionaryUrl) {
            startFromJsonUrl(dictionaryUrl);
        }
    });

    function startFromJsonUrl(url) {
        var request = new XMLHttpRequest();

        request.onload = function() {
            if (request.status === 200) {
                const dictionary = JSON.parse(request.responseText);
                esperantoReader(dictionary);
            }
            else {
                fail("HTTP status " + request.status);
            }
        };

        request.onerror = request.onabort = fail;

        request.open("GET", url);
        request.send();

        function fail(message) {
            console.error("Could not load dictionary file " + url + ": " + message);
        }
    }
})();