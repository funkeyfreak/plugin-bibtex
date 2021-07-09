import joplin from "api";
import { ContentScriptType } from "api/types";
import { DataStore } from "../../data/data-store";
import { fromRefToAPA } from "../../util/apa.util";
import { REFERENCE_LIST_CONTENT_SCRIPT_ID } from "../../constants";

/**
 * Render the full list of references at the end of the note viewer
 */
export async function registerBibliographyRenderer (): Promise<void> {
    
    /* Register a new content script of type "markdown-it" */
    await joplin.contentScripts.register(
        ContentScriptType.MarkdownItPlugin,
        REFERENCE_LIST_CONTENT_SCRIPT_ID,
        './ui/bibliography-renderer/render-list-content-script.js'
    );

    /**
     * 1- Lookup reference objects based on their IDs (using DataStore)
     * 2- Convert reference objects into APA format (in HTML)
     * If some reference objects are not found, ignore them
     * No need to html-escape the APA output, the library handles that
     */
    await joplin.contentScripts.onMessage(REFERENCE_LIST_CONTENT_SCRIPT_ID, (IDs: string[]) => {
        let refs: string[] = [];
        IDs = [...new Set(IDs)];
        IDs.forEach(id => {
            try {
                refs.push(`
                    <li>
                        ${fromRefToAPA(DataStore.getReferenceById(id))}
                    </li>
                `);
            } catch (e) {}
        });
        return refs;
    });
}
