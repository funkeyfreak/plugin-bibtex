import joplin from "api";
import { Reference } from "../../model/reference.model";
import { getDate } from "../../util/get-date.util";
import { encode, decode } from "html-entities";
import { CITATION_POPUP_ID } from "../../constants";
const fs = joplin.require("fs-extra");

let popupHandle: string = "";

/**
 * Show a dialog for the user to choose from a list of references
 * to be inserted in the note content
 * @returns ID of the selected reference
 */
export async function showCitationPopup (refs: Reference[]): Promise<string[]> {

    // If the dialog was not initialized, create it and get its handle
    if (popupHandle === "") {
        popupHandle = await joplin.views.dialogs.create(CITATION_POPUP_ID);
    }

    const installationDir = await joplin.plugins.installationDir();
    let html: string = await fs.readFile(
        installationDir + "/ui/citation-popup/view.html",
        'utf8'
    );

    html = html.replace("<!-- content -->", fromRefsToHTML(refs));

    await joplin.views.dialogs.setHtml(popupHandle, html);
    await joplin.views.dialogs.addScript(popupHandle, "./ui/citation-popup/autoComplete.min.css");
    await joplin.views.dialogs.addScript(popupHandle, "./ui/citation-popup/view.css");
    await joplin.views.dialogs.addScript(popupHandle, "./ui/citation-popup/autoComplete.min.js");
    await joplin.views.dialogs.addScript(popupHandle, "./ui/citation-popup/view.js");

    const result = await joplin.views.dialogs.open(popupHandle);
    
    if (result.id === "cancel") return [];

    let selectedRefsIDs: string[] = JSON.parse(result.formData["main"]["output"]);
    selectedRefsIDs = selectedRefsIDs.map(refId => decode(refId));

    /* Return an array of selected references' IDS */
    return selectedRefsIDs;
}

function fromRefsToHTML (refs: Reference[]): string {
    const ans: string = (
        '<div id="json" style="display:none;">' +
            encode(
                JSON.stringify(
                    refs.map(ref => {
                        return {
                            id: ref.id,
                            title: ref.title,
                            author: ref.author,
                            year: (ref.issued && ref.issued["date-parts"]) ? getDate(ref).getFullYear() : null
                        };
                    })
                )
            ) +
        '</div>'
    );
    return ans;
}
