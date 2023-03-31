import { config } from '../../package.json';
import { getString } from './locale';

const sectionNames = ["head", "body", "css"] as const;
type HTMLSection = typeof sectionNames[number];

export class Website {

  private sections: Record<HTMLSection, string[]>;

  public title: string = 'hello world';

  public bootstrap: boolean = false;
    
  private boostrapCSS: string[] = [
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">',
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">',
  ];

  public tailwind: boolean = false;

  constructor() {
    this.sections = sectionNames.reduce(
      (acc, name) => ({ ...acc, [name]: [] }),
      {} as Record<HTMLSection, string[]>
    );
  }
    
  addTo(section: HTMLSection, element: string | string[]): void {
    if (section in this.sections) {
      if (typeof element === "string") {
        this.sections[section].push(element);
      } else if (Array.isArray(element)) {
        this.sections[section].push(...element);
      } else {
        throw new Error(`Invalid element type: ${typeof element}`);
      }
    } else {
      throw new Error(`Unknown section: ${section}`);
    }
  }

  build(): string {

    if (this.bootstrap) {
        this.addTo('head', this.boostrapCSS);
    }

    return `<html><head>
    <title>${this.title}</title>
    <meta charset="UTF-8">
    ${this.sections.head.join("")}
    <style>${this.sections.css.join("")}</style>
    </head>
    <body>
    ${this.sections.body.join("")}
    </body>
    <html>`;
  }
  
  addPrintButton() {
    this.addTo('body', '<button type="button" onclick="window.print();" id="print">Print</button>');
  }

}