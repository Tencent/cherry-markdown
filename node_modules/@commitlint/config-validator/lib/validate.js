import { createRequire } from 'node:module';
import _Ajv from 'ajv';
import { formatErrors } from './formatErrors.js';
const require = createRequire(import.meta.url);
const schema = require('./commitlint.schema.json');
const TYPE_OF = [
    'undefined',
    'string',
    'number',
    'object',
    'function',
    'boolean',
    'symbol',
];
// FIXME: https://github.com/ajv-validator/ajv/issues/2132
const Ajv = _Ajv;
export function validateConfig(source, config) {
    const ajv = new Ajv({
        meta: false,
        strict: false,
        useDefaults: true,
        validateSchema: false,
        verbose: true,
    });
    ajv.addKeyword({
        keyword: 'typeof',
        validate: function typeOfFunc(schema, data) {
            return typeof data === schema;
        },
        metaSchema: { type: 'string', enum: TYPE_OF },
        schema: true,
    });
    const validate = ajv.compile(schema);
    const isValid = validate(config);
    if (!isValid && validate.errors && validate.errors.length) {
        throw new Error(`Commitlint configuration in ${source} is invalid:\n${formatErrors(validate.errors)}`);
    }
}
//# sourceMappingURL=validate.js.map