/* 
For some reason, Joplin does not load the scripts in order.
This strange behavior was causing the current script to load before he.min.js
resulting in "he is not defined" error.
The quick and dirty way to solve this bug is to make sure the current script
waits until all the other scripts get loaded by Joplin,
and then starts doing its job
*/
const intervalId = setInterval(() => {
	if (typeof he !== 'undefined') {
		clearInterval(intervalId);
		main();
	}
}, 100);

/* UI Elements */
const inputRefsView = document.getElementById("json");
const selectedRefsView = document.getElementById("selected_refs_list");
const output = document.getElementById("output");

function main () {

    /* State */
    const json = JSON.parse(inputRefsView.textContent);
    const state = {
        // parse the refs data, get the name of the first author
        refs: json.refs.map(ref => {
            return {
                id: ref["id"],
                title: ref["title"] || "",
                year: ref["year"] || -1,
                author: (ref["author"]) ? ref.author[0].given + " " + ref.author[0].family : ""
            };
        }),
        strictMode: json.strictMode,
        selectedRefs: new Set()
    };

    configAutoComplete();

    /* Event Listeners */
    selectedRefsView.addEventListener("click", event => {
        if (event.target.classList.contains("icon_remove")) {
            removeReference(event.target.parentNode.id);
        }
    });

    function configAutoComplete () {

        const autoCompleteJS = new autoComplete({
            placeHolder: "Search for references...",
            data: {
                src: state.refs,
                keys: ["title", "author", "year"],
                filter: list => {
                    return list.filter(item => !state.selectedRefs.has(item.value["id"]));
                }
            },
            resultsList: {
                noResults: true,
                maxResults: 15,
                tabSelect: true
            },
            resultItem: {
                element: renderRef,
                highlight: true
            },
            events: {
                input: {
                    focus: () => {
                        if (autoCompleteJS.input.value.length) autoCompleteJS.start();
                    }
                }
            }
        });
        console.log(state.strictMode);
        autoCompleteJS.searchEngine = (state.strictMode) ? "strict" : "loose";

        // Focus the input field
        autoCompleteJS.input.focus();

        autoCompleteJS.input.addEventListener("selection", event => {
            const feedback = event.detail;
            const selection = feedback.selection.value;
            addReference(selection["id"]);

            // Empty the contents of the text field
            // after adding the reference to the selected area
            autoCompleteJS.input.value = "";
        });

    }

    function addReference (refId = "") {
        state.selectedRefs.add(refId);
        render();
    }

    function removeReference (refId = "") {
        state.selectedRefs.delete(refId);
        render();
    }

    /* Rendering state-based UI */
    function render () {
        const selectedRefsArray = Array.from(state.selectedRefs);
        selectedRefsView.innerHTML = template(selectedRefsArray);
        output.value = JSON.stringify(selectedRefsArray);
    }

    /**
     * Returns an HTML representation of an array of refs
     * @param {Reference[]} refs
     * @returns string
     */
    function template (refs = []) {
        if (refs.length === 0) {
            return "Select some references to be added to the current note";
        }
        return (
            refs
                .map(refId => state.refs.find(r => r["id"] === refId))             // id => reference
                .map(ref => (`
                    <li id="${ he.encode(ref["id"]) }">
                        <span class="title">${ he.encode(ref["title"]) }</span>
                        <span class="icon_remove">x</span>
                    </li>
                `))                                                 // reference => <li>
                .join(" ")
        );
    }

}

function renderRef (item, data) {
    const ref = data.value;
    const author = he.encode(ref["author"]);
    const year = ref["year"];         // no need to escape the year since it's a number
    const title = he.encode(ref["title"]);

    // Modify Results Item Style
    item.style = "display: flex; justify-content: space-between;";
    // Modify Results Item Content
    item.innerHTML = `
        <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
            <strong>${title}</strong>
            <br>
            <span style="color: #27ae60">${author}</span>
            <br>
            ${year}
        </span>
    `;
}
