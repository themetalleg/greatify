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
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class ReportGreatifyFactory {

    @greatify
    static registerRightClickMenuItem() {
      const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
      // item menuitem with icon
      ztoolkit.Menu.register("item", {
        tag: "menuitem",
        id: "zotero-itemmenu-costumreport",
        label: "create costum report",
        // label: getString("menuitem.label"),
        oncommand: ReportGreatifyFactory.costumReport.toString(),
        icon: menuIcon,
      });
    }

    @greatify
    static costumReport() {
        // Get the selected items
        var items = Zotero.getActiveZoteroPane().getSelectedItems();

        // Define the columns to include in the report
        var columns = ["Title", "Creator", "Date", "Publication Title"];

        // Generate the report
        var report = Zotero.Report.generate("item", items, columns, "html");

        // Display the report in a new window
        var reportWindow = window.open("", "report");
        if (reportWindow) {
            reportWindow.document.write(report);
        } else {
            alert("Failed to open report window. Please check your pop-up blocker settings.");
        }
    }
}

