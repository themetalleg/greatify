import { config } from '../../package.json';
import { getString } from './locale';

const sectionNames = ["head", "body", "css"] as const;
type HTMLSection = typeof sectionNames[number];

export class Website {

  private sections: Record<HTMLSection, string[]>;

  public title: string = 'hello world';

  constructor() {
    this.sections = {} as Record<HTMLSection, string[]>;
    sectionNames.forEach((name) => {
      this.sections[name] = [];
    });
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

    return `<html><head>
    <title>${this.title}</title>
    <meta charset="UTF-8">
    ${this.sections.head.join("")}
    <style>${this.sections.css.join("")}</style>
    </head>
    <body>
    ${this.sections.body.join("")}
    </body>
    </html>`;
  }

}