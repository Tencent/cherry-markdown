/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { UriUtils } from './utils/uri-utils.js';
/**
 * Generic registry for Langium services, but capable of being used with extending service sets as well (such as the lsp-complete LangiumCoreServices set)
 */
export class DefaultServiceRegistry {
    /**
     * @deprecated Since 3.1.0. Use the new `fileExtensionMap` (or `languageIdMap`) property instead.
     */
    get map() {
        return this.fileExtensionMap;
    }
    constructor(services) {
        this.languageIdMap = new Map();
        this.fileExtensionMap = new Map();
        this.fileNameMap = new Map();
        this.textDocuments = services?.workspace.TextDocuments;
    }
    register(language) {
        const data = language.LanguageMetaData;
        for (const ext of data.fileExtensions) {
            if (this.fileExtensionMap.has(ext)) {
                console.warn(`The file extension ${ext} is used by multiple languages. It is now assigned to '${data.languageId}'.`);
            }
            this.fileExtensionMap.set(ext, language);
        }
        if (data.fileNames) {
            for (const name of data.fileNames) {
                if (this.fileNameMap.has(name)) {
                    console.warn(`The file name ${name} is used by multiple languages. It is now assigned to '${data.languageId}'.`);
                }
                this.fileNameMap.set(name, language);
            }
        }
        this.languageIdMap.set(data.languageId, language);
    }
    getServices(uri) {
        if (this.languageIdMap.size === 0) {
            throw new Error('The service registry is empty. Use `register` to register the services of a language.');
        }
        const languageId = this.textDocuments?.get(uri)?.languageId;
        if (languageId !== undefined) {
            const services = this.languageIdMap.get(languageId);
            if (services) {
                return services;
            }
        }
        const ext = UriUtils.extname(uri);
        const name = UriUtils.basename(uri);
        const services = this.fileNameMap.get(name) ?? this.fileExtensionMap.get(ext);
        if (!services) {
            if (languageId) {
                throw new Error(`The service registry contains no services for the extension '${ext}' for language '${languageId}'.`);
            }
            else {
                throw new Error(`The service registry contains no services for the extension '${ext}'.`);
            }
        }
        return services;
    }
    hasServices(uri) {
        try {
            this.getServices(uri);
            return true;
        }
        catch {
            return false;
        }
    }
    get all() {
        return Array.from(this.languageIdMap.values());
    }
}
//# sourceMappingURL=service-registry.js.map