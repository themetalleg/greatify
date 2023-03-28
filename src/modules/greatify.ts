import { config } from "../../package.json";
import { getString } from "./locale";
import { Icons } from './icons';

function greatify(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      Zotero.log(`Calling function ${target.name}.${String(propertyKey)}`, "warning");
      return original.apply(this, args);
    } catch (e) {
      Zotero.log(`Error in function ${target.name}.${String(propertyKey)}: ${e}`, "warning");
      throw e;
    }
  };
  
  return descriptor;
}

// Class to register the "create costum report" menu item
export class MenuGreatifyFactory {

  // Function to add a menu item with icon
  @greatify
  static registerRightClickMenuItem() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
    
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-costumreport",
      label: "Create costum report",
      // label: getString("menuitem.label"),
      // oncommand: ReportGreatifyFactory.costumReport as any as string,
      commandListener: () => addon.hooks.onWindowEvents("report"),
      icon: menuIcon,
    });
  }
}

export class ReportGreatifyFactory {

  /**
   * Generates an HTML table for the selected items.
   * @param {Object[]} items - An array of items to display in the table.
   * @returns {string} - The generated HTML code.
   */
  @greatify // assuming this is a decorator
  static async generateItemTable(items: any[]): Promise<string> { // explicitly specify the return type as a promise of string
    // just process top level items
    const itemsTopLevel = items.filter(item => item.isTopLevelItem());
    
    const reportTitle = `Report (${itemsTopLevel.length} items)`;
    const headerHTML = `<h1>${reportTitle}</h1>`;
    let tableHTML = headerHTML;

    for (const item of itemsTopLevel) {
      if (item.isTopLevelItem()) {
        const mainTitle = item.getDisplayTitle();
        let mainHTML = `<hr><p>${mainTitle}</p>`;
        let coverHTML = await Icons.get("question-circle"); // await the promise returned by Icons.get

        let attachmentsHTML = '';
        let notesHTML = '';

        const type = item.itemType.toString();
        mainHTML += `<p>Item Type: ${type}</p>`;

        if (type === 'attachment' || type === 'note') {
          console.warn('This is an attachment/note item. Skipping it.');
        } else {
          // processing notes
          const numNotes = item.numNotes();
          notesHTML += `<p>${numNotes} notes found</p>`;
          if (numNotes === 0) {
            console.log(`No notes found for item: ${mainTitle}`);
          } else {
            console.log(`Notes found for item: ${mainTitle}`);
          }

          //processing attachments
          const numAttachments = item.numAttachments();
          attachmentsHTML += `<p>${numAttachments} attachments found</p>`;
          if (numAttachments === 0) {
            console.log(`No attachments found for item: ${mainTitle}`);
          } else {
            const attachmentIDs = item.getAttachments().toString();
            const IDs = attachmentIDs.split(',');

            for (const ID of IDs) {
              const attachment = Zotero.Items.get(ID);

              if (attachment.getDisplayTitle() === "cover.jpg") {
                const cover = await attachment.attachmentDataURI;
                coverHTML = `<img src="${cover}" alt="${mainTitle} cover image">`;
                console.log(`Cover found for item: ${mainTitle}`);
              } else {
                attachmentsHTML += `<p>${attachment.getDisplayTitle()}</p>`;
              }
            }
          }
        }

        mainHTML += coverHTML + attachmentsHTML + notesHTML;
        tableHTML += mainHTML;
      }
    }

    return tableHTML;
  }




  // Function to generate the HTML content for the report
  @greatify
  static generateReportContent(itemTable: string) {
    const htmlcss = `html { background-color: red; }`;
    const htmlhead = `<head>
      <title>report</title>
      <meta charset="UTF-8">
      <style>${htmlcss}</style>
      </head>`;
    const htmlbody = `<body>
      <button onclick="window.print()">Print</button>
      ${itemTable}
      </body>`;
    return `<html>${htmlhead}${htmlbody}</html>`;
  }

  // Function to generate the report and add it to a new tab
  @greatify
  static async generateCustomReport() {
    // Create a new tab
    const newTab = {
      id: 'hello-world',
      type: 'hello-world',
      title: 'Hello World'
    };
    Zotero_Tabs.add(newTab);

    // Get the selected items
    const items = ZoteroPane.getSelectedItems();

    for (let item of items) {
      item.numAnnotations;
    }

    // Generate the HTML table for the items
    const itemTable = await ReportGreatifyFactory.generateItemTable(items);

    // Generate the HTML content for the report
    const reportContent = ReportGreatifyFactory.generateReportContent(itemTable);

    // Create an iframe to display the report
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `data:text/html,${reportContent}`);
    iframe.setAttribute('flex', '1');

    // Add the iframe to the tab
    const deck = Zotero_Tabs.deck;
    const container = deck.lastChild;
    if (container != null) {
      container.appendChild(iframe);
    }
  }
  
}

