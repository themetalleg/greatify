import { config } from "../../package.json";

/**
 * A utility class for getting icons.
 */
export class Icons {
  /**
   * Gets the content of the specified icon.
   * @param {string} name - The name of the icon.
   * @returns {Promise<string>} - A promise that resolves to the content of the icon.
   */
  static async get(name: string): Promise<string> {
    const url = `chrome://${config.addonRef}/content/icons/bootstrap/${name}.svg`;
    const content = Zotero.File.getContentsFromURL(url); // await the promise returned by Zotero.File.getContentsFromURL
    return content;
  }
}
