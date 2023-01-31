import { loadObject, TrpcResponse } from "./runner";
import { TestSuccess } from "./types";

interface ValidationResult {
    pass: boolean;
    message: string;
    index: number;
}

const validateHttp = (response:TrpcResponse, success:TestSuccess) => {
    // success.status
    if (success.status && success.status !== response.status) {
        return `Expected status ${success.status} but got ${response.status}`;
    }

    // success.headers
    if (success.headers) {
        const headers = Object.keys(success.headers).sort();
        for (let i = 0; i < headers.length; i++) {
            if (success.headers[headers[i]] !== response.headers.get(headers[i])) {
                return `Header ${headers[i]} differed`;
            }
        }
    }
}

const validateTrpcErrors = (response:any, success:TestSuccess) => {
    const resError = response.error?.json;

    // success.code
    if (success.code && resError?.data?.code) {
        if (success.code !== resError?.data?.code) {
            return `Expected code '${success.code}' but got code '${resError?.data?.code}'`;
        }
    }
    else if (success.code) {
        return `Response did not contain error code`;
    }

    // success.errorMessage
    if (success.errorMessage && resError?.message) {
        if (success.errorMessage !== resError?.message) {
            return `Expected a different error message`;
        }
    }
    else if (success.errorMessage) {
        return `Response did not contain error message`;
    }
}

const validateTrpcSuccesses = (response:any, success:TestSuccess, inputFile:string) => {
    // success.data
    const resData = response.result?.data?.json;
    if (success.data && resData) {
        const data = loadObject(success.data, inputFile);
        if (!data) { // load failed
            return `Failed to load data object '${success.data}'`;
        }

        const keys = Object.keys(data).sort();

        // strict
        if (success.dataStrict) {
            const resKeys = Object.keys(resData).sort();

            if (keys.length !== resKeys.length) {
                return `Expected a different number of data values`;
            }

            for (let i = 0; i < keys.length; i++) {
                if (resKeys[i] !== keys[i]) {
                    return `Response contained unexpected key '${resKeys[i]}'`;
                }
            }
        }

        for (let i = 0; i < keys.length; i++) {
            if (data[keys[i]] !== resData[keys[i]]) {
                return `Value of '${keys[i]}' differed`;
            }
        }
    }
    else if (success.data && !resData) {
        return `Response did not contain data`;
    }
}

const validateResponse = (inputFile:string, response:TrpcResponse, success:TestSuccess):ValidationResult[] => {
    let errors:ValidationResult[] = [];

    const httpTests = validateHttp(response, success);
    if (httpTests) {
        return [{
            pass: false,
            message: httpTests,
            index: 0,
        }]
    }

    for (let i = 0; i < response.data.length; i++) {
        const trpcErrorTests = validateTrpcErrors(response.data[i], success);
        const trpcSuccessTests = validateTrpcSuccesses(response.data[i], success, inputFile);
        if (trpcErrorTests) {
            errors.push({
                pass: false,
                message: trpcErrorTests,
                index: i,
            });
        }
        if (trpcSuccessTests) {
            errors.push({
                pass: false,
                message: trpcSuccessTests,
                index: i,
            });
        }
    }

    return errors;
}

export { validateResponse, ValidationResult };