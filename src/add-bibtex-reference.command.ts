import joplin from "api";
import { showCitationPopup } from './ui/citation-popup';
import { Reference } from "./model/reference.model";
import { parse } from "./util/parser.util";
import { formatReference } from "./util/format-ref.util";
import { DataStore } from "./data/data-store";
import {
    ADD_BIBTEX_REFERENCE_COMMAND,
    PLUGIN_ICON,
    SETTINGS_FILE_PATH_ID,
    SETTINGS_STRICT_MODE,
    ERROR_PARSING_FAILED
} from "./constants";
const fs = joplin.require("fs-extra");

/**
 * Register the main command of the plugin
 */
export async function registerAddBibTexReferenceCommand () {
    await joplin.commands.register({
        name: ADD_BIBTEX_REFERENCE_COMMAND,
        label: 'Add BibTeX Reference',
        iconName: PLUGIN_ICON,
        execute: async () => {

            // Get file Path and read the contents of the file
            const filePath: string = await joplin.settings.value(SETTINGS_FILE_PATH_ID);
            let fileContent: string;
            try {
                fileContent = await fs.readFile(filePath, "utf8");
            } catch (e) {
                await joplin.views.dialogs.showMessageBox(
                    `Error: Could not open file ${filePath}: ${e.message}`
                );
                return;
            }

            try {

                // Parse the raw data and store it
                const refs: Reference[] = parse(fileContent);
                DataStore.setReferences(refs);

                // Get the search mode
                const strictMode: boolean = await joplin.settings.value(SETTINGS_STRICT_MODE);

                // Show the citation popup and get the IDs of the selected references
                const selectedRefsIDs: string[] = await showCitationPopup( {refs, strictMode} );

                // If no reference was selected, exit the command
                if (selectedRefsIDs.length === 0) return;

                // Insert the selected references into the note content
                const toBeInsertedText = selectedRefsIDs
                    .map(refId => DataStore.getReferenceById(refId))
                    .map(ref => formatReference(ref))
                    .reduce((acc, curr) => acc + " " + curr);
                
                await joplin.commands.execute("insertText", toBeInsertedText);

                // Return the focus to the note editor
                await joplin.commands.execute("focusElement", "noteBody");

            } catch (e) {
                console.log(e);
                await joplin.views.dialogs.showMessageBox(
                    `${ERROR_PARSING_FAILED}\n\n${e.message}`
                );
            }

        }
    });
}
