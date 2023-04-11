import { config } from '../../package.json';
import { Website } from './html';
import { getString } from './locale';

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

// Class to register the "create custom report" menu item
export class MenuGreatifyFactory {

  // Function to add a menu item with icon
  @greatify
  static registerRightClickMenuItem() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
    
    ztoolkit.Menu.register('item', {
      tag: 'menuitem',
      id: 'zotero-itemmenu-customreport',
      label: 'Create custom report',
      // label: getString("menuitem.label"),
      // oncommand: ReportGreatifyFactory.customReport as any as string,
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

    let tableHTML = '<table>';

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
    const reportTitle = `report (${items.length} items)`;
    const headerHTML = `<h1>${reportTitle}</h1>`;
    return headerHTML;
  }

  @greatify
  static generateCreatorsList(item: Zotero.Item) {
    const creators = item.getCreators();
  
    const creatorStrs = creators.map((creator) => {
      // make the first letter uppercase
      const creatorType = Zotero.CreatorTypes.getName(creator.creatorTypeID).replace(/^\w/, (c) => c.toUpperCase());
      return `<p>${creatorType}: ${creator.firstName} ${creator.lastName}</p>`;
    });
  
    return creatorStrs.join('');
  }

  @greatify
  static createItemHTML(item: Zotero.Item) {
    const itemTitle = item.getDisplayTitle();
    let itemHTML = `<h2>${itemTitle}</h2>`;

    itemHTML += this.generateCreatorsList(item);
    
    itemHTML += `<p>Date: ${item.getField('date')}</p>`;
    itemHTML += `<p>Publisher: ${item.getField('publisher')}</p>`;
    itemHTML += `<p>Edition: ${item.getField('edition')}</p>`;
    itemHTML += `<p>Item Type: ${item.itemType.toString()}</p>`;
    itemHTML += `<p>Series: ${item.getField('series')}</p>`;
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
    notesHTML += `<h3>notes</h3>`;

    // processing attachments
    const notes = item.getNotes();

    for (const ID of notes) {
      const note = Zotero.Items.get(ID);
      notesHTML += '<div class="note">';
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
    attachmentsHTML += `<h3>attachments</h3>`;
    
    // processing attachments
    const attachments = item.getAttachments();

    attachmentsHTML += '<div class="attachments">';
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
    let coverHTML = '<div class="noimage"></div>';

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
      return attachment.getDisplayTitle().toLowerCase().includes('cover');
    });
    
    // if it was found, return the cover instead of standard return
    if (coverID) {
      const attachment = Zotero.Items.get(coverID);
      const cover = await attachment.attachmentDataURI;
      return `<img src="${cover}" alt="cover image" class="cover" width="200">`;
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
    
    var website = new Website();
    
    website.title = "this is a test";

    website.addTo('body', '<button type="button" class="pure-button" onclick="window.print()">Print</button>');
    website.addTo('body', itemTable);
    
    website.addTo('css', `
    html {
      font-size: 12px;
    }

    h1 {
      font-size: 2.5rem;
      display: block;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: bold;
    }

    h3 {
      font-size: 1.5rem;
      color: grey;
    }

    .note {
      background-color: rgb(255, 228, 94);
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 5px;
    }

    .attachments {
      background-color: rgb(255, 193, 94);
      padding: 10px;
      border-radius: 5px;
    }

    .note div p {
      padding: 0;
      margin: 0;
      line-height: 1;
    }

    .noimage {
      background-color: rgb(161, 166, 180);
      display: block;
      height: 250px;
      width: 250px;
      border-radius: 5px;
    }

    .cover {
      float: right;
    }

    table td {
      vertical-align: top;
      padding: 10px;
    }
    `);
    Zotero.log(itemTable, "warning");
    return website.build();
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