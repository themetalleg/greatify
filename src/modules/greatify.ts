import { config } from "../../package.json";
import { getString } from "./locale";

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

  // Function to generate the HTML table for the selected items
  @greatify
  static async generateItemTable(items: any[]) {
    let itemTable = `<h1>Report (${items.length} items)</h1>`;
    itemTable += "<table>";
    
    for (const item of items) {
      if (item.getDisplayTitle() == "cover.jpg") {
        const dataURI = await item.attachmentDataURI;
        itemTable += `<tr><td><img src="${dataURI}"></td></tr>`;
      } else {
        itemTable += `
          <tr>
          <td>- ${item.getDisplayTitle()}</td>
          <td>${ztoolkit.ExtraField.getExtraField(item, "itemBoxFieldEditable")}</td>
          <td>${item.isTopLevelItem()}</td>
          <td>${item.itemType}</td>`;
      }
    }
    
    itemTable += `</table>`;
    return itemTable;
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

