export default class PlantUMLCodeEngine {
    static install(cherryOptions: any, args: any): void;
    /**
     * @param {object} plantUMLOptions
     * @param {string} [plantUMLOptions.baseUrl] PlantUML server base URL, e.g. `https://www.plantuml.com/plantuml`
     * @param {('svg'|'png'|'txt'|'uml')} [plantUMLOptions.type] output format path segment, defaults to `svg`
     * @param {boolean} [plantUMLOptions.useHex] force the simple HEX (`~h`) encoding instead of deflate
     */
    constructor(plantUMLOptions?: {
        baseUrl?: string;
        type?: ("svg" | "png" | "txt" | "uml");
        useHex?: boolean;
    });
    baseUrl: string;
    type: "svg" | "txt" | "png" | "uml";
    useHex: boolean;
    /**
     * Compose the full image URL from the diagram source.
     * @param {string} src diagram source text
     * @returns {string} full URL to the rendered diagram
     */
    getUrl(src: string): string;
    render(src: any, sign: any): string;
}
