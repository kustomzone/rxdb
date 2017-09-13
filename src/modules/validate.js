/**
 * this plugin validates documents before they can be inserted into the RxCollection.
 * It's using is-my-json-valid as jsonschema-validator
 * @link https://github.com/mafintosh/is-my-json-valid
 */
import validator from 'is-my-json-valid';
import RxError from '../rx-error';

/**
 * cache the validators by the schema-hash
 * so we can reuse them when multiple collections have the same schema
 * @type {Object<string, any>}
 */
const validatorsCache = {};

const validate = function(obj, schemaPath = '') {
    const hash = this.hash;
    if (!validatorsCache[hash])
        validatorsCache[hash] = {};

    const validatorsOfHash = validatorsCache[hash];
    if (!validatorsOfHash[schemaPath]) {
        const schemaPart = schemaPath == '' ? this.jsonID : this.getSchemaByObjectPath(schemaPath);

        if (!schemaPart) {
            throw RxError.newRxError(
                'Sub-schema not found, does the schemaPath exists in your schema?', {
                    schemaPath
                }
            );
        }
        validatorsOfHash[schemaPath] = validator(schemaPart);
    }
    const useValidator = validatorsOfHash[schemaPath];
    const isValid = useValidator(obj);
    if (isValid) return obj;
    else {
        throw RxError.newRxError(
            'object does not match schema', {
                errors: useValidator.errors,
                schemaPath,
                obj,
                schema: this.jsonID
            }
        );
    };
};

export const rxdb = true;
export const prototypes = {
    /**
     * set validate-function for the RxSchema.prototype
     * @param {[type]} prototype of RxSchema
     */
    RxSchema: (proto) => {
        proto.validate = validate;
    }
};

export default {
    rxdb,
    prototypes
};
