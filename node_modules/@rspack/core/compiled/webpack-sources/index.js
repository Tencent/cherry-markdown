/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 780:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const Source = __nccwpck_require__(422);
const streamAndGetSourceAndMap = __nccwpck_require__(334);
const streamChunksOfRawSource = __nccwpck_require__(771);
const streamChunksOfSourceMap = __nccwpck_require__(105);
const {
	isDualStringBufferCachingEnabled,
} = __nccwpck_require__(357);

/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./Source").SourceValue} SourceValue */
/** @typedef {import("./helpers/getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./helpers/streamChunks").OnChunk} OnChunk */
/** @typedef {import("./helpers/streamChunks").OnName} OnName */
/** @typedef {import("./helpers/streamChunks").OnSource} OnSource */
/** @typedef {import("./helpers/streamChunks").Options} Options */

/**
 * @typedef {object} BufferedMap
 * @property {number} version version
 * @property {string[]} sources sources
 * @property {string[]} names name
 * @property {string=} sourceRoot source root
 * @property {(Buffer | "")[]=} sourcesContent sources content
 * @property {Buffer=} mappings mappings
 * @property {string} file file
 */

/**
 * @param {null | RawSourceMap} map map
 * @returns {null | BufferedMap} buffered map
 */
const mapToBufferedMap = (map) => {
	if (typeof map !== "object" || !map) return map;
	const bufferedMap =
		/** @type {BufferedMap} */
		(/** @type {unknown} */ ({ ...map }));
	if (map.mappings) {
		bufferedMap.mappings = Buffer.from(map.mappings, "utf8");
	}
	if (map.sourcesContent) {
		bufferedMap.sourcesContent = map.sourcesContent.map(
			(str) => str && Buffer.from(str, "utf8"),
		);
	}
	return bufferedMap;
};

/**
 * @param {null | BufferedMap} bufferedMap buffered map
 * @returns {null | RawSourceMap} map
 */
const bufferedMapToMap = (bufferedMap) => {
	if (typeof bufferedMap !== "object" || !bufferedMap) return bufferedMap;
	const map =
		/** @type {RawSourceMap} */
		(/** @type {unknown} */ ({ ...bufferedMap }));
	if (bufferedMap.mappings) {
		map.mappings = bufferedMap.mappings.toString("utf8");
	}
	if (bufferedMap.sourcesContent) {
		map.sourcesContent = bufferedMap.sourcesContent.map(
			(buffer) => buffer && buffer.toString("utf8"),
		);
	}
	return map;
};

/** @typedef {{ map?: null | RawSourceMap, bufferedMap?: null | BufferedMap }} BufferEntry */
/** @typedef {Map<string, BufferEntry>} BufferedMaps */

/**
 * @typedef {object} CachedData
 * @property {boolean=} source source
 * @property {Buffer} buffer buffer
 * @property {number=} size size
 * @property {BufferedMaps} maps maps
 * @property {(string | Buffer)[]=} hash hash
 */

class CachedSource extends Source {
	/**
	 * @param {Source | (() => Source)} source source
	 * @param {CachedData=} cachedData cached data
	 */
	constructor(source, cachedData) {
		super();
		this._source = source;
		this._cachedSourceType = cachedData ? cachedData.source : undefined;
		/**
		 * @private
		 * @type {undefined | string}
		 */
		this._cachedSource = undefined;
		this._cachedBuffer = cachedData ? cachedData.buffer : undefined;
		this._cachedSize = cachedData ? cachedData.size : undefined;
		/**
		 * @private
		 * @type {BufferedMaps}
		 */
		this._cachedMaps = cachedData ? cachedData.maps : new Map();
		this._cachedHashUpdate = cachedData ? cachedData.hash : undefined;
	}

	/**
	 * @returns {CachedData} cached data
	 */
	getCachedData() {
		/** @type {BufferedMaps} */
		const bufferedMaps = new Map();
		for (const pair of this._cachedMaps) {
			const [, cacheEntry] = pair;
			if (cacheEntry.bufferedMap === undefined) {
				cacheEntry.bufferedMap = mapToBufferedMap(
					this._getMapFromCacheEntry(cacheEntry),
				);
			}
			bufferedMaps.set(pair[0], {
				map: undefined,
				bufferedMap: cacheEntry.bufferedMap,
			});
		}
		return {
			// We don't want to cache strings
			// So if we have a caches sources
			// create a buffer from it and only store
			// if it was a Buffer or string
			buffer: this._cachedSource
				? this.buffer()
				: /** @type {Buffer} */ (this._cachedBuffer),
			source:
				this._cachedSourceType !== undefined
					? this._cachedSourceType
					: typeof this._cachedSource === "string"
						? true
						: Buffer.isBuffer(this._cachedSource)
							? false
							: undefined,
			size: this._cachedSize,
			maps: bufferedMaps,
			hash: this._cachedHashUpdate,
		};
	}

	originalLazy() {
		return this._source;
	}

	original() {
		if (typeof this._source === "function") this._source = this._source();
		return this._source;
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		const source = this._getCachedSource();
		if (source !== undefined) return source;
		return (this._cachedSource =
			/** @type {string} */
			(this.original().source()));
	}

	/**
	 * @private
	 * @param {BufferEntry} cacheEntry cache entry
	 * @returns {null | RawSourceMap} raw source map
	 */
	_getMapFromCacheEntry(cacheEntry) {
		if (cacheEntry.map !== undefined) {
			return cacheEntry.map;
		} else if (cacheEntry.bufferedMap !== undefined) {
			return (cacheEntry.map = bufferedMapToMap(cacheEntry.bufferedMap));
		}

		return null;
	}

	/**
	 * @private
	 * @returns {undefined | string} cached source
	 */
	_getCachedSource() {
		if (this._cachedSource !== undefined) return this._cachedSource;
		if (this._cachedBuffer && this._cachedSourceType !== undefined) {
			const value = this._cachedSourceType
				? this._cachedBuffer.toString("utf8")
				: this._cachedBuffer;
			if (isDualStringBufferCachingEnabled()) {
				this._cachedSource = /** @type {string} */ (value);
			}
			return /** @type {string} */ (value);
		}
	}

	/**
	 * @returns {Buffer} buffer
	 */
	buffer() {
		if (this._cachedBuffer !== undefined) return this._cachedBuffer;
		if (this._cachedSource !== undefined) {
			const value = Buffer.isBuffer(this._cachedSource)
				? this._cachedSource
				: Buffer.from(this._cachedSource, "utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._cachedBuffer = value;
			}
			return value;
		}
		if (typeof this.original().buffer === "function") {
			return (this._cachedBuffer = this.original().buffer());
		}
		const bufferOrString = this.source();
		if (Buffer.isBuffer(bufferOrString)) {
			return (this._cachedBuffer = bufferOrString);
		}
		const value = Buffer.from(bufferOrString, "utf8");
		if (isDualStringBufferCachingEnabled()) {
			this._cachedBuffer = value;
		}
		return value;
	}

	/**
	 * @returns {number} size
	 */
	size() {
		if (this._cachedSize !== undefined) return this._cachedSize;
		if (this._cachedBuffer !== undefined) {
			return (this._cachedSize = this._cachedBuffer.length);
		}
		const source = this._getCachedSource();
		if (source !== undefined) {
			return (this._cachedSize = Buffer.byteLength(source));
		}
		return (this._cachedSize = this.original().size());
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {SourceAndMap} source and map
	 */
	sourceAndMap(options) {
		const key = options ? JSON.stringify(options) : "{}";
		const cacheEntry = this._cachedMaps.get(key);
		// Look for a cached map
		if (cacheEntry !== undefined) {
			// We have a cached map in some representation
			const map = this._getMapFromCacheEntry(cacheEntry);

			// Either get the cached source or compute it
			return { source: this.source(), map };
		}
		// Look for a cached source
		let source = this._getCachedSource();
		// Compute the map
		let map;
		if (source !== undefined) {
			map = this.original().map(options);
		} else {
			// Compute the source and map together.
			const sourceAndMap = this.original().sourceAndMap(options);
			source = /** @type {string} */ (sourceAndMap.source);
			map = sourceAndMap.map;
			this._cachedSource = source;
		}
		this._cachedMaps.set(key, {
			map,
			bufferedMap: undefined,
		});
		return { source, map };
	}

	/**
	 * @param {Options} options options
	 * @param {OnChunk} onChunk called for each chunk of code
	 * @param {OnSource} onSource called for each source
	 * @param {OnName} onName called for each name
	 * @returns {GeneratedSourceInfo} generated source info
	 */
	streamChunks(options, onChunk, onSource, onName) {
		const key = options ? JSON.stringify(options) : "{}";
		if (
			this._cachedMaps.has(key) &&
			(this._cachedBuffer !== undefined || this._cachedSource !== undefined)
		) {
			const { source, map } = this.sourceAndMap(options);
			if (map) {
				return streamChunksOfSourceMap(
					/** @type {string} */
					(source),
					map,
					onChunk,
					onSource,
					onName,
					Boolean(options && options.finalSource),
					true,
				);
			}
			return streamChunksOfRawSource(
				/** @type {string} */
				(source),
				onChunk,
				onSource,
				onName,
				Boolean(options && options.finalSource),
			);
		}
		const sourceAndMap = streamAndGetSourceAndMap(
			this.original(),
			options,
			onChunk,
			onSource,
			onName,
		);
		this._cachedSource = sourceAndMap.source;
		this._cachedMaps.set(key, {
			map: /** @type {RawSourceMap} */ (sourceAndMap.map),
			bufferedMap: undefined,
		});
		return sourceAndMap.result;
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	map(options) {
		const key = options ? JSON.stringify(options) : "{}";
		const cacheEntry = this._cachedMaps.get(key);
		if (cacheEntry !== undefined) {
			return this._getMapFromCacheEntry(cacheEntry);
		}
		const map = this.original().map(options);
		this._cachedMaps.set(key, {
			map,
			bufferedMap: undefined,
		});
		return map;
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	updateHash(hash) {
		if (this._cachedHashUpdate !== undefined) {
			for (const item of this._cachedHashUpdate) hash.update(item);
			return;
		}
		/** @type {(string | Buffer)[]} */
		const update = [];
		/** @type {string | undefined} */
		let currentString;
		const tracker = {
			/**
			 * @param {string | Buffer} item item
			 * @returns {void}
			 */
			update: (item) => {
				if (typeof item === "string" && item.length < 10240) {
					if (currentString === undefined) {
						currentString = item;
					} else {
						currentString += item;
						if (currentString.length > 102400) {
							update.push(Buffer.from(currentString));
							currentString = undefined;
						}
					}
				} else {
					if (currentString !== undefined) {
						update.push(Buffer.from(currentString));
						currentString = undefined;
					}
					update.push(item);
				}
			},
		};
		this.original().updateHash(/** @type {HashLike} */ (tracker));
		if (currentString !== undefined) {
			update.push(Buffer.from(currentString));
		}
		for (const item of update) hash.update(item);
		this._cachedHashUpdate = update;
	}
}

module.exports = CachedSource;


/***/ }),

/***/ 844:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const Source = __nccwpck_require__(422);

/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./Source").SourceValue} SourceValue */

/**
 * @typedef {object} SourceLike
 * @property {() => SourceValue} source source
 * @property {(() => Buffer)=} buffer buffer
 * @property {(() => number)=} size size
 * @property {((options?: MapOptions) => RawSourceMap | null)=} map map
 * @property {((options?: MapOptions) => SourceAndMap)=} sourceAndMap source and map
 * @property {((hash: HashLike) => void)=} updateHash hash updater
 */

class CompatSource extends Source {
	/**
	 * @param {SourceLike} sourceLike source like
	 * @returns {Source} source
	 */
	static from(sourceLike) {
		return sourceLike instanceof Source
			? sourceLike
			: new CompatSource(sourceLike);
	}

	/**
	 * @param {SourceLike} sourceLike source like
	 */
	constructor(sourceLike) {
		super();
		this._sourceLike = sourceLike;
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		return this._sourceLike.source();
	}

	buffer() {
		if (typeof this._sourceLike.buffer === "function") {
			return this._sourceLike.buffer();
		}
		return super.buffer();
	}

	size() {
		if (typeof this._sourceLike.size === "function") {
			return this._sourceLike.size();
		}
		return super.size();
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	map(options) {
		if (typeof this._sourceLike.map === "function") {
			return this._sourceLike.map(options);
		}
		return super.map(options);
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {SourceAndMap} source and map
	 */
	sourceAndMap(options) {
		if (typeof this._sourceLike.sourceAndMap === "function") {
			return this._sourceLike.sourceAndMap(options);
		}
		return super.sourceAndMap(options);
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	updateHash(hash) {
		if (typeof this._sourceLike.updateHash === "function") {
			return this._sourceLike.updateHash(hash);
		}
		if (typeof this._sourceLike.map === "function") {
			throw new Error(
				"A Source-like object with a 'map' method must also provide an 'updateHash' method",
			);
		}
		hash.update(this.buffer());
	}
}

module.exports = CompatSource;


/***/ }),

/***/ 974:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const RawSource = __nccwpck_require__(136);
const Source = __nccwpck_require__(422);
const { getMap, getSourceAndMap } = __nccwpck_require__(875);
const streamChunks = __nccwpck_require__(779);

/** @typedef {import("./CompatSource").SourceLike} SourceLike */
/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./Source").SourceValue} SourceValue */
/** @typedef {import("./helpers/getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./helpers/streamChunks").OnChunk} OnChunk */
/** @typedef {import("./helpers/streamChunks").OnName} OnName */
/** @typedef {import("./helpers/streamChunks").OnSource} OnSource */
/** @typedef {import("./helpers/streamChunks").Options} Options */

/** @typedef {string | Source | SourceLike} Child */

const stringsAsRawSources = new WeakSet();

class ConcatSource extends Source {
	/**
	 * @param {Child[]} args children
	 */
	constructor(...args) {
		super();
		/**
		 * @private
		 * @type {Child[]}
		 */
		this._children = [];

		for (const item of args) {
			if (item instanceof ConcatSource) {
				for (const child of item._children) {
					this._children.push(child);
				}
			} else {
				this._children.push(item);
			}
		}

		this._isOptimized = args.length === 0;
	}

	/**
	 * @returns {Source[]} children
	 */
	getChildren() {
		if (!this._isOptimized) this._optimize();
		return /** @type {Source[]} */ (this._children);
	}

	/**
	 * @param {Child} item item
	 * @returns {void}
	 */
	add(item) {
		if (item instanceof ConcatSource) {
			for (const child of item._children) {
				this._children.push(child);
			}
		} else {
			this._children.push(item);
		}
		this._isOptimized = false;
	}

	/**
	 * @param {Child[]} items items
	 * @returns {void}
	 */
	addAllSkipOptimizing(items) {
		for (const item of items) {
			this._children.push(item);
		}
	}

	buffer() {
		if (!this._isOptimized) this._optimize();
		/** @type {Buffer[]} */
		const buffers = [];
		for (const child of /** @type {SourceLike[]} */ (this._children)) {
			if (typeof child.buffer === "function") {
				buffers.push(child.buffer());
			} else {
				const bufferOrString = child.source();
				if (Buffer.isBuffer(bufferOrString)) {
					buffers.push(bufferOrString);
				} else {
					// This will not happen
					buffers.push(Buffer.from(bufferOrString, "utf8"));
				}
			}
		}
		return Buffer.concat(buffers);
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		if (!this._isOptimized) this._optimize();
		let source = "";
		for (const child of this._children) {
			source += /** @type {Source} */ (child).source();
		}
		return source;
	}

	size() {
		if (!this._isOptimized) this._optimize();
		let size = 0;
		for (const child of this._children) {
			size += /** @type {Source} */ (child).size();
		}
		return size;
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	map(options) {
		return getMap(this, options);
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {SourceAndMap} source and map
	 */
	sourceAndMap(options) {
		return getSourceAndMap(this, options);
	}

	/**
	 * @param {Options} options options
	 * @param {OnChunk} onChunk called for each chunk of code
	 * @param {OnSource} onSource called for each source
	 * @param {OnName} onName called for each name
	 * @returns {GeneratedSourceInfo} generated source info
	 */
	streamChunks(options, onChunk, onSource, onName) {
		if (!this._isOptimized) this._optimize();
		if (this._children.length === 1) {
			return /** @type {ConcatSource[]} */ (this._children)[0].streamChunks(
				options,
				onChunk,
				onSource,
				onName,
			);
		}
		let currentLineOffset = 0;
		let currentColumnOffset = 0;
		const sourceMapping = new Map();
		const nameMapping = new Map();
		const finalSource = Boolean(options && options.finalSource);
		let code = "";
		let needToCloseMapping = false;
		for (const item of /** @type {Source[]} */ (this._children)) {
			/** @type {number[]} */
			const sourceIndexMapping = [];
			/** @type {number[]} */
			const nameIndexMapping = [];
			let lastMappingLine = 0;
			const { generatedLine, generatedColumn, source } = streamChunks(
				item,
				options,
				// eslint-disable-next-line no-loop-func
				(
					chunk,
					generatedLine,
					generatedColumn,
					sourceIndex,
					originalLine,
					originalColumn,
					nameIndex,
				) => {
					const line = generatedLine + currentLineOffset;
					const column =
						generatedLine === 1
							? generatedColumn + currentColumnOffset
							: generatedColumn;
					if (needToCloseMapping) {
						if (generatedLine !== 1 || generatedColumn !== 0) {
							onChunk(
								undefined,
								currentLineOffset + 1,
								currentColumnOffset,
								-1,
								-1,
								-1,
								-1,
							);
						}
						needToCloseMapping = false;
					}
					const resultSourceIndex =
						sourceIndex < 0 || sourceIndex >= sourceIndexMapping.length
							? -1
							: sourceIndexMapping[sourceIndex];
					const resultNameIndex =
						nameIndex < 0 || nameIndex >= nameIndexMapping.length
							? -1
							: nameIndexMapping[nameIndex];
					lastMappingLine = resultSourceIndex < 0 ? 0 : generatedLine;
					let _chunk;
					// When using finalSource, we process the entire source code at once at the end, rather than chunk by chunk
					if (finalSource) {
						if (chunk !== undefined) code += chunk;
					} else {
						_chunk = chunk;
					}
					if (resultSourceIndex < 0) {
						onChunk(_chunk, line, column, -1, -1, -1, -1);
					} else {
						onChunk(
							_chunk,
							line,
							column,
							resultSourceIndex,
							originalLine,
							originalColumn,
							resultNameIndex,
						);
					}
				},
				(i, source, sourceContent) => {
					let globalIndex = sourceMapping.get(source);
					if (globalIndex === undefined) {
						sourceMapping.set(source, (globalIndex = sourceMapping.size));
						onSource(globalIndex, source, sourceContent);
					}
					sourceIndexMapping[i] = globalIndex;
				},
				(i, name) => {
					let globalIndex = nameMapping.get(name);
					if (globalIndex === undefined) {
						nameMapping.set(name, (globalIndex = nameMapping.size));
						onName(globalIndex, name);
					}
					nameIndexMapping[i] = globalIndex;
				},
			);
			if (source !== undefined) code += source;
			if (
				needToCloseMapping &&
				(generatedLine !== 1 || generatedColumn !== 0)
			) {
				onChunk(
					undefined,
					currentLineOffset + 1,
					currentColumnOffset,
					-1,
					-1,
					-1,
					-1,
				);
				needToCloseMapping = false;
			}
			if (/** @type {number} */ (generatedLine) > 1) {
				currentColumnOffset = /** @type {number} */ (generatedColumn);
			} else {
				currentColumnOffset += /** @type {number} */ (generatedColumn);
			}
			needToCloseMapping =
				needToCloseMapping ||
				(finalSource && lastMappingLine === generatedLine);
			currentLineOffset += /** @type {number} */ (generatedLine) - 1;
		}
		return {
			generatedLine: currentLineOffset + 1,
			generatedColumn: currentColumnOffset,
			source: finalSource ? code : undefined,
		};
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	updateHash(hash) {
		if (!this._isOptimized) this._optimize();
		hash.update("ConcatSource");
		for (const item of this._children) {
			/** @type {Source} */
			(item).updateHash(hash);
		}
	}

	_optimize() {
		const newChildren = [];
		let currentString;
		/** @type {undefined | string | [string, string] | SourceLike} */
		let currentRawSources;
		/**
		 * @param {string} string string
		 * @returns {void}
		 */
		const addStringToRawSources = (string) => {
			if (currentRawSources === undefined) {
				currentRawSources = string;
			} else if (Array.isArray(currentRawSources)) {
				currentRawSources.push(string);
			} else {
				currentRawSources = [
					typeof currentRawSources === "string"
						? currentRawSources
						: /** @type {string} */ (currentRawSources.source()),
					string,
				];
			}
		};
		/**
		 * @param {SourceLike} source source
		 * @returns {void}
		 */
		const addSourceToRawSources = (source) => {
			if (currentRawSources === undefined) {
				currentRawSources = source;
			} else if (Array.isArray(currentRawSources)) {
				currentRawSources.push(
					/** @type {string} */
					(source.source()),
				);
			} else {
				currentRawSources = [
					typeof currentRawSources === "string"
						? currentRawSources
						: /** @type {string} */ (currentRawSources.source()),
					/** @type {string} */
					(source.source()),
				];
			}
		};
		const mergeRawSources = () => {
			if (Array.isArray(currentRawSources)) {
				const rawSource = new RawSource(currentRawSources.join(""));
				stringsAsRawSources.add(rawSource);
				newChildren.push(rawSource);
			} else if (typeof currentRawSources === "string") {
				const rawSource = new RawSource(currentRawSources);
				stringsAsRawSources.add(rawSource);
				newChildren.push(rawSource);
			} else {
				newChildren.push(currentRawSources);
			}
		};
		for (const child of this._children) {
			if (typeof child === "string") {
				if (currentString === undefined) {
					currentString = child;
				} else {
					currentString += child;
				}
			} else {
				if (currentString !== undefined) {
					addStringToRawSources(currentString);
					currentString = undefined;
				}
				if (stringsAsRawSources.has(child)) {
					addSourceToRawSources(
						/** @type {SourceLike} */
						(child),
					);
				} else {
					if (currentRawSources !== undefined) {
						mergeRawSources();
						currentRawSources = undefined;
					}
					newChildren.push(child);
				}
			}
		}
		if (currentString !== undefined) {
			addStringToRawSources(currentString);
		}
		if (currentRawSources !== undefined) {
			mergeRawSources();
		}
		this._children = newChildren;
		this._isOptimized = true;
	}
}

module.exports = ConcatSource;


/***/ }),

/***/ 837:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const Source = __nccwpck_require__(422);
const { getMap, getSourceAndMap } = __nccwpck_require__(875);
const getGeneratedSourceInfo = __nccwpck_require__(517);
const splitIntoLines = __nccwpck_require__(492);
const splitIntoPotentialTokens = __nccwpck_require__(403);
const {
	isDualStringBufferCachingEnabled,
} = __nccwpck_require__(357);

/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./Source").SourceValue} SourceValue */
/** @typedef {import("./helpers/getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./helpers/streamChunks").OnChunk} OnChunk */
/** @typedef {import("./helpers/streamChunks").OnName} OnName */
/** @typedef {import("./helpers/streamChunks").OnSource} OnSource */
/** @typedef {import("./helpers/streamChunks").Options} Options */

class OriginalSource extends Source {
	/**
	 * @param {string | Buffer} value value
	 * @param {string} name name
	 */
	constructor(value, name) {
		super();

		const isBuffer = Buffer.isBuffer(value);

		/**
		 * @private
		 * @type {undefined | string}
		 */
		this._value = isBuffer ? undefined : value;
		/**
		 * @private
		 * @type {undefined | Buffer}
		 */
		this._valueAsBuffer = isBuffer ? value : undefined;
		this._name = name;
	}

	getName() {
		return this._name;
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		if (this._value === undefined) {
			const value =
				/** @type {Buffer} */
				(this._valueAsBuffer).toString("utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._value = value;
			}
			return value;
		}
		return this._value;
	}

	buffer() {
		if (this._valueAsBuffer === undefined) {
			const value = Buffer.from(/** @type {string} */ (this._value), "utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._valueAsBuffer = value;
			}
			return value;
		}
		return this._valueAsBuffer;
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	map(options) {
		return getMap(this, options);
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {SourceAndMap} source and map
	 */
	sourceAndMap(options) {
		return getSourceAndMap(this, options);
	}

	/**
	 * @param {Options} options options
	 * @param {OnChunk} onChunk called for each chunk of code
	 * @param {OnSource} onSource called for each source
	 * @param {OnName} _onName called for each name
	 * @returns {GeneratedSourceInfo} generated source info
	 */
	streamChunks(options, onChunk, onSource, _onName) {
		if (this._value === undefined) {
			this._value =
				/** @type {Buffer} */
				(this._valueAsBuffer).toString("utf8");
		}
		onSource(0, this._name, this._value);
		const finalSource = Boolean(options && options.finalSource);
		if (!options || options.columns !== false) {
			// With column info we need to read all lines and split them
			const matches = splitIntoPotentialTokens(this._value);
			let line = 1;
			let column = 0;
			if (matches !== null) {
				for (const match of matches) {
					const isEndOfLine = match.endsWith("\n");
					if (isEndOfLine && match.length === 1) {
						if (!finalSource) onChunk(match, line, column, -1, -1, -1, -1);
					} else {
						const chunk = finalSource ? undefined : match;
						onChunk(chunk, line, column, 0, line, column, -1);
					}
					if (isEndOfLine) {
						line++;
						column = 0;
					} else {
						column += match.length;
					}
				}
			}
			return {
				generatedLine: line,
				generatedColumn: column,
				source: finalSource ? this._value : undefined,
			};
		} else if (finalSource) {
			// Without column info and with final source we only
			// need meta info to generate mapping
			const result = getGeneratedSourceInfo(this._value);
			const { generatedLine, generatedColumn } = result;
			if (generatedColumn === 0) {
				for (
					let line = 1;
					line < /** @type {number} */ (generatedLine);
					line++
				) {
					onChunk(undefined, line, 0, 0, line, 0, -1);
				}
			} else {
				for (
					let line = 1;
					line <= /** @type {number} */ (generatedLine);
					line++
				) {
					onChunk(undefined, line, 0, 0, line, 0, -1);
				}
			}
			return result;
		}
		// Without column info, but also without final source
		// we need to split source by lines
		let line = 1;
		const matches = splitIntoLines(this._value);
		/** @type {string | undefined} */
		let match;
		for (match of matches) {
			onChunk(finalSource ? undefined : match, line, 0, 0, line, 0, -1);
			line++;
		}
		return matches.length === 0 || /** @type {string} */ (match).endsWith("\n")
			? {
					generatedLine: matches.length + 1,
					generatedColumn: 0,
					source: finalSource ? this._value : undefined,
				}
			: {
					generatedLine: matches.length,
					generatedColumn: /** @type {string} */ (match).length,
					source: finalSource ? this._value : undefined,
				};
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	updateHash(hash) {
		hash.update("OriginalSource");
		hash.update(this.buffer());
		hash.update(this._name || "");
	}
}

module.exports = OriginalSource;


/***/ }),

/***/ 850:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const RawSource = __nccwpck_require__(136);
const Source = __nccwpck_require__(422);
const { getMap, getSourceAndMap } = __nccwpck_require__(875);
const streamChunks = __nccwpck_require__(779);

/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./Source").SourceValue} SourceValue */
/** @typedef {import("./helpers/getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./helpers/streamChunks").OnChunk} OnChunk */
/** @typedef {import("./helpers/streamChunks").OnName} OnName */
/** @typedef {import("./helpers/streamChunks").OnSource} OnSource */
/** @typedef {import("./helpers/streamChunks").Options} Options */

const REPLACE_REGEX = /\n(?=.|\s)/g;

class PrefixSource extends Source {
	/**
	 * @param {string} prefix prefix
	 * @param {string | Buffer | Source} source source
	 */
	constructor(prefix, source) {
		super();
		/**
		 * @private
		 * @type {Source}
		 */
		this._source =
			typeof source === "string" || Buffer.isBuffer(source)
				? new RawSource(source, true)
				: source;
		this._prefix = prefix;
	}

	getPrefix() {
		return this._prefix;
	}

	original() {
		return this._source;
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		const node = /** @type {string} */ (this._source.source());
		const prefix = this._prefix;
		return prefix + node.replace(REPLACE_REGEX, `\n${prefix}`);
	}

	// TODO efficient buffer() implementation

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	map(options) {
		return getMap(this, options);
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {SourceAndMap} source and map
	 */
	sourceAndMap(options) {
		return getSourceAndMap(this, options);
	}

	/**
	 * @param {Options} options options
	 * @param {OnChunk} onChunk called for each chunk of code
	 * @param {OnSource} onSource called for each source
	 * @param {OnName} onName called for each name
	 * @returns {GeneratedSourceInfo} generated source info
	 */
	streamChunks(options, onChunk, onSource, onName) {
		const prefix = this._prefix;
		const prefixOffset = prefix.length;
		const linesOnly = Boolean(options && options.columns === false);
		const { generatedLine, generatedColumn, source } = streamChunks(
			this._source,
			options,
			(
				chunk,
				generatedLine,
				generatedColumn,
				sourceIndex,
				originalLine,
				originalColumn,
				nameIndex,
			) => {
				if (generatedColumn !== 0) {
					// In the middle of the line, we just adject the column
					generatedColumn += prefixOffset;
				} else if (chunk !== undefined) {
					// At the start of the line, when we have source content
					// add the prefix as generated mapping
					// (in lines only mode we just add it to the original mapping
					// for performance reasons)
					if (linesOnly || sourceIndex < 0) {
						chunk = prefix + chunk;
					} else if (prefixOffset > 0) {
						onChunk(prefix, generatedLine, generatedColumn, -1, -1, -1, -1);
						generatedColumn += prefixOffset;
					}
				} else if (!linesOnly) {
					// Without source content, we only need to adject the column info
					// expect in lines only mode where prefix is added to original mapping
					generatedColumn += prefixOffset;
				}
				onChunk(
					chunk,
					generatedLine,
					generatedColumn,
					sourceIndex,
					originalLine,
					originalColumn,
					nameIndex,
				);
			},
			onSource,
			onName,
		);
		return {
			generatedLine,
			generatedColumn:
				generatedColumn === 0
					? 0
					: prefixOffset + /** @type {number} */ (generatedColumn),
			source:
				source !== undefined
					? prefix + source.replace(REPLACE_REGEX, `\n${prefix}`)
					: undefined,
		};
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	updateHash(hash) {
		hash.update("PrefixSource");
		this._source.updateHash(hash);
		hash.update(this._prefix);
	}
}

module.exports = PrefixSource;


/***/ }),

/***/ 136:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const Source = __nccwpck_require__(422);
const streamChunksOfRawSource = __nccwpck_require__(771);
const {
	internString,
	isDualStringBufferCachingEnabled,
} = __nccwpck_require__(357);

/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceValue} SourceValue */
/** @typedef {import("./helpers/getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./helpers/streamChunks").OnChunk} OnChunk */
/** @typedef {import("./helpers/streamChunks").OnName} OnName */
/** @typedef {import("./helpers/streamChunks").OnSource} OnSource */
/** @typedef {import("./helpers/streamChunks").Options} Options */

class RawSource extends Source {
	/**
	 * @param {string | Buffer} value value
	 * @param {boolean=} convertToString convert to string
	 */
	constructor(value, convertToString = false) {
		super();
		const isBuffer = Buffer.isBuffer(value);
		if (!isBuffer && typeof value !== "string") {
			throw new TypeError("argument 'value' must be either string or Buffer");
		}
		this._valueIsBuffer = !convertToString && isBuffer;
		const internedString =
			typeof value === "string" ? internString(value) : undefined;
		/**
		 * @private
		 * @type {undefined | string | Buffer}
		 */
		this._value =
			convertToString && isBuffer
				? undefined
				: typeof value === "string"
					? internedString
					: value;
		/**
		 * @private
		 * @type {undefined | Buffer}
		 */
		this._valueAsBuffer = isBuffer ? value : undefined;
		/**
		 * @private
		 * @type {undefined | string}
		 */
		this._valueAsString = isBuffer ? undefined : internedString;
	}

	isBuffer() {
		return this._valueIsBuffer;
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		if (this._value === undefined) {
			const value =
				/** @type {Buffer} */
				(this._valueAsBuffer).toString("utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._value = internString(value);
			}
			return value;
		}
		return this._value;
	}

	buffer() {
		if (this._valueAsBuffer === undefined) {
			const value = Buffer.from(/** @type {string} */ (this._value), "utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._valueAsBuffer = value;
			}
			return value;
		}
		return this._valueAsBuffer;
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	// eslint-disable-next-line no-unused-vars
	map(options) {
		return null;
	}

	/**
	 * @param {Options} options options
	 * @param {OnChunk} onChunk called for each chunk of code
	 * @param {OnSource} onSource called for each source
	 * @param {OnName} onName called for each name
	 * @returns {GeneratedSourceInfo} generated source info
	 */
	streamChunks(options, onChunk, onSource, onName) {
		let strValue = this._valueAsString;
		if (strValue === undefined) {
			const value = this.source();
			strValue = typeof value === "string" ? value : value.toString("utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._valueAsString = internString(strValue);
			}
		}
		return streamChunksOfRawSource(
			strValue,
			onChunk,
			onSource,
			onName,
			Boolean(options && options.finalSource),
		);
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	updateHash(hash) {
		hash.update("RawSource");
		hash.update(this.buffer());
	}
}

module.exports = RawSource;


/***/ }),

/***/ 902:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const Source = __nccwpck_require__(422);
const { getMap, getSourceAndMap } = __nccwpck_require__(875);
const splitIntoLines = __nccwpck_require__(492);
const streamChunks = __nccwpck_require__(779);

/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./Source").SourceValue} SourceValue */
/** @typedef {import("./helpers/getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./helpers/streamChunks").OnChunk} OnChunk */
/** @typedef {import("./helpers/streamChunks").OnName} OnName */
/** @typedef {import("./helpers/streamChunks").OnSource} OnSource */
/** @typedef {import("./helpers/streamChunks").Options} Options */

// since v8 7.0, Array.prototype.sort is stable
const hasStableSort =
	typeof process === "object" &&
	process.versions &&
	typeof process.versions.v8 === "string" &&
	!/^[0-6]\./.test(process.versions.v8);

// This is larger than max string length
const MAX_SOURCE_POSITION = 0x20000000;

class Replacement {
	/**
	 * @param {number} start start
	 * @param {number} end end
	 * @param {string} content content
	 * @param {string=} name name
	 */
	constructor(start, end, content, name) {
		this.start = start;
		this.end = end;
		this.content = content;
		this.name = name;
		if (!hasStableSort) {
			this.index = -1;
		}
	}
}

class ReplaceSource extends Source {
	/**
	 * @param {Source} source source
	 * @param {string=} name name
	 */
	constructor(source, name) {
		super();
		this._source = source;
		this._name = name;
		/** @type {Replacement[]} */
		this._replacements = [];
		this._isSorted = true;
	}

	getName() {
		return this._name;
	}

	getReplacements() {
		this._sortReplacements();
		return this._replacements;
	}

	/**
	 * @param {number} start start
	 * @param {number} end end
	 * @param {string} newValue new value
	 * @param {string=} name name
	 * @returns {void}
	 */
	replace(start, end, newValue, name) {
		if (typeof newValue !== "string") {
			throw new Error(
				`insertion must be a string, but is a ${typeof newValue}`,
			);
		}
		this._replacements.push(new Replacement(start, end, newValue, name));
		this._isSorted = false;
	}

	/**
	 * @param {number} pos pos
	 * @param {string} newValue new value
	 * @param {string=} name name
	 * @returns {void}
	 */
	insert(pos, newValue, name) {
		if (typeof newValue !== "string") {
			throw new Error(
				`insertion must be a string, but is a ${typeof newValue}: ${newValue}`,
			);
		}
		this._replacements.push(new Replacement(pos, pos - 1, newValue, name));
		this._isSorted = false;
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		if (this._replacements.length === 0) {
			return this._source.source();
		}
		let current = this._source.source();
		let pos = 0;
		const result = [];

		this._sortReplacements();
		for (const replacement of this._replacements) {
			const start = Math.floor(replacement.start);
			const end = Math.floor(replacement.end + 1);
			if (pos < start) {
				const offset = start - pos;
				result.push(current.slice(0, offset));
				current = current.slice(offset);
				pos = start;
			}
			result.push(replacement.content);
			if (pos < end) {
				const offset = end - pos;
				current = current.slice(offset);
				pos = end;
			}
		}
		result.push(current);
		return result.join("");
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	map(options) {
		if (this._replacements.length === 0) {
			return this._source.map(options);
		}
		return getMap(this, options);
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {SourceAndMap} source and map
	 */
	sourceAndMap(options) {
		if (this._replacements.length === 0) {
			return this._source.sourceAndMap(options);
		}
		return getSourceAndMap(this, options);
	}

	original() {
		return this._source;
	}

	_sortReplacements() {
		if (this._isSorted) return;
		if (hasStableSort) {
			this._replacements.sort((a, b) => {
				const diff1 = a.start - b.start;
				if (diff1 !== 0) return diff1;
				const diff2 = a.end - b.end;
				if (diff2 !== 0) return diff2;
				return 0;
			});
		} else {
			for (const [i, repl] of this._replacements.entries()) repl.index = i;
			this._replacements.sort((a, b) => {
				const diff1 = a.start - b.start;
				if (diff1 !== 0) return diff1;
				const diff2 = a.end - b.end;
				if (diff2 !== 0) return diff2;
				return (
					/** @type {number} */ (a.index) - /** @type {number} */ (b.index)
				);
			});
		}
		this._isSorted = true;
	}

	/**
	 * @param {Options} options options
	 * @param {OnChunk} onChunk called for each chunk of code
	 * @param {OnSource} onSource called for each source
	 * @param {OnName} onName called for each name
	 * @returns {GeneratedSourceInfo} generated source info
	 */
	streamChunks(options, onChunk, onSource, onName) {
		this._sortReplacements();
		const replacements = this._replacements;
		let pos = 0;
		let i = 0;
		let replacementEnd = -1;
		let nextReplacement =
			i < replacements.length
				? Math.floor(replacements[i].start)
				: MAX_SOURCE_POSITION;
		let generatedLineOffset = 0;
		let generatedColumnOffset = 0;
		let generatedColumnOffsetLine = 0;
		/** @type {(string | string[] | undefined)[]} */
		const sourceContents = [];
		/** @type {Map<string, number>} */
		const nameMapping = new Map();
		/** @type {number[]} */
		const nameIndexMapping = [];
		/**
		 * @param {number} sourceIndex source index
		 * @param {number} line line
		 * @param {number} column column
		 * @param {string} expectedChunk expected chunk
		 * @returns {boolean} result
		 */
		const checkOriginalContent = (sourceIndex, line, column, expectedChunk) => {
			/** @type {undefined | string | string[]} */
			let content =
				sourceIndex < sourceContents.length
					? sourceContents[sourceIndex]
					: undefined;
			if (content === undefined) return false;
			if (typeof content === "string") {
				content = splitIntoLines(content);
				sourceContents[sourceIndex] = content;
			}
			const contentLine = line <= content.length ? content[line - 1] : null;
			if (contentLine === null) return false;
			return (
				contentLine.slice(column, column + expectedChunk.length) ===
				expectedChunk
			);
		};
		const { generatedLine, generatedColumn } = streamChunks(
			this._source,
			{ ...options, finalSource: false },
			(
				_chunk,
				generatedLine,
				generatedColumn,
				sourceIndex,
				originalLine,
				originalColumn,
				nameIndex,
			) => {
				let chunkPos = 0;
				const chunk = /** @type {string} */ (_chunk);
				const endPos = pos + chunk.length;

				// Skip over when it has been replaced
				if (replacementEnd > pos) {
					// Skip over the whole chunk
					if (replacementEnd >= endPos) {
						const line = generatedLine + generatedLineOffset;
						if (chunk.endsWith("\n")) {
							generatedLineOffset--;
							if (generatedColumnOffsetLine === line) {
								// undo exiting corrections form the current line
								generatedColumnOffset += generatedColumn;
							}
						} else if (generatedColumnOffsetLine === line) {
							generatedColumnOffset -= chunk.length;
						} else {
							generatedColumnOffset = -chunk.length;
							generatedColumnOffsetLine = line;
						}
						pos = endPos;
						return;
					}

					// Partially skip over chunk
					chunkPos = replacementEnd - pos;
					if (
						checkOriginalContent(
							sourceIndex,
							originalLine,
							originalColumn,
							chunk.slice(0, chunkPos),
						)
					) {
						originalColumn += chunkPos;
					}
					pos += chunkPos;
					const line = generatedLine + generatedLineOffset;
					if (generatedColumnOffsetLine === line) {
						generatedColumnOffset -= chunkPos;
					} else {
						generatedColumnOffset = -chunkPos;
						generatedColumnOffsetLine = line;
					}
					generatedColumn += chunkPos;
				}

				// Is a replacement in the chunk?
				if (nextReplacement < endPos) {
					do {
						let line = generatedLine + generatedLineOffset;
						if (nextReplacement > pos) {
							// Emit chunk until replacement
							const offset = nextReplacement - pos;
							const chunkSlice = chunk.slice(chunkPos, chunkPos + offset);
							onChunk(
								chunkSlice,
								line,
								generatedColumn +
									(line === generatedColumnOffsetLine
										? generatedColumnOffset
										: 0),
								sourceIndex,
								originalLine,
								originalColumn,
								nameIndex < 0 || nameIndex >= nameIndexMapping.length
									? -1
									: nameIndexMapping[nameIndex],
							);
							generatedColumn += offset;
							chunkPos += offset;
							pos = nextReplacement;
							if (
								checkOriginalContent(
									sourceIndex,
									originalLine,
									originalColumn,
									chunkSlice,
								)
							) {
								originalColumn += chunkSlice.length;
							}
						}

						// Insert replacement content splitted into chunks by lines
						const { content, name } = replacements[i];
						const matches = splitIntoLines(content);
						let replacementNameIndex = nameIndex;
						if (sourceIndex >= 0 && name) {
							let globalIndex = nameMapping.get(name);
							if (globalIndex === undefined) {
								globalIndex = nameMapping.size;
								nameMapping.set(name, globalIndex);
								onName(globalIndex, name);
							}
							replacementNameIndex = globalIndex;
						}
						for (let m = 0; m < matches.length; m++) {
							const contentLine = matches[m];
							onChunk(
								contentLine,
								line,
								generatedColumn +
									(line === generatedColumnOffsetLine
										? generatedColumnOffset
										: 0),
								sourceIndex,
								originalLine,
								originalColumn,
								replacementNameIndex,
							);

							// Only the first chunk has name assigned
							replacementNameIndex = -1;

							if (m === matches.length - 1 && !contentLine.endsWith("\n")) {
								if (generatedColumnOffsetLine === line) {
									generatedColumnOffset += contentLine.length;
								} else {
									generatedColumnOffset = contentLine.length;
									generatedColumnOffsetLine = line;
								}
							} else {
								generatedLineOffset++;
								line++;
								generatedColumnOffset = -generatedColumn;
								generatedColumnOffsetLine = line;
							}
						}

						// Remove replaced content by settings this variable
						replacementEnd = Math.max(
							replacementEnd,
							Math.floor(replacements[i].end + 1),
						);

						// Move to next replacement
						i++;
						nextReplacement =
							i < replacements.length
								? Math.floor(replacements[i].start)
								: MAX_SOURCE_POSITION;

						// Skip over when it has been replaced
						const offset = chunk.length - endPos + replacementEnd - chunkPos;
						if (offset > 0) {
							// Skip over whole chunk
							if (replacementEnd >= endPos) {
								const line = generatedLine + generatedLineOffset;
								if (chunk.endsWith("\n")) {
									generatedLineOffset--;
									if (generatedColumnOffsetLine === line) {
										// undo exiting corrections form the current line
										generatedColumnOffset += generatedColumn;
									}
								} else if (generatedColumnOffsetLine === line) {
									generatedColumnOffset -= chunk.length - chunkPos;
								} else {
									generatedColumnOffset = chunkPos - chunk.length;
									generatedColumnOffsetLine = line;
								}
								pos = endPos;
								return;
							}

							// Partially skip over chunk
							const line = generatedLine + generatedLineOffset;
							if (
								checkOriginalContent(
									sourceIndex,
									originalLine,
									originalColumn,
									chunk.slice(chunkPos, chunkPos + offset),
								)
							) {
								originalColumn += offset;
							}
							chunkPos += offset;
							pos += offset;
							if (generatedColumnOffsetLine === line) {
								generatedColumnOffset -= offset;
							} else {
								generatedColumnOffset = -offset;
								generatedColumnOffsetLine = line;
							}
							generatedColumn += offset;
						}
					} while (nextReplacement < endPos);
				}

				// Emit remaining chunk
				if (chunkPos < chunk.length) {
					const chunkSlice = chunkPos === 0 ? chunk : chunk.slice(chunkPos);
					const line = generatedLine + generatedLineOffset;
					onChunk(
						chunkSlice,
						line,
						generatedColumn +
							(line === generatedColumnOffsetLine ? generatedColumnOffset : 0),
						sourceIndex,
						originalLine,
						originalColumn,
						nameIndex < 0 ? -1 : nameIndexMapping[nameIndex],
					);
				}
				pos = endPos;
			},
			(sourceIndex, source, sourceContent) => {
				while (sourceContents.length < sourceIndex) {
					sourceContents.push(undefined);
				}
				sourceContents[sourceIndex] = sourceContent;
				onSource(sourceIndex, source, sourceContent);
			},
			(nameIndex, name) => {
				let globalIndex = nameMapping.get(name);
				if (globalIndex === undefined) {
					globalIndex = nameMapping.size;
					nameMapping.set(name, globalIndex);
					onName(globalIndex, name);
				}
				nameIndexMapping[nameIndex] = globalIndex;
			},
		);

		// Handle remaining replacements
		let remainer = "";
		for (; i < replacements.length; i++) {
			remainer += replacements[i].content;
		}

		// Insert remaining replacements content splitted into chunks by lines
		let line = /** @type {number} */ (generatedLine) + generatedLineOffset;
		const matches = splitIntoLines(remainer);
		for (let m = 0; m < matches.length; m++) {
			const contentLine = matches[m];
			onChunk(
				contentLine,
				line,
				/** @type {number} */
				(generatedColumn) +
					(line === generatedColumnOffsetLine ? generatedColumnOffset : 0),
				-1,
				-1,
				-1,
				-1,
			);

			if (m === matches.length - 1 && !contentLine.endsWith("\n")) {
				if (generatedColumnOffsetLine === line) {
					generatedColumnOffset += contentLine.length;
				} else {
					generatedColumnOffset = contentLine.length;
					generatedColumnOffsetLine = line;
				}
			} else {
				generatedLineOffset++;
				line++;
				generatedColumnOffset = -(/** @type {number} */ (generatedColumn));
				generatedColumnOffsetLine = line;
			}
		}

		return {
			generatedLine: line,
			generatedColumn:
				/** @type {number} */
				(generatedColumn) +
				(line === generatedColumnOffsetLine ? generatedColumnOffset : 0),
		};
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	updateHash(hash) {
		this._sortReplacements();
		hash.update("ReplaceSource");
		this._source.updateHash(hash);
		hash.update(this._name || "");
		for (const repl of this._replacements) {
			hash.update(
				`${repl.start}${repl.end}${repl.content}${repl.name ? repl.name : ""}`,
			);
		}
	}
}

module.exports = ReplaceSource;
module.exports.Replacement = Replacement;


/***/ }),

/***/ 865:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const Source = __nccwpck_require__(422);

/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceValue} SourceValue */

class SizeOnlySource extends Source {
	/**
	 * @param {number} size size
	 */
	constructor(size) {
		super();
		this._size = size;
	}

	_error() {
		return new Error(
			"Content and Map of this Source is not available (only size() is supported)",
		);
	}

	size() {
		return this._size;
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		throw this._error();
	}

	/**
	 * @returns {Buffer} buffer
	 */
	buffer() {
		throw this._error();
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	// eslint-disable-next-line no-unused-vars
	map(options) {
		throw this._error();
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	// eslint-disable-next-line no-unused-vars
	updateHash(hash) {
		throw this._error();
	}
}

module.exports = SizeOnlySource;


/***/ }),

/***/ 422:
/***/ ((module) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



/**
 * @typedef {object} MapOptions
 * @property {boolean=} columns need columns?
 * @property {boolean=} module is module
 */

/**
 * @typedef {object} RawSourceMap
 * @property {number} version version
 * @property {string[]} sources sources
 * @property {string[]} names names
 * @property {string=} sourceRoot source root
 * @property {string[]=} sourcesContent sources content
 * @property {string} mappings mappings
 * @property {string} file file
 * @property {string=} debugId debug id
 * @property {number[]=} ignoreList ignore list
 */

/** @typedef {string | Buffer} SourceValue */

/**
 * @typedef {object} SourceAndMap
 * @property {SourceValue} source source
 * @property {RawSourceMap | null} map map
 */

/**
 * @typedef {object} HashLike
 * @property {(data: string | Buffer, inputEncoding?: string) => HashLike} update make hash update
 * @property {(encoding?: string) => string | Buffer} digest get hash digest
 */

class Source {
	/**
	 * @returns {SourceValue} source
	 */
	source() {
		throw new Error("Abstract");
	}

	buffer() {
		const source = this.source();
		if (Buffer.isBuffer(source)) return source;
		return Buffer.from(source, "utf8");
	}

	size() {
		return this.buffer().length;
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	// eslint-disable-next-line no-unused-vars
	map(options) {
		return null;
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {SourceAndMap} source and map
	 */
	sourceAndMap(options) {
		return {
			source: this.source(),
			map: this.map(options),
		};
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	// eslint-disable-next-line no-unused-vars
	updateHash(hash) {
		throw new Error("Abstract");
	}
}

module.exports = Source;


/***/ }),

/***/ 147:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const Source = __nccwpck_require__(422);
const { getMap, getSourceAndMap } = __nccwpck_require__(875);
const streamChunksOfCombinedSourceMap = __nccwpck_require__(132);
const streamChunksOfSourceMap = __nccwpck_require__(105);
const {
	isDualStringBufferCachingEnabled,
} = __nccwpck_require__(357);

/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./Source").SourceValue} SourceValue */
/** @typedef {import("./helpers/getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./helpers/streamChunks").OnChunk} OnChunk */
/** @typedef {import("./helpers/streamChunks").OnName} OnName */
/** @typedef {import("./helpers/streamChunks").OnSource} OnSource */
/** @typedef {import("./helpers/streamChunks").Options} Options */

class SourceMapSource extends Source {
	/**
	 * @param {string | Buffer} value value
	 * @param {string} name name
	 * @param {string | Buffer | RawSourceMap=} sourceMap source map
	 * @param {SourceValue=} originalSource original source
	 * @param {(string | Buffer | RawSourceMap)=} innerSourceMap inner source map
	 * @param {boolean=} removeOriginalSource do remove original source
	 */
	constructor(
		value,
		name,
		sourceMap,
		originalSource,
		innerSourceMap,
		removeOriginalSource,
	) {
		super();
		const valueIsBuffer = Buffer.isBuffer(value);
		/**
		 * @private
		 * @type {undefined | string}
		 */
		this._valueAsString = valueIsBuffer ? undefined : value;
		/**
		 * @private
		 * @type {undefined | Buffer}
		 */
		this._valueAsBuffer = valueIsBuffer ? value : undefined;

		this._name = name;

		this._hasSourceMap = Boolean(sourceMap);
		const sourceMapIsBuffer = Buffer.isBuffer(sourceMap);
		const sourceMapIsString = typeof sourceMap === "string";
		/**
		 * @private
		 * @type {undefined | RawSourceMap}
		 */
		this._sourceMapAsObject =
			sourceMapIsBuffer || sourceMapIsString ? undefined : sourceMap;
		/**
		 * @private
		 * @type {undefined | string}
		 */
		this._sourceMapAsString = sourceMapIsString ? sourceMap : undefined;
		/**
		 * @private
		 * @type {undefined | Buffer}
		 */
		this._sourceMapAsBuffer = sourceMapIsBuffer ? sourceMap : undefined;

		this._hasOriginalSource = Boolean(originalSource);
		const originalSourceIsBuffer = Buffer.isBuffer(originalSource);
		this._originalSourceAsString = originalSourceIsBuffer
			? undefined
			: originalSource;
		this._originalSourceAsBuffer = originalSourceIsBuffer
			? originalSource
			: undefined;

		this._hasInnerSourceMap = Boolean(innerSourceMap);
		const innerSourceMapIsBuffer = Buffer.isBuffer(innerSourceMap);
		const innerSourceMapIsString = typeof innerSourceMap === "string";
		/**
		 * @private
		 * @type {undefined | RawSourceMap}
		 */
		this._innerSourceMapAsObject =
			innerSourceMapIsBuffer || innerSourceMapIsString
				? undefined
				: innerSourceMap;
		/**
		 * @private
		 * @type {undefined | string}
		 */
		this._innerSourceMapAsString = innerSourceMapIsString
			? innerSourceMap
			: undefined;
		/**
		 * @private
		 * @type {undefined | Buffer}
		 */
		this._innerSourceMapAsBuffer = innerSourceMapIsBuffer
			? innerSourceMap
			: undefined;

		this._removeOriginalSource = removeOriginalSource;
	}

	/**
	 * @returns {[Buffer, string, Buffer, Buffer | undefined, Buffer | undefined, boolean | undefined]} args
	 */
	getArgsAsBuffers() {
		return [
			this.buffer(),
			this._name,
			this._sourceMapBuffer(),
			this._originalSourceBuffer(),
			this._innerSourceMapBuffer(),
			this._removeOriginalSource,
		];
	}

	buffer() {
		if (this._valueAsBuffer === undefined) {
			const value = Buffer.from(
				/** @type {string} */ (this._valueAsString),
				"utf8",
			);
			if (isDualStringBufferCachingEnabled()) {
				this._valueAsBuffer = value;
			}
			return value;
		}
		return this._valueAsBuffer;
	}

	/**
	 * @returns {SourceValue} source
	 */
	source() {
		if (this._valueAsString === undefined) {
			const value =
				/** @type {Buffer} */
				(this._valueAsBuffer).toString("utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._valueAsString = value;
			}
			return value;
		}
		return this._valueAsString;
	}

	/**
	 * @private
	 * @returns {undefined | Buffer} buffer
	 */
	_originalSourceBuffer() {
		if (this._originalSourceAsBuffer === undefined && this._hasOriginalSource) {
			const value = Buffer.from(
				/** @type {string} */
				(this._originalSourceAsString),
				"utf8",
			);
			if (isDualStringBufferCachingEnabled()) {
				this._originalSourceAsBuffer = value;
			}
			return value;
		}
		return this._originalSourceAsBuffer;
	}

	_originalSourceString() {
		if (this._originalSourceAsString === undefined && this._hasOriginalSource) {
			const value =
				/** @type {Buffer} */
				(this._originalSourceAsBuffer).toString("utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._originalSourceAsString = value;
			}
			return value;
		}
		return this._originalSourceAsString;
	}

	_innerSourceMapObject() {
		if (this._innerSourceMapAsObject === undefined && this._hasInnerSourceMap) {
			const value = JSON.parse(this._innerSourceMapString());
			if (isDualStringBufferCachingEnabled()) {
				this._innerSourceMapAsObject = value;
			}
			return value;
		}
		return this._innerSourceMapAsObject;
	}

	_innerSourceMapBuffer() {
		if (this._innerSourceMapAsBuffer === undefined && this._hasInnerSourceMap) {
			const value = Buffer.from(this._innerSourceMapString(), "utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._innerSourceMapAsBuffer = value;
			}
			return value;
		}
		return this._innerSourceMapAsBuffer;
	}

	/**
	 * @private
	 * @returns {string} result
	 */
	_innerSourceMapString() {
		if (this._innerSourceMapAsString === undefined && this._hasInnerSourceMap) {
			if (this._innerSourceMapAsBuffer !== undefined) {
				const value = this._innerSourceMapAsBuffer.toString("utf8");
				if (isDualStringBufferCachingEnabled()) {
					this._innerSourceMapAsString = value;
				}
				return value;
			}
			const value = JSON.stringify(this._innerSourceMapAsObject);
			if (isDualStringBufferCachingEnabled()) {
				this._innerSourceMapAsString = value;
			}
			return value;
		}
		return /** @type {string} */ (this._innerSourceMapAsString);
	}

	_sourceMapObject() {
		if (this._sourceMapAsObject === undefined) {
			const value = JSON.parse(this._sourceMapString());
			if (isDualStringBufferCachingEnabled()) {
				this._sourceMapAsObject = value;
			}
			return value;
		}
		return this._sourceMapAsObject;
	}

	_sourceMapBuffer() {
		if (this._sourceMapAsBuffer === undefined) {
			const value = Buffer.from(this._sourceMapString(), "utf8");
			if (isDualStringBufferCachingEnabled()) {
				this._sourceMapAsBuffer = value;
			}
			return value;
		}
		return this._sourceMapAsBuffer;
	}

	_sourceMapString() {
		if (this._sourceMapAsString === undefined) {
			if (this._sourceMapAsBuffer !== undefined) {
				const value = this._sourceMapAsBuffer.toString("utf8");
				if (isDualStringBufferCachingEnabled()) {
					this._sourceMapAsString = value;
				}
				return value;
			}
			const value = JSON.stringify(this._sourceMapAsObject);
			if (isDualStringBufferCachingEnabled()) {
				this._sourceMapAsString = value;
			}
			return value;
		}
		return this._sourceMapAsString;
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {RawSourceMap | null} map
	 */
	map(options) {
		if (!this._hasInnerSourceMap) {
			return this._sourceMapObject();
		}
		return getMap(this, options);
	}

	/**
	 * @param {MapOptions=} options map options
	 * @returns {SourceAndMap} source and map
	 */
	sourceAndMap(options) {
		if (!this._hasInnerSourceMap) {
			return {
				source: this.source(),
				map: this._sourceMapObject(),
			};
		}
		return getSourceAndMap(this, options);
	}

	/**
	 * @param {Options} options options
	 * @param {OnChunk} onChunk called for each chunk of code
	 * @param {OnSource} onSource called for each source
	 * @param {OnName} onName called for each name
	 * @returns {GeneratedSourceInfo} generated source info
	 */
	streamChunks(options, onChunk, onSource, onName) {
		if (this._hasInnerSourceMap) {
			return streamChunksOfCombinedSourceMap(
				/** @type {string} */
				(this.source()),
				this._sourceMapObject(),
				this._name,
				/** @type {string} */
				(this._originalSourceString()),
				this._innerSourceMapObject(),
				this._removeOriginalSource,
				onChunk,
				onSource,
				onName,
				Boolean(options && options.finalSource),
				Boolean(options && options.columns !== false),
			);
		}
		return streamChunksOfSourceMap(
			/** @type {string} */
			(this.source()),
			this._sourceMapObject(),
			onChunk,
			onSource,
			onName,
			Boolean(options && options.finalSource),
			Boolean(options && options.columns !== false),
		);
	}

	/**
	 * @param {HashLike} hash hash
	 * @returns {void}
	 */
	updateHash(hash) {
		hash.update("SourceMapSource");
		hash.update(this.buffer());
		hash.update(this._sourceMapBuffer());

		if (this._hasOriginalSource) {
			hash.update(
				/** @type {Buffer} */
				(this._originalSourceBuffer()),
			);
		}

		if (this._hasInnerSourceMap) {
			hash.update(
				/** @type {Buffer} */
				(this._innerSourceMapBuffer()),
			);
		}

		hash.update(this._removeOriginalSource ? "true" : "false");
	}
}

module.exports = SourceMapSource;


/***/ }),

/***/ 294:
/***/ ((module) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



/**
 * @callback MappingsSerializer
 * @param {number} generatedLine generated line
 * @param {number} generatedColumn generated column
 * @param {number} sourceIndex source index
 * @param {number} originalLine original line
 * @param {number} originalColumn generated line
 * @param {number} nameIndex generated line
 * @returns {string} result
 */

const ALPHABET = [
	..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
];

const CONTINUATION_BIT = 0x20;

const createFullMappingsSerializer = () => {
	let currentLine = 1;
	let currentColumn = 0;
	let currentSourceIndex = 0;
	let currentOriginalLine = 1;
	let currentOriginalColumn = 0;
	let currentNameIndex = 0;
	let activeMapping = false;
	let activeName = false;
	let initial = true;
	/** @type {MappingsSerializer} */
	return (
		generatedLine,
		generatedColumn,
		sourceIndex,
		originalLine,
		originalColumn,
		nameIndex,
	) => {
		if (activeMapping && currentLine === generatedLine) {
			// A mapping is still active
			if (
				sourceIndex === currentSourceIndex &&
				originalLine === currentOriginalLine &&
				originalColumn === currentOriginalColumn &&
				!activeName &&
				nameIndex < 0
			) {
				// avoid repeating the same original mapping
				return "";
			}
		}
		// No mapping is active
		else if (sourceIndex < 0) {
			// avoid writing unneccessary generated mappings
			return "";
		}

		/** @type {undefined | string} */
		let str;
		if (currentLine < generatedLine) {
			str = ";".repeat(generatedLine - currentLine);
			currentLine = generatedLine;
			currentColumn = 0;
			initial = false;
		} else if (initial) {
			str = "";
			initial = false;
		} else {
			str = ",";
		}

		/**
		 * @param {number} value value
		 * @returns {void}
		 */
		const writeValue = (value) => {
			const sign = (value >>> 31) & 1;
			const mask = value >> 31;
			const absValue = (value + mask) ^ mask;
			let data = (absValue << 1) | sign;
			for (;;) {
				const sextet = data & 0x1f;
				data >>= 5;
				if (data === 0) {
					str += ALPHABET[sextet];
					break;
				} else {
					str += ALPHABET[sextet | CONTINUATION_BIT];
				}
			}
		};
		writeValue(generatedColumn - currentColumn);
		currentColumn = generatedColumn;
		if (sourceIndex >= 0) {
			activeMapping = true;
			if (sourceIndex === currentSourceIndex) {
				str += "A";
			} else {
				writeValue(sourceIndex - currentSourceIndex);
				currentSourceIndex = sourceIndex;
			}
			writeValue(originalLine - currentOriginalLine);
			currentOriginalLine = originalLine;
			if (originalColumn === currentOriginalColumn) {
				str += "A";
			} else {
				writeValue(originalColumn - currentOriginalColumn);
				currentOriginalColumn = originalColumn;
			}
			if (nameIndex >= 0) {
				writeValue(nameIndex - currentNameIndex);
				currentNameIndex = nameIndex;
				activeName = true;
			} else {
				activeName = false;
			}
		} else {
			activeMapping = false;
		}
		return str;
	};
};

const createLinesOnlyMappingsSerializer = () => {
	let lastWrittenLine = 0;
	let currentLine = 1;
	let currentSourceIndex = 0;
	let currentOriginalLine = 1;
	/** @type {MappingsSerializer} */
	return (
		generatedLine,
		_generatedColumn,
		sourceIndex,
		originalLine,
		_originalColumn,
		_nameIndex,
	) => {
		if (sourceIndex < 0) {
			// avoid writing generated mappings at all
			return "";
		}
		if (lastWrittenLine === generatedLine) {
			// avoid writing multiple original mappings per line
			return "";
		}
		/** @type {undefined | string} */
		let str;
		/**
		 * @param {number} value value
		 * @returns {void}
		 */
		const writeValue = (value) => {
			const sign = (value >>> 31) & 1;
			const mask = value >> 31;
			const absValue = (value + mask) ^ mask;
			let data = (absValue << 1) | sign;
			for (;;) {
				const sextet = data & 0x1f;
				data >>= 5;
				if (data === 0) {
					str += ALPHABET[sextet];
					break;
				} else {
					str += ALPHABET[sextet | CONTINUATION_BIT];
				}
			}
		};
		lastWrittenLine = generatedLine;
		if (generatedLine === currentLine + 1) {
			currentLine = generatedLine;
			if (sourceIndex === currentSourceIndex) {
				if (originalLine === currentOriginalLine + 1) {
					currentOriginalLine = originalLine;
					return ";AACA";
				}
				str = ";AA";
				writeValue(originalLine - currentOriginalLine);
				currentOriginalLine = originalLine;
				return `${str}A`;
			}
			str = ";A";
			writeValue(sourceIndex - currentSourceIndex);
			currentSourceIndex = sourceIndex;
			writeValue(originalLine - currentOriginalLine);
			currentOriginalLine = originalLine;
			return `${str}A`;
		}
		str = ";".repeat(generatedLine - currentLine);
		currentLine = generatedLine;
		if (sourceIndex === currentSourceIndex) {
			if (originalLine === currentOriginalLine + 1) {
				currentOriginalLine = originalLine;
				return `${str}AACA`;
			}
			str += "AA";
			writeValue(originalLine - currentOriginalLine);
			currentOriginalLine = originalLine;
			return `${str}A`;
		}
		str += "A";
		writeValue(sourceIndex - currentSourceIndex);
		currentSourceIndex = sourceIndex;
		writeValue(originalLine - currentOriginalLine);
		currentOriginalLine = originalLine;
		return `${str}A`;
	};
};

/**
 * @param {{ columns?: boolean }=} options options
 * @returns {MappingsSerializer} mappings serializer
 */
const createMappingsSerializer = (options) => {
	const linesOnly = options && options.columns === false;
	return linesOnly
		? createLinesOnlyMappingsSerializer()
		: createFullMappingsSerializer();
};

module.exports = createMappingsSerializer;


/***/ }),

/***/ 875:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const createMappingsSerializer = __nccwpck_require__(294);

/** @typedef {import("../Source").RawSourceMap} RawSourceMap */
/** @typedef {import("../Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./streamChunks").Options} Options */
/** @typedef {import("./streamChunks").StreamChunksFunction} StreamChunksFunction */

/** @typedef {{ streamChunks: StreamChunksFunction }} SourceLikeWithStreamChunks */

/**
 * @param {SourceLikeWithStreamChunks} inputSource input source
 * @param {Options=} options options
 * @returns {SourceAndMap} map
 */
module.exports.getSourceAndMap = (inputSource, options) => {
	let code = "";
	let mappings = "";
	/** @type {(string | null)[]} */
	const potentialSources = [];
	/** @type {(string | null)[]} */
	const potentialSourcesContent = [];
	/** @type {(string | null)[]} */
	const potentialNames = [];
	const addMapping = createMappingsSerializer(options);
	const { source } = inputSource.streamChunks(
		{ ...options, finalSource: true },
		(
			chunk,
			generatedLine,
			generatedColumn,
			sourceIndex,
			originalLine,
			originalColumn,
			nameIndex,
		) => {
			if (chunk !== undefined) code += chunk;
			mappings += addMapping(
				generatedLine,
				generatedColumn,
				sourceIndex,
				originalLine,
				originalColumn,
				nameIndex,
			);
		},
		(sourceIndex, source, sourceContent) => {
			while (potentialSources.length < sourceIndex) {
				potentialSources.push(null);
			}
			potentialSources[sourceIndex] = source;
			if (sourceContent !== undefined) {
				while (potentialSourcesContent.length < sourceIndex) {
					potentialSourcesContent.push(null);
				}
				potentialSourcesContent[sourceIndex] = sourceContent;
			}
		},
		(nameIndex, name) => {
			while (potentialNames.length < nameIndex) {
				potentialNames.push(null);
			}
			potentialNames[nameIndex] = name;
		},
	);
	return {
		source: source !== undefined ? source : code,
		map:
			mappings.length > 0
				? {
						version: 3,
						file: "x",
						mappings,
						// We handle broken sources as `null`, in spec this field should be string, but no information what we should do in such cases if we change type it will be breaking change
						sources: /** @type {string[]} */ (potentialSources),
						sourcesContent:
							potentialSourcesContent.length > 0
								? /** @type {string[]} */ (potentialSourcesContent)
								: undefined,
						names: /** @type {string[]} */ (potentialNames),
					}
				: null,
	};
};

/**
 * @param {SourceLikeWithStreamChunks} source source
 * @param {Options=} options options
 * @returns {RawSourceMap | null} map
 */
module.exports.getMap = (source, options) => {
	let mappings = "";
	/** @type {(string | null)[]} */
	const potentialSources = [];
	/** @type {(string | null)[]} */
	const potentialSourcesContent = [];
	/** @type {(string | null)[]} */
	const potentialNames = [];
	const addMapping = createMappingsSerializer(options);
	source.streamChunks(
		{ ...options, source: false, finalSource: true },
		(
			chunk,
			generatedLine,
			generatedColumn,
			sourceIndex,
			originalLine,
			originalColumn,
			nameIndex,
		) => {
			mappings += addMapping(
				generatedLine,
				generatedColumn,
				sourceIndex,
				originalLine,
				originalColumn,
				nameIndex,
			);
		},
		(sourceIndex, source, sourceContent) => {
			while (potentialSources.length < sourceIndex) {
				potentialSources.push(null);
			}
			potentialSources[sourceIndex] = source;
			if (sourceContent !== undefined) {
				while (potentialSourcesContent.length < sourceIndex) {
					potentialSourcesContent.push(null);
				}
				potentialSourcesContent[sourceIndex] = sourceContent;
			}
		},
		(nameIndex, name) => {
			while (potentialNames.length < nameIndex) {
				potentialNames.push(null);
			}
			potentialNames[nameIndex] = name;
		},
	);
	return mappings.length > 0
		? {
				version: 3,
				file: "x",
				mappings,
				// We handle broken sources as `null`, in spec this field should be string, but no information what we should do in such cases if we change type it will be breaking change
				sources: /** @type {string[]} */ (potentialSources),
				sourcesContent:
					potentialSourcesContent.length > 0
						? /** @type {string[]} */ (potentialSourcesContent)
						: undefined,
				names: /** @type {string[]} */ (potentialNames),
			}
		: null;
};


/***/ }),

/***/ 517:
/***/ ((module) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const CHAR_CODE_NEW_LINE = "\n".charCodeAt(0);

/**
 * @typedef {object} GeneratedSourceInfo
 * @property {number=} generatedLine generated line
 * @property {number=} generatedColumn generated column
 * @property {string=} source source
 */

/**
 * @param {string | undefined} source source
 * @returns {GeneratedSourceInfo} source info
 */
const getGeneratedSourceInfo = (source) => {
	if (source === undefined) {
		return {};
	}
	const lastLineStart = source.lastIndexOf("\n");
	if (lastLineStart === -1) {
		return {
			generatedLine: 1,
			generatedColumn: source.length,
			source,
		};
	}
	let generatedLine = 2;
	for (let i = 0; i < lastLineStart; i++) {
		if (source.charCodeAt(i) === CHAR_CODE_NEW_LINE) generatedLine++;
	}
	return {
		generatedLine,
		generatedColumn: source.length - lastLineStart - 1,
		source,
	};
};

module.exports = getGeneratedSourceInfo;


/***/ }),

/***/ 432:
/***/ ((module) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



/** @typedef {import("../Source").RawSourceMap} RawSourceMap */

/**
 * @param {RawSourceMap} sourceMap source map
 * @param {number} index index
 * @returns {string | null} name
 */
const getSource = (sourceMap, index) => {
	if (index < 0) return null;
	const { sourceRoot, sources } = sourceMap;
	const source = sources[index];
	if (!sourceRoot) return source;
	if (sourceRoot.endsWith("/")) return sourceRoot + source;
	return `${sourceRoot}/${source}`;
};

module.exports = getSource;


/***/ }),

/***/ 950:
/***/ ((module) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const ALPHABET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const CONTINUATION_BIT = 0x20;
const END_SEGMENT_BIT = 0x40;
const NEXT_LINE = END_SEGMENT_BIT | 0x01;
const INVALID = END_SEGMENT_BIT | 0x02;
const DATA_MASK = 0x1f;

const ccToValue = new Uint8Array("z".charCodeAt(0) + 1);

ccToValue.fill(INVALID);

for (let i = 0; i < ALPHABET.length; i++) {
	ccToValue[ALPHABET.charCodeAt(i)] = i;
}

ccToValue[",".charCodeAt(0)] = END_SEGMENT_BIT;
ccToValue[";".charCodeAt(0)] = NEXT_LINE;

const ccMax = ccToValue.length - 1;

/** @typedef {(generatedLine: number, generatedColumn: number, sourceIndex: number, originalLine: number, originalColumn: number, nameIndex: number) => void} OnMapping */

/**
 * @param {string} mappings the mappings string
 * @param {OnMapping} onMapping called for each mapping
 * @returns {void}
 */
const readMappings = (mappings, onMapping) => {
	// generatedColumn, [sourceIndex, originalLine, orignalColumn, [nameIndex]]
	const currentData = new Uint32Array([0, 0, 1, 0, 0]);
	let currentDataPos = 0;
	// currentValue will include a sign bit at bit 0
	let currentValue = 0;
	let currentValuePos = 0;
	let generatedLine = 1;
	let generatedColumn = -1;
	for (let i = 0; i < mappings.length; i++) {
		const cc = mappings.charCodeAt(i);
		if (cc > ccMax) continue;
		const value = ccToValue[cc];
		if ((value & END_SEGMENT_BIT) !== 0) {
			// End current segment
			if (currentData[0] > generatedColumn) {
				if (currentDataPos === 1) {
					onMapping(generatedLine, currentData[0], -1, -1, -1, -1);
				} else if (currentDataPos === 4) {
					onMapping(
						generatedLine,
						currentData[0],
						currentData[1],
						currentData[2],
						currentData[3],
						-1,
					);
				} else if (currentDataPos === 5) {
					onMapping(
						generatedLine,
						currentData[0],
						currentData[1],
						currentData[2],
						currentData[3],
						currentData[4],
					);
				}
				[generatedColumn] = currentData;
			}
			currentDataPos = 0;
			if (value === NEXT_LINE) {
				// Start new line
				generatedLine++;
				currentData[0] = 0;
				generatedColumn = -1;
			}
		} else if ((value & CONTINUATION_BIT) === 0) {
			// last sextet
			currentValue |= value << currentValuePos;
			const finalValue =
				currentValue & 1 ? -(currentValue >> 1) : currentValue >> 1;
			currentData[currentDataPos++] += finalValue;
			currentValuePos = 0;
			currentValue = 0;
		} else {
			currentValue |= (value & DATA_MASK) << currentValuePos;
			currentValuePos += 5;
		}
	}
	// End current segment
	if (currentDataPos === 1) {
		onMapping(generatedLine, currentData[0], -1, -1, -1, -1);
	} else if (currentDataPos === 4) {
		onMapping(
			generatedLine,
			currentData[0],
			currentData[1],
			currentData[2],
			currentData[3],
			-1,
		);
	} else if (currentDataPos === 5) {
		onMapping(
			generatedLine,
			currentData[0],
			currentData[1],
			currentData[2],
			currentData[3],
			currentData[4],
		);
	}
};

module.exports = readMappings;


/***/ }),

/***/ 492:
/***/ ((module) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



/**
 * @param {string} str string
 * @returns {string[]} array of string separated by lines
 */
const splitIntoLines = (str) => {
	const results = [];
	const len = str.length;
	let i = 0;
	while (i < len) {
		const cc = str.charCodeAt(i);
		// 10 is "\n".charCodeAt(0)
		if (cc === 10) {
			results.push("\n");
			i++;
		} else {
			let j = i + 1;
			// 10 is "\n".charCodeAt(0)
			while (j < len && str.charCodeAt(j) !== 10) j++;
			results.push(str.slice(i, j + 1));
			i = j + 1;
		}
	}
	return results;
};

module.exports = splitIntoLines;


/***/ }),

/***/ 403:
/***/ ((module) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



// \n = 10
// ; = 59
// { = 123
// } = 125
// <space> = 32
// \r = 13
// \t = 9

/**
 * @param {string} str string
 * @returns {string[] | null} array of string separated by potential tokens
 */
const splitIntoPotentialTokens = (str) => {
	const len = str.length;
	if (len === 0) return null;
	const results = [];
	let i = 0;
	while (i < len) {
		const start = i;
		block: {
			let cc = str.charCodeAt(i);
			while (cc !== 10 && cc !== 59 && cc !== 123 && cc !== 125) {
				if (++i >= len) break block;
				cc = str.charCodeAt(i);
			}
			while (
				cc === 59 ||
				cc === 32 ||
				cc === 123 ||
				cc === 125 ||
				cc === 13 ||
				cc === 9
			) {
				if (++i >= len) break block;
				cc = str.charCodeAt(i);
			}
			if (cc === 10) {
				i++;
			}
		}
		results.push(str.slice(start, i));
	}
	return results;
};

module.exports = splitIntoPotentialTokens;


/***/ }),

/***/ 334:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const createMappingsSerializer = __nccwpck_require__(294);
const streamChunks = __nccwpck_require__(779);

/** @typedef {import("../Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./streamChunks").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./streamChunks").OnChunk} OnChunk */
/** @typedef {import("./streamChunks").OnName} OnName */
/** @typedef {import("./streamChunks").OnSource} OnSource */
/** @typedef {import("./streamChunks").Options} Options */
/** @typedef {import("./streamChunks").SourceMaybeWithStreamChunksFunction} SourceMaybeWithStreamChunksFunction */

/**
 * @param {SourceMaybeWithStreamChunksFunction} inputSource input source
 * @param {Options} options options
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} onName on name
 * @returns {{ result: GeneratedSourceInfo, source: string, map: RawSourceMap | null }} result
 */
const streamAndGetSourceAndMap = (
	inputSource,
	options,
	onChunk,
	onSource,
	onName,
) => {
	let code = "";
	let mappings = "";
	/** @type {(string | null)[]} */
	const potentialSources = [];
	/** @type {(string | null)[]} */
	const potentialSourcesContent = [];
	/** @type {(string | null)[]} */
	const potentialNames = [];
	const addMapping = createMappingsSerializer({ ...options, columns: true });
	const finalSource = Boolean(options && options.finalSource);
	const { generatedLine, generatedColumn, source } = streamChunks(
		inputSource,
		options,
		(
			chunk,
			generatedLine,
			generatedColumn,
			sourceIndex,
			originalLine,
			originalColumn,
			nameIndex,
		) => {
			if (chunk !== undefined) code += chunk;
			mappings += addMapping(
				generatedLine,
				generatedColumn,
				sourceIndex,
				originalLine,
				originalColumn,
				nameIndex,
			);
			return onChunk(
				finalSource ? undefined : chunk,
				generatedLine,
				generatedColumn,
				sourceIndex,
				originalLine,
				originalColumn,
				nameIndex,
			);
		},
		(sourceIndex, source, sourceContent) => {
			while (potentialSources.length < sourceIndex) {
				potentialSources.push(null);
			}
			potentialSources[sourceIndex] = source;
			if (sourceContent !== undefined) {
				while (potentialSourcesContent.length < sourceIndex) {
					potentialSourcesContent.push(null);
				}
				potentialSourcesContent[sourceIndex] = sourceContent;
			}
			return onSource(sourceIndex, source, sourceContent);
		},
		(nameIndex, name) => {
			while (potentialNames.length < nameIndex) {
				potentialNames.push(null);
			}
			potentialNames[nameIndex] = name;
			return onName(nameIndex, name);
		},
	);
	const resultSource = source !== undefined ? source : code;

	return {
		result: {
			generatedLine,
			generatedColumn,
			source: finalSource ? resultSource : undefined,
		},
		source: resultSource,
		map:
			mappings.length > 0
				? {
						version: 3,
						file: "x",
						mappings,
						// We handle broken sources as `null`, in spec this field should be string, but no information what we should do in such cases if we change type it will be breaking change
						sources: /** @type {string[]} */ (potentialSources),
						sourcesContent:
							potentialSourcesContent.length > 0
								? /** @type {string[]} */ (potentialSourcesContent)
								: undefined,
						names: /** @type {string[]} */ (potentialNames),
					}
				: null,
	};
};

module.exports = streamAndGetSourceAndMap;


/***/ }),

/***/ 779:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const streamChunksOfRawSource = __nccwpck_require__(771);
const streamChunksOfSourceMap = __nccwpck_require__(105);

/** @typedef {import("../Source")} Source */
/** @typedef {import("./getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {(chunk: string | undefined, generatedLine: number, generatedColumn: number, sourceIndex: number, originalLine: number, originalColumn: number, nameIndex: number) => void} OnChunk */
/** @typedef {(sourceIndex: number, source: string | null, sourceContent: string | undefined) => void} OnSource */
/** @typedef {(nameIndex: number, name: string) => void} OnName */

/** @typedef {{ source?: boolean, finalSource?: boolean, columns?: boolean }} Options */

/**
 * @callback StreamChunksFunction
 * @param {Options} options options
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} onName on name
 */

/** @typedef {Source & { streamChunks?: StreamChunksFunction }} SourceMaybeWithStreamChunksFunction */

/**
 * @param {SourceMaybeWithStreamChunksFunction} source source
 * @param {Options} options options
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} onName on name
 * @returns {GeneratedSourceInfo} generated source info
 */
module.exports = (source, options, onChunk, onSource, onName) => {
	if (typeof source.streamChunks === "function") {
		return source.streamChunks(options, onChunk, onSource, onName);
	}
	const sourceAndMap = source.sourceAndMap(options);
	if (sourceAndMap.map) {
		return streamChunksOfSourceMap(
			/** @type {string} */
			(sourceAndMap.source),
			sourceAndMap.map,
			onChunk,
			onSource,
			onName,
			Boolean(options && options.finalSource),
			Boolean(options && options.columns !== false),
		);
	}
	return streamChunksOfRawSource(
		/** @type {string} */
		(sourceAndMap.source),
		onChunk,
		onSource,
		onName,
		Boolean(options && options.finalSource),
	);
};


/***/ }),

/***/ 132:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const splitIntoLines = __nccwpck_require__(492);
const streamChunksOfSourceMap = __nccwpck_require__(105);

/** @typedef {import("../Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./streamChunks").OnChunk} onChunk */
/** @typedef {import("./streamChunks").OnName} OnName */
/** @typedef {import("./streamChunks").OnSource} OnSource */

/**
 * @param {string} source source
 * @param {RawSourceMap} sourceMap source map
 * @param {string} innerSourceName inner source name
 * @param {string} innerSource inner source
 * @param {RawSourceMap} innerSourceMap inner source map
 * @param {boolean | undefined} removeInnerSource do remove inner source
 * @param {onChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} onName on name
 * @param {boolean} finalSource finalSource
 * @param {boolean} columns columns
 * @returns {GeneratedSourceInfo} generated source info
 */
const streamChunksOfCombinedSourceMap = (
	source,
	sourceMap,
	innerSourceName,
	innerSource,
	innerSourceMap,
	removeInnerSource,
	onChunk,
	onSource,
	onName,
	finalSource,
	columns,
) => {
	/** @type {Map<string | null, number>} */
	const sourceMapping = new Map();
	/** @type {Map<string, number>} */
	const nameMapping = new Map();
	/** @type {number[]} */
	const sourceIndexMapping = [];
	/** @type {number[]} */
	const nameIndexMapping = [];
	/** @type {string[]} */
	const nameIndexValueMapping = [];
	let outerSourceIndex = -2;
	/** @type {number[]} */
	const innerSourceIndexMapping = [];
	/** @type {[string | null, string | undefined][]} */
	const innerSourceIndexValueMapping = [];
	/** @type {(string | undefined)[]} */
	const innerSourceContents = [];
	/** @type {(null | undefined | string[])[]} */
	const innerSourceContentLines = [];
	/** @type {number[]} */
	const innerNameIndexMapping = [];
	/** @type {string[]} */
	const innerNameIndexValueMapping = [];
	/** @typedef {[number, number, number, number, number] | number[]} MappingsData */
	/** @type {{ chunks: string[], mappingsData: MappingsData }[]} */
	const innerSourceMapLineData = [];
	/**
	 * @param {number} line line
	 * @param {number} column column
	 * @returns {number} result
	 */
	const findInnerMapping = (line, column) => {
		if (line > innerSourceMapLineData.length) return -1;
		const { mappingsData } = innerSourceMapLineData[line - 1];
		let l = 0;
		let r = mappingsData.length / 5;
		while (l < r) {
			const m = (l + r) >> 1;
			if (mappingsData[m * 5] <= column) {
				l = m + 1;
			} else {
				r = m;
			}
		}
		if (l === 0) return -1;
		return l - 1;
	};
	return streamChunksOfSourceMap(
		source,
		sourceMap,
		(
			chunk,
			generatedLine,
			generatedColumn,
			sourceIndex,
			originalLine,
			originalColumn,
			nameIndex,
		) => {
			// Check if this is a mapping to the inner source
			if (sourceIndex === outerSourceIndex) {
				// Check if there is a mapping in the inner source
				const idx = findInnerMapping(originalLine, originalColumn);
				if (idx !== -1) {
					const { chunks, mappingsData } =
						innerSourceMapLineData[originalLine - 1];
					const mi = idx * 5;
					const innerSourceIndex = mappingsData[mi + 1];
					const innerOriginalLine = mappingsData[mi + 2];
					let innerOriginalColumn = mappingsData[mi + 3];
					let innerNameIndex = mappingsData[mi + 4];
					if (innerSourceIndex >= 0) {
						// Check for an identity mapping
						// where we are allowed to adjust the original column
						const innerChunk = chunks[idx];
						const innerGeneratedColumn = mappingsData[mi];
						const locationInChunk = originalColumn - innerGeneratedColumn;
						if (locationInChunk > 0) {
							let originalSourceLines =
								innerSourceIndex < innerSourceContentLines.length
									? innerSourceContentLines[innerSourceIndex]
									: null;
							if (originalSourceLines === undefined) {
								const originalSource = innerSourceContents[innerSourceIndex];
								originalSourceLines = originalSource
									? splitIntoLines(originalSource)
									: null;
								innerSourceContentLines[innerSourceIndex] = originalSourceLines;
							}
							if (originalSourceLines !== null) {
								const originalChunk =
									innerOriginalLine <= originalSourceLines.length
										? originalSourceLines[innerOriginalLine - 1].slice(
												innerOriginalColumn,
												innerOriginalColumn + locationInChunk,
											)
										: "";
								if (innerChunk.slice(0, locationInChunk) === originalChunk) {
									innerOriginalColumn += locationInChunk;
									innerNameIndex = -1;
								}
							}
						}

						// We have a inner mapping to original source

						// emit source when needed and compute global source index
						let sourceIndex =
							innerSourceIndex < innerSourceIndexMapping.length
								? innerSourceIndexMapping[innerSourceIndex]
								: -2;
						if (sourceIndex === -2) {
							const [source, sourceContent] =
								innerSourceIndex < innerSourceIndexValueMapping.length
									? innerSourceIndexValueMapping[innerSourceIndex]
									: [null, undefined];
							let globalIndex = sourceMapping.get(source);
							if (globalIndex === undefined) {
								sourceMapping.set(source, (globalIndex = sourceMapping.size));
								onSource(globalIndex, source, sourceContent);
							}
							sourceIndex = globalIndex;
							innerSourceIndexMapping[innerSourceIndex] = sourceIndex;
						}

						// emit name when needed and compute global name index
						let finalNameIndex = -1;
						if (innerNameIndex >= 0) {
							// when we have a inner name
							finalNameIndex =
								innerNameIndex < innerNameIndexMapping.length
									? innerNameIndexMapping[innerNameIndex]
									: -2;
							if (finalNameIndex === -2) {
								const name =
									innerNameIndex < innerNameIndexValueMapping.length
										? innerNameIndexValueMapping[innerNameIndex]
										: undefined;
								if (name) {
									let globalIndex = nameMapping.get(name);
									if (globalIndex === undefined) {
										nameMapping.set(name, (globalIndex = nameMapping.size));
										onName(globalIndex, name);
									}
									finalNameIndex = globalIndex;
								} else {
									finalNameIndex = -1;
								}
								innerNameIndexMapping[innerNameIndex] = finalNameIndex;
							}
						} else if (nameIndex >= 0) {
							// when we don't have an inner name,
							// but we have an outer name
							// it can be used when inner original code equals to the name
							let originalSourceLines =
								innerSourceContentLines[innerSourceIndex];
							if (originalSourceLines === undefined) {
								const originalSource = innerSourceContents[innerSourceIndex];
								originalSourceLines = originalSource
									? splitIntoLines(originalSource)
									: null;
								innerSourceContentLines[innerSourceIndex] = originalSourceLines;
							}
							if (originalSourceLines !== null) {
								const name = nameIndexValueMapping[nameIndex];
								const originalName =
									innerOriginalLine <= originalSourceLines.length
										? originalSourceLines[innerOriginalLine - 1].slice(
												innerOriginalColumn,
												innerOriginalColumn + name.length,
											)
										: "";
								if (name === originalName) {
									finalNameIndex =
										nameIndex < nameIndexMapping.length
											? nameIndexMapping[nameIndex]
											: -2;
									if (finalNameIndex === -2) {
										const name = nameIndexValueMapping[nameIndex];
										if (name) {
											let globalIndex = nameMapping.get(name);
											if (globalIndex === undefined) {
												nameMapping.set(name, (globalIndex = nameMapping.size));
												onName(globalIndex, name);
											}
											finalNameIndex = globalIndex;
										} else {
											finalNameIndex = -1;
										}
										nameIndexMapping[nameIndex] = finalNameIndex;
									}
								}
							}
						}
						onChunk(
							chunk,
							generatedLine,
							generatedColumn,
							sourceIndex,
							innerOriginalLine,
							innerOriginalColumn,
							finalNameIndex,
						);
						return;
					}
				}

				// We have a mapping to the inner source, but no inner mapping
				if (removeInnerSource) {
					onChunk(chunk, generatedLine, generatedColumn, -1, -1, -1, -1);
					return;
				}
				if (sourceIndexMapping[sourceIndex] === -2) {
					let globalIndex = sourceMapping.get(innerSourceName);
					if (globalIndex === undefined) {
						sourceMapping.set(source, (globalIndex = sourceMapping.size));
						onSource(globalIndex, innerSourceName, innerSource);
					}
					sourceIndexMapping[sourceIndex] = globalIndex;
				}
			}

			const finalSourceIndex =
				sourceIndex < 0 || sourceIndex >= sourceIndexMapping.length
					? -1
					: sourceIndexMapping[sourceIndex];
			if (finalSourceIndex < 0) {
				// no source, so we make it a generated chunk
				onChunk(chunk, generatedLine, generatedColumn, -1, -1, -1, -1);
			} else {
				// Pass through the chunk with mapping
				let finalNameIndex = -1;
				if (nameIndex >= 0 && nameIndex < nameIndexMapping.length) {
					finalNameIndex = nameIndexMapping[nameIndex];
					if (finalNameIndex === -2) {
						const name = nameIndexValueMapping[nameIndex];
						let globalIndex = nameMapping.get(name);
						if (globalIndex === undefined) {
							nameMapping.set(name, (globalIndex = nameMapping.size));
							onName(globalIndex, name);
						}
						finalNameIndex = globalIndex;
						nameIndexMapping[nameIndex] = finalNameIndex;
					}
				}
				onChunk(
					chunk,
					generatedLine,
					generatedColumn,
					finalSourceIndex,
					originalLine,
					originalColumn,
					finalNameIndex,
				);
			}
		},
		(i, source, sourceContent) => {
			if (source === innerSourceName) {
				outerSourceIndex = i;
				if (innerSource !== undefined) sourceContent = innerSource;
				else innerSource = /** @type {string} */ (sourceContent);
				sourceIndexMapping[i] = -2;
				streamChunksOfSourceMap(
					/** @type {string} */
					(sourceContent),
					innerSourceMap,
					(
						chunk,
						generatedLine,
						generatedColumn,
						sourceIndex,
						originalLine,
						originalColumn,
						nameIndex,
					) => {
						while (innerSourceMapLineData.length < generatedLine) {
							innerSourceMapLineData.push({
								mappingsData: [],
								chunks: [],
							});
						}
						const data = innerSourceMapLineData[generatedLine - 1];
						data.mappingsData.push(
							generatedColumn,
							sourceIndex,
							originalLine,
							originalColumn,
							nameIndex,
						);
						data.chunks.push(/** @type {string} */ (chunk));
					},
					(i, source, sourceContent) => {
						innerSourceContents[i] = sourceContent;
						innerSourceContentLines[i] = undefined;
						innerSourceIndexMapping[i] = -2;
						innerSourceIndexValueMapping[i] = [source, sourceContent];
					},
					(i, name) => {
						innerNameIndexMapping[i] = -2;
						innerNameIndexValueMapping[i] = name;
					},
					false,
					columns,
				);
			} else {
				let globalIndex = sourceMapping.get(source);
				if (globalIndex === undefined) {
					sourceMapping.set(source, (globalIndex = sourceMapping.size));
					onSource(globalIndex, source, sourceContent);
				}
				sourceIndexMapping[i] = globalIndex;
			}
		},
		(i, name) => {
			nameIndexMapping[i] = -2;
			nameIndexValueMapping[i] = name;
		},
		finalSource,
		columns,
	);
};

module.exports = streamChunksOfCombinedSourceMap;


/***/ }),

/***/ 771:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const getGeneratedSourceInfo = __nccwpck_require__(517);
const splitIntoLines = __nccwpck_require__(492);

/** @typedef {import("./getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./streamChunks").OnChunk} OnChunk */
/** @typedef {import("./streamChunks").OnName} OnName */
/** @typedef {import("./streamChunks").OnSource} OnSource */

/**
 * @param {string} source source
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} _onSource on source
 * @param {OnName} _onName on name
 * @returns {GeneratedSourceInfo} source info
 */
const streamChunksOfRawSource = (source, onChunk, _onSource, _onName) => {
	let line = 1;
	const matches = splitIntoLines(source);
	/** @type {undefined | string} */
	let match;
	for (match of matches) {
		onChunk(match, line, 0, -1, -1, -1, -1);
		line++;
	}
	return matches.length === 0 || /** @type {string} */ (match).endsWith("\n")
		? {
				generatedLine: matches.length + 1,
				generatedColumn: 0,
			}
		: {
				generatedLine: matches.length,
				generatedColumn: /** @type {string} */ (match).length,
			};
};

/**
 * @param {string} source source
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} onName on name
 * @param {boolean} finalSource is final source
 * @returns {GeneratedSourceInfo} source info
 */
module.exports = (source, onChunk, onSource, onName, finalSource) =>
	finalSource
		? getGeneratedSourceInfo(source)
		: streamChunksOfRawSource(source, onChunk, onSource, onName);


/***/ }),

/***/ 105:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



const getGeneratedSourceInfo = __nccwpck_require__(517);
const getSource = __nccwpck_require__(432);
const readMappings = __nccwpck_require__(950);
const splitIntoLines = __nccwpck_require__(492);

/** @typedef {import("../Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./streamChunks").OnChunk} OnChunk */
/** @typedef {import("./streamChunks").OnName} OnName */
/** @typedef {import("./streamChunks").OnSource} OnSource */

/**
 * @param {string} source source
 * @param {RawSourceMap} sourceMap source map
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} onName on name
 * @returns {GeneratedSourceInfo} generated source info
 */
const streamChunksOfSourceMapFull = (
	source,
	sourceMap,
	onChunk,
	onSource,
	onName,
) => {
	const lines = splitIntoLines(source);
	if (lines.length === 0) {
		return {
			generatedLine: 1,
			generatedColumn: 0,
		};
	}
	const { sources, sourcesContent, names, mappings } = sourceMap;
	for (let i = 0; i < sources.length; i++) {
		onSource(
			i,
			getSource(sourceMap, i),
			(sourcesContent && sourcesContent[i]) || undefined,
		);
	}
	if (names) {
		for (let i = 0; i < names.length; i++) {
			onName(i, names[i]);
		}
	}

	const lastLine = lines[lines.length - 1];
	const lastNewLine = lastLine.endsWith("\n");
	const finalLine = lastNewLine ? lines.length + 1 : lines.length;
	const finalColumn = lastNewLine ? 0 : lastLine.length;

	let currentGeneratedLine = 1;
	let currentGeneratedColumn = 0;

	let mappingActive = false;
	let activeMappingSourceIndex = -1;
	let activeMappingOriginalLine = -1;
	let activeMappingOriginalColumn = -1;
	let activeMappingNameIndex = -1;

	/**
	 * @param {number} generatedLine generated line
	 * @param {number} generatedColumn generated column
	 * @param {number} sourceIndex source index
	 * @param {number} originalLine original line
	 * @param {number} originalColumn original column
	 * @param {number} nameIndex name index
	 * @returns {void}
	 */
	const onMapping = (
		generatedLine,
		generatedColumn,
		sourceIndex,
		originalLine,
		originalColumn,
		nameIndex,
	) => {
		if (mappingActive && currentGeneratedLine <= lines.length) {
			let chunk;
			const mappingLine = currentGeneratedLine;
			const mappingColumn = currentGeneratedColumn;
			const line = lines[currentGeneratedLine - 1];
			if (generatedLine !== currentGeneratedLine) {
				chunk = line.slice(currentGeneratedColumn);
				currentGeneratedLine++;
				currentGeneratedColumn = 0;
			} else {
				chunk = line.slice(currentGeneratedColumn, generatedColumn);
				currentGeneratedColumn = generatedColumn;
			}
			if (chunk) {
				onChunk(
					chunk,
					mappingLine,
					mappingColumn,
					activeMappingSourceIndex,
					activeMappingOriginalLine,
					activeMappingOriginalColumn,
					activeMappingNameIndex,
				);
			}
			mappingActive = false;
		}
		if (generatedLine > currentGeneratedLine && currentGeneratedColumn > 0) {
			if (currentGeneratedLine <= lines.length) {
				const chunk = lines[currentGeneratedLine - 1].slice(
					currentGeneratedColumn,
				);
				onChunk(
					chunk,
					currentGeneratedLine,
					currentGeneratedColumn,
					-1,
					-1,
					-1,
					-1,
				);
			}
			currentGeneratedLine++;
			currentGeneratedColumn = 0;
		}
		while (generatedLine > currentGeneratedLine) {
			if (currentGeneratedLine <= lines.length) {
				onChunk(
					lines[currentGeneratedLine - 1],
					currentGeneratedLine,
					0,
					-1,
					-1,
					-1,
					-1,
				);
			}
			currentGeneratedLine++;
		}
		if (generatedColumn > currentGeneratedColumn) {
			if (currentGeneratedLine <= lines.length) {
				const chunk = lines[currentGeneratedLine - 1].slice(
					currentGeneratedColumn,
					generatedColumn,
				);
				onChunk(
					chunk,
					currentGeneratedLine,
					currentGeneratedColumn,
					-1,
					-1,
					-1,
					-1,
				);
			}
			currentGeneratedColumn = generatedColumn;
		}
		if (
			sourceIndex >= 0 &&
			(generatedLine < finalLine ||
				(generatedLine === finalLine && generatedColumn < finalColumn))
		) {
			mappingActive = true;
			activeMappingSourceIndex = sourceIndex;
			activeMappingOriginalLine = originalLine;
			activeMappingOriginalColumn = originalColumn;
			activeMappingNameIndex = nameIndex;
		}
	};
	readMappings(mappings, onMapping);
	onMapping(finalLine, finalColumn, -1, -1, -1, -1);
	return {
		generatedLine: finalLine,
		generatedColumn: finalColumn,
	};
};

/**
 * @param {string} source source
 * @param {RawSourceMap} sourceMap source map
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} _onName on name
 * @returns {GeneratedSourceInfo} generated source info
 */
const streamChunksOfSourceMapLinesFull = (
	source,
	sourceMap,
	onChunk,
	onSource,
	_onName,
) => {
	const lines = splitIntoLines(source);
	if (lines.length === 0) {
		return {
			generatedLine: 1,
			generatedColumn: 0,
		};
	}
	const { sources, sourcesContent, mappings } = sourceMap;
	for (let i = 0; i < sources.length; i++) {
		onSource(
			i,
			getSource(sourceMap, i),
			(sourcesContent && sourcesContent[i]) || undefined,
		);
	}

	let currentGeneratedLine = 1;

	/**
	 * @param {number} generatedLine generated line
	 * @param {number} _generatedColumn generated column
	 * @param {number} sourceIndex source index
	 * @param {number} originalLine original line
	 * @param {number} originalColumn original column
	 * @param {number} _nameIndex name index
	 * @returns {void}
	 */
	const onMapping = (
		generatedLine,
		_generatedColumn,
		sourceIndex,
		originalLine,
		originalColumn,
		_nameIndex,
	) => {
		if (
			sourceIndex < 0 ||
			generatedLine < currentGeneratedLine ||
			generatedLine > lines.length
		) {
			return;
		}
		while (generatedLine > currentGeneratedLine) {
			if (currentGeneratedLine <= lines.length) {
				onChunk(
					lines[currentGeneratedLine - 1],
					currentGeneratedLine,
					0,
					-1,
					-1,
					-1,
					-1,
				);
			}
			currentGeneratedLine++;
		}
		if (generatedLine <= lines.length) {
			onChunk(
				lines[generatedLine - 1],
				generatedLine,
				0,
				sourceIndex,
				originalLine,
				originalColumn,
				-1,
			);
			currentGeneratedLine++;
		}
	};
	readMappings(mappings, onMapping);
	for (; currentGeneratedLine <= lines.length; currentGeneratedLine++) {
		onChunk(
			lines[currentGeneratedLine - 1],
			currentGeneratedLine,
			0,
			-1,
			-1,
			-1,
			-1,
		);
	}

	const lastLine = lines[lines.length - 1];
	const lastNewLine = lastLine.endsWith("\n");

	const finalLine = lastNewLine ? lines.length + 1 : lines.length;
	const finalColumn = lastNewLine ? 0 : lastLine.length;

	return {
		generatedLine: finalLine,
		generatedColumn: finalColumn,
	};
};

/**
 * @param {string} source source
 * @param {RawSourceMap} sourceMap source map
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} onName on name
 * @returns {GeneratedSourceInfo} generated source info
 */
const streamChunksOfSourceMapFinal = (
	source,
	sourceMap,
	onChunk,
	onSource,
	onName,
) => {
	const result = getGeneratedSourceInfo(source);
	const { generatedLine: finalLine, generatedColumn: finalColumn } = result;

	if (finalLine === 1 && finalColumn === 0) return result;
	const { sources, sourcesContent, names, mappings } = sourceMap;
	for (let i = 0; i < sources.length; i++) {
		onSource(
			i,
			getSource(sourceMap, i),
			(sourcesContent && sourcesContent[i]) || undefined,
		);
	}
	if (names) {
		for (let i = 0; i < names.length; i++) {
			onName(i, names[i]);
		}
	}

	let mappingActiveLine = 0;

	/**
	 * @param {number} generatedLine generated line
	 * @param {number} generatedColumn generated column
	 * @param {number} sourceIndex source index
	 * @param {number} originalLine original line
	 * @param {number} originalColumn original column
	 * @param {number} nameIndex name index
	 * @returns {void}
	 */
	const onMapping = (
		generatedLine,
		generatedColumn,
		sourceIndex,
		originalLine,
		originalColumn,
		nameIndex,
	) => {
		if (
			generatedLine >= /** @type {number} */ (finalLine) &&
			(generatedColumn >= /** @type {number} */ (finalColumn) ||
				generatedLine > /** @type {number} */ (finalLine))
		) {
			return;
		}
		if (sourceIndex >= 0) {
			onChunk(
				undefined,
				generatedLine,
				generatedColumn,
				sourceIndex,
				originalLine,
				originalColumn,
				nameIndex,
			);
			mappingActiveLine = generatedLine;
		} else if (mappingActiveLine === generatedLine) {
			onChunk(undefined, generatedLine, generatedColumn, -1, -1, -1, -1);
			mappingActiveLine = 0;
		}
	};
	readMappings(mappings, onMapping);
	return result;
};

/**
 * @param {string} source source
 * @param {RawSourceMap} sourceMap source map
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} _onName on name
 * @returns {GeneratedSourceInfo} generated source info
 */
const streamChunksOfSourceMapLinesFinal = (
	source,
	sourceMap,
	onChunk,
	onSource,
	_onName,
) => {
	const result = getGeneratedSourceInfo(source);
	const { generatedLine, generatedColumn } = result;
	if (generatedLine === 1 && generatedColumn === 0) {
		return {
			generatedLine: 1,
			generatedColumn: 0,
		};
	}

	const { sources, sourcesContent, mappings } = sourceMap;
	for (let i = 0; i < sources.length; i++) {
		onSource(
			i,
			getSource(sourceMap, i),
			(sourcesContent && sourcesContent[i]) || undefined,
		);
	}

	const finalLine =
		generatedColumn === 0
			? /** @type {number} */ (generatedLine) - 1
			: /** @type {number} */ (generatedLine);

	let currentGeneratedLine = 1;

	/**
	 * @param {number} generatedLine generated line
	 * @param {number} _generatedColumn generated column
	 * @param {number} sourceIndex source index
	 * @param {number} originalLine original line
	 * @param {number} originalColumn original column
	 * @param {number} _nameIndex name index
	 * @returns {void}
	 */
	const onMapping = (
		generatedLine,
		_generatedColumn,
		sourceIndex,
		originalLine,
		originalColumn,
		_nameIndex,
	) => {
		if (
			sourceIndex >= 0 &&
			currentGeneratedLine <= generatedLine &&
			generatedLine <= finalLine
		) {
			onChunk(
				undefined,
				generatedLine,
				0,
				sourceIndex,
				originalLine,
				originalColumn,
				-1,
			);
			currentGeneratedLine = generatedLine + 1;
		}
	};
	readMappings(mappings, onMapping);
	return result;
};

/**
 * @param {string} source source
 * @param {RawSourceMap} sourceMap source map
 * @param {OnChunk} onChunk on chunk
 * @param {OnSource} onSource on source
 * @param {OnName} onName on name
 * @param {boolean} finalSource final source
 * @param {boolean} columns columns
 * @returns {GeneratedSourceInfo} generated source info
 */
module.exports = (
	source,
	sourceMap,
	onChunk,
	onSource,
	onName,
	finalSource,
	columns,
) => {
	if (columns) {
		return finalSource
			? streamChunksOfSourceMapFinal(
					source,
					sourceMap,
					onChunk,
					onSource,
					onName,
				)
			: streamChunksOfSourceMapFull(
					source,
					sourceMap,
					onChunk,
					onSource,
					onName,
				);
	}
	return finalSource
		? streamChunksOfSourceMapLinesFinal(
				source,
				sourceMap,
				onChunk,
				onSource,
				onName,
			)
		: streamChunksOfSourceMapLinesFull(
				source,
				sourceMap,
				onChunk,
				onSource,
				onName,
			);
};


/***/ }),

/***/ 357:
/***/ ((module) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Mark Knichel @mknichel
*/



let dualStringBufferCaching = true;

/**
 * @returns {boolean} Whether the optimization to cache copies of both the
 * string and buffer version of source content is enabled. This is enabled by
 * default to improve performance but can consume more memory since values are
 * stored twice.
 */
function isDualStringBufferCachingEnabled() {
	return dualStringBufferCaching;
}

/**
 * Enables an optimization to save both string and buffer in memory to avoid
 * repeat conversions between the two formats when they are requested. This
 * is enabled by default. This option can improve performance but can consume
 * additional memory since values are stored twice.
 * @returns {void}
 */
function enableDualStringBufferCaching() {
	dualStringBufferCaching = true;
}

/**
 * Disables the optimization to save both string and buffer in memory. This
 * may increase performance but should reduce memory usage in the Webpack
 * compiler.
 * @returns {void}
 */
function disableDualStringBufferCaching() {
	dualStringBufferCaching = false;
}

const interningStringMap = new Map();

let enableStringInterningRefCount = 0;

/**
 * @returns {boolean} value
 */
function isStringInterningEnabled() {
	return enableStringInterningRefCount > 0;
}

/**
 * Starts a memory optimization to avoid repeat copies of the same string in
 * memory by caching a single reference to the string. This can reduce memory
 * usage if the same string is repeated many times in the compiler, such as
 * when Webpack layers are used with the same files.
 *
 * {@link exitStringInterningRange} should be called when string interning is
 * no longer necessary to free up the memory used by the interned strings. If
 * {@link enterStringInterningRange} has been called multiple times, then
 * this method may not immediately free all the memory until
 * {@link exitStringInterningRange} has been called to end all string
 * interning ranges.
 * @returns {void}
 */
function enterStringInterningRange() {
	enableStringInterningRefCount++;
}

/**
 * Stops the current string interning range. Once all string interning ranges
 * have been exited, this method will free all the memory used by the interned
 * strings. This method should be called once for each time that
 * {@link enterStringInterningRange} was called.
 * @returns {void}
 */
function exitStringInterningRange() {
	if (--enableStringInterningRefCount <= 0) {
		interningStringMap.clear();
		enableStringInterningRefCount = 0;
	}
}

/**
 * Saves the string in a map to ensure that only one copy of the string exists
 * in memory at a given time. This is controlled by {@link enableStringInterning}
 * and {@link disableStringInterning}. Callers are expect to manage the memory
 * of the interned strings by calling {@link disableStringInterning} after the
 * compiler no longer needs to save the interned memory.
 * @param {string} str A string to be interned.
 * @returns {string} The original string or a reference to an existing string of the same value if it has already been interned.
 */
function internString(str) {
	if (
		!isStringInterningEnabled() ||
		!str ||
		str.length < 128 ||
		typeof str !== "string"
	) {
		return str;
	}
	let internedString = interningStringMap.get(str);
	if (internedString === undefined) {
		internedString = str;
		interningStringMap.set(str, internedString);
	}
	return internedString;
}

module.exports = {
	disableDualStringBufferCaching,
	enableDualStringBufferCaching,
	internString,
	isDualStringBufferCachingEnabled,
	enterStringInterningRange,
	exitStringInterningRange,
};


/***/ }),

/***/ 339:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/



/** @typedef {import("./CachedSource").CachedData} CachedData */
/** @typedef {import("./CompatSource").SourceLike} SourceLike */
/** @typedef {import("./ConcatSource").Child} ConcatSourceChild */
/** @typedef {import("./ReplaceSource").Replacement} Replacement */
/** @typedef {import("./Source").HashLike} HashLike */
/** @typedef {import("./Source").MapOptions} MapOptions */
/** @typedef {import("./Source").RawSourceMap} RawSourceMap */
/** @typedef {import("./Source").SourceAndMap} SourceAndMap */
/** @typedef {import("./Source").SourceValue} SourceValue */
/** @typedef {import("./helpers/getGeneratedSourceInfo").GeneratedSourceInfo} GeneratedSourceInfo */
/** @typedef {import("./helpers/streamChunks").OnChunk} OnChunk */
/** @typedef {import("./helpers/streamChunks").OnName} OnName */
/** @typedef {import("./helpers/streamChunks").OnSource} OnSource */
/** @typedef {import("./helpers/streamChunks").Options} StreamChunksOptions */

/**
 * @template T
 * @param {() => T} fn memorized function
 * @returns {() => T} new function
 */
const memoize = (fn) => {
	let cache = false;
	/** @type {T | undefined} */
	let result;
	return () => {
		if (cache) {
			return /** @type {T} */ (result);
		}

		result = fn();
		cache = true;
		// Allow to clean up memory for fn
		// and all dependent resources
		/** @type {(() => T) | undefined} */
		(fn) = undefined;
		return /** @type {T} */ (result);
	};
};

/**
 * @template A
 * @template B
 * @param {A} obj input a
 * @param {B} exports input b
 * @returns {A & B} merged
 */
const mergeExports = (obj, exports) => {
	const descriptors = Object.getOwnPropertyDescriptors(exports);
	for (const name of Object.keys(descriptors)) {
		const descriptor = descriptors[name];
		if (descriptor.get) {
			const fn = descriptor.get;
			Object.defineProperty(obj, name, {
				configurable: false,
				enumerable: true,
				get: memoize(fn),
			});
		} else if (typeof descriptor.value === "object") {
			Object.defineProperty(obj, name, {
				configurable: false,
				enumerable: true,
				writable: false,
				value: mergeExports({}, descriptor.value),
			});
		} else {
			throw new Error(
				"Exposed values must be either a getter or an nested object",
			);
		}
	}
	return /** @type {A & B} */ (Object.freeze(obj));
};

module.exports = mergeExports(
	{},
	{
		get Source() {
			return __nccwpck_require__(422);
		},
		get RawSource() {
			return __nccwpck_require__(136);
		},
		get OriginalSource() {
			return __nccwpck_require__(837);
		},
		get SourceMapSource() {
			return __nccwpck_require__(147);
		},
		get CachedSource() {
			return __nccwpck_require__(780);
		},
		get ConcatSource() {
			return __nccwpck_require__(974);
		},
		get ReplaceSource() {
			return __nccwpck_require__(902);
		},
		get PrefixSource() {
			return __nccwpck_require__(850);
		},
		get SizeOnlySource() {
			return __nccwpck_require__(865);
		},
		get CompatSource() {
			return __nccwpck_require__(844);
		},
		util: {
			get stringBufferUtils() {
				return __nccwpck_require__(357);
			},
		},
	},
);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(339);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;