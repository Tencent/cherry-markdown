export default class Hash {
    /**
     * @param data data
     * @param inputEncoding data encoding
     * @returns updated hash
     */
    update(data: string, inputEncoding: string): this;
    /**
     * @param data data
     * @returns updated hash
     */
    update(data: Buffer): this;
    /**
     * Calculates the digest without encoding
     * @abstract
     * @returns {Buffer} digest
     */
    digest(): Buffer;
    /**
     * Calculates the digest with encoding
     * @abstract
     * @param encoding encoding of the return value
     * @returns {string} digest
     */
    digest(encoding: string): string;
}
