import { config } from '../../package.json';
import { getString } from './locale';
import { Icons } from './icons';

function greatify(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      Zotero.log(`Calling function ${target.name}.${String(propertyKey)}`, 'warning');
      return original.apply(this, args);
    } catch (e) {
      Zotero.log(`Error in function ${target.name}.${String(propertyKey)}: ${e}`, 'warning');
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
    
    ztoolkit.Menu.register('item', {
      tag: 'menuitem',
      id: 'zotero-itemmenu-costumreport',
      label: 'Create costum report',
      // label: getString("menuitem.label"),
      // oncommand: ReportGreatifyFactory.costumReport as any as string,
      commandListener: () => addon.hooks.onWindowEvents('report'),
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

    let tableHTML = '<table class="table">';

    for (const item of itemsTopLevel) {

      const itemHTML        = this.createItemHTML(item);
      const notesHTML       = this.notesList(item);
      const attachmentsHTML = this.attachmentsList(item);
      const coverHTML       = await this.getCover(item);

      tableHTML += '<tr>';
      tableHTML += this.tagHTML('td', coverHTML);
      tableHTML += this.tagHTML('td', itemHTML + attachmentsHTML + notesHTML);
      tableHTML += '</tr>';
    }

    tableHTML += '<table>';
    return headerHTML + tableHTML;
  }

  @greatify
  static tagHTML(tag: string, content: string) {
    return `<${tag}>${content}</${tag}>`;
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
    itemHTML = `<h2>${itemTitle}</h2>`;
    return itemHTML;
  }

  @greatify
  static notesList(item: Zotero.Item) {

    // set standard return
    Zotero.log('no notes found', 'warning');
    let notesHTML = '';

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
    notesHTML = '';
    notesHTML += '<div class="alert alert-light" role="alert">';
    notesHTML += `<h3>Notes</h3>`;
    notesHTML += '</div>';

    // processing attachments
    const notes = item.getNotes();

    for (const ID of notes) {
      const note = Zotero.Items.get(ID);
      notesHTML += '<div class="alert alert-warning" role="alert">';
      notesHTML += `${note.getNote()}`;
      notesHTML += '</div>';
      //notesHTML += `<li>${note.getDisplayTitle()}</li>`;
    }

    return notesHTML;
  }

  @greatify
  static attachmentsList(item: Zotero.Item) {

    // set standard return
    Zotero.log('no attachments found', 'warning');
    let attachmentsHTML = '';

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
    attachmentsHTML = '';
    attachmentsHTML += '<div class="alert alert-light" role="alert">';
    attachmentsHTML += `<h3>Attachments</h3>`;
    attachmentsHTML += '</div>';

    // processing attachments
    const attachments = item.getAttachments();

    attachmentsHTML += '<div class="alert alert-primary" role="alert">';
    for (const ID of attachments) {
      const attachment = Zotero.Items.get(ID);
      attachmentsHTML += `<li>${attachment.getDisplayTitle()}</li>`;
    }
    attachmentsHTML += '</div>';
    
    return attachmentsHTML;
  }

  @greatify
  static async getCover(item: Zotero.Item) {
    // set standard return
    let coverHTML = '<div class="d-block bg-dark img-thumbnail m-4" style="width: 200px; height: 200px;"></div>';

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
      return attachment.getDisplayTitle() === 'cover.jpg';
    });
    
    // if it was found, return the cover instead of standard return
    if (coverID) {
      const attachment = Zotero.Items.get(coverID);
      const cover = await attachment.attachmentDataURI;
      return `<img src="${cover}" alt="cover image" class="img-thumbnail m-4" width="200">`;
    }
    
    //if nothing was found, standard return
    return coverHTML;
  }

  @greatify
  static isAttachmentOrNote(item: Zotero.Item) {
    const type = item.itemType.toString();
    if (type === 'attachment' || type === 'note') {
      Zotero.log('This is an attachment/note item. Skipping it.', 'warning');
      return true;
    } else {
      return false;
    }
  }

  // Function to generate the HTML content for the report
  @greatify
  static generateReportContent(itemTable: string) {
    const htmlcss = `
    html { background-color: white; }
    td { vertical-align: top; }
    
    `;
    const htmlhead = `<head>
      <title>report</title>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
      <style>${htmlcss}</style>
      </head>`;
    const htmlbody = `<body>
      <button type="button" class="btn btn-primary d-print-none" onclick="window.print()">Print</button>
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