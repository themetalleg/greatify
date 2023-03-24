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
  @greatify
  static async generateItemTable(items: string | any[]) {
    const headerHTML = `<h1>Report (${items.length} items)</h1>`;
    let tableHTML = headerHTML;

    for (const item of items) {
      Zotero.log(`YYY${item.isTopLevelItem()}YYY`, "warning");
      Zotero.log(`UUU${item.ID}UUU`, "warning");
      
      if (item.isTopLevelItem()) {
        let mainHTML = `<hr><p>${item.getDisplayTitle()}</p>`;
        let coverHTML = Icons.questionCircle();

        let attachmentsHTML = '';
        let notesHTML = '';
        
        const type = item.itemType.toString();
        mainHTML += `<p>XXX -${type}-</p>`;
        Zotero.log(`itemtype: ${type}`);
        
        if (type == 'attachment' || type == 'note') {
          Zotero.log('this is an attachment / note', 'warning');
        } else {
          // processing notes
          notesHTML += `<p>${item.numNotes()} notes found</p>`;
          if (item.numNotes().toString() == "0") {
            Zotero.log('there are no notes', 'warning');
          } else {
            Zotero.log('here are notes to process', 'warning');
          }

          //processing attachments
          attachmentsHTML += `<p>${item.numAttachments()} attachments found</p>`;
          if (item.numAttachments().toString() == "0") {
            Zotero.log('there are no attachments', 'warning');
          } else {
            const attachmentIDs = item.getAttachments().toString();
            const IDs = attachmentIDs.split(',');
            
            for (const ID of IDs) {
              const attachment = Zotero.Items.get(ID);

              if (attachment.getDisplayTitle() === "cover.jpg") {
                const cover = await attachment.attachmentDataURI;
                coverHTML = `<img src="${cover}">`;
                Zotero.log(`cover: ${cover}`, 'warning');
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

