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
    
    const headerHTML = this.createReportHeader(itemsTopLevel);

    let tableHTML = '';

    for (const item of itemsTopLevel) {

      const itemHTML        = this.createItemHTML(item);
      const notesHTML       = this.notesList(item);
      const attachmentsHTML = this.attachmentsList(item);
      const coverHTML       = await this.getCover(item);

      tableHTML += itemHTML + coverHTML + attachmentsHTML + notesHTML;
    }

    return headerHTML + tableHTML;
  }

  @greatify
  static createReportHeader(items: any[]) {
    const reportTitle = `Report (${items.length} items)`;
    const headerHTML = `<h1>${reportTitle}</h1>`;
    return headerHTML;
  }

  @greatify
  static createItemHTML(item: Zotero.Item) {
    const itemTitle = item.getDisplayTitle();
    let itemHTML = `<hr><p>${itemTitle}</p>`;
    return itemHTML;
  }

  @greatify
  static notesList(item: Zotero.Item) {

    // set standard return
    let notesHTML = 'no notes found';

    // check if attachment or note, then standard return
    if (this.isAttachmentOrNote(item)) {
      return notesHTML;
    }

    // check if more than one note, if not, standard return
    const numNotes = item.numNotes();
    if (numNotes === 0) {
      return notesHTML;
    }

    // creating notes header
    notesHTML = `<p>${numNotes} notes found</p>`;

    // processing notes
    console.log(`notes found`);
    
    return notesHTML;
  }

  @greatify
  static attachmentsList(item: Zotero.Item) {

    // set standard return
    let attachmentsHTML = 'no attachments found';

    // check if attachment or note, then standard return
    if (this.isAttachmentOrNote(item)) {
      return attachmentsHTML;
    }

    // check if more than one attachment, if not, standard return
    const numAttachments = item.numAttachments();
    if (numAttachments === 0) {
      return attachmentsHTML;
    }
    
    // creating attachment header
    attachmentsHTML = `<p>${numAttachments} attachments found</p>`;

    // processing attachments
    const attachments = item.getAttachments();

    for (const ID of attachments) {
      const attachment = Zotero.Items.get(ID);
      attachmentsHTML += `<p>${attachment.getDisplayTitle()}</p>`;
    }
    
    return attachmentsHTML;
  }

  @greatify
  static async getCover(item: Zotero.Item) {
    // set standard return
    let coverHTML = await Icons.get("question-circle");

    // check if attachment or note, then standard return
    if (this.isAttachmentOrNote(item)) {
      return coverHTML;
    }

    // check if more than one attachment, if not, standard return
    const numAttachments = item.numAttachments();
    if (numAttachments === 0) {
      return coverHTML;
    }

    // searching for cover.jpg file in attachments
    const coverID = item.getAttachments().find(ID => {
      const attachment = Zotero.Items.get(ID);
      return attachment.getDisplayTitle() === "cover.jpg";
    });
    
    // if it was found, return the cover instead of standard return
    if (coverID) {
      const attachment = Zotero.Items.get(coverID);
      const cover = await attachment.attachmentDataURI;
      return `<img src="${cover}" alt="cover image">`;
    }
    
    //if nothing was found, standard return
    return coverHTML;
  }

  @greatify
  static isAttachmentOrNote(item: Zotero.Item) {
    const type = item.itemType.toString();
    if (type === 'attachment' || type === 'note') {
      console.warn('This is an attachment/note item. Skipping it.');
      return true;
    } else {
      return false;
    }
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