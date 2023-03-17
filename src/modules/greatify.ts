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

export class MenuGreatifyFactory {

  @greatify
    static registerRightClickMenuItem() {
      const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
      // item menuitem with icon
      ztoolkit.Menu.register("item", {
        tag: "menuitem",
        id: "zotero-itemmenu-costumreport",
        label: "create costum report",
        // label: getString("menuitem.label"),
        // oncommand: ReportGreatifyFactory.costumReport as any as string,
        commandListener: (ev) => addon.hooks.onWindowEvents("report"),
        icon: menuIcon,
      });
    }

}

export class ReportGreatifyFactory {

  @greatify
  static costumReport() {
    const newTab = {
      id: 'hello-world',
      type: 'hello-world',
      title: 'Hello World'
    };
    Zotero_Tabs.add(newTab);
  
    const deck = Zotero_Tabs.deck;
    const container = deck.lastChild;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'data:text/html,<html><body>Hello World</body></html>');
    iframe.setAttribute('flex', '1');
    container.appendChild(iframe);
    
    Zotero.Promise.delay(2000).then(() => {
      const win = iframe.contentWindow;
      win.print();

    });
    
  }
  
}

