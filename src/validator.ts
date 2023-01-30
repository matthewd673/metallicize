import { TrpcResponse } from "./runner";
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
}

const validateTrpcErrors = (data:any, success:TestSuccess) => {
    const resError = data.error?.json;

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

const validateTrpcSuccesses = (data:any, success:TestSuccess) => {
    const resData = data.result?.data?.json;

    // success.data
    if (success.data && resData) {
        const keys = Object.keys(success.data).sort();
        const resKeys = Object.keys(resData).sort();

        if (keys.length !== resKeys.length) {
            return `Expected a different number of data values`;
        }

        for (let i = 0; i < keys.length; i++) {
            if (resKeys[i] !== keys[i]) {
                return `Response contained unexpected key '${resKeys[i]}'`;
            }
        }

        for (let i = 0; i < keys.length; i++) {
            if (success.data[keys[i]] !== resData[keys[i]]) {
                return `Value of '${keys[i]}' differed`;
            }
        }
    }
    else if (success.data && !resData) {
        return `Response did not contain data`;
    }
}

const validateResponse = (response:TrpcResponse, success:TestSuccess):ValidationResult[] => {
    let errors:ValidationResult[] = [];

    const httpTests = validateHttp(response, success);
    if (httpTests) {
        return [{
            pass: false,
            message: httpTests,
            index: 0
        }]
    }

    for (let i = 0; i < response.data.length; i++) {
        const trpcErrorTests = validateTrpcErrors(response, success);
        const trpcSuccessTests = validateTrpcSuccesses(response, success);
        if (trpcErrorTests) {
            errors.push({
                pass: false,
                message: trpcErrorTests,
                index: i
            });
        }
        if (trpcSuccessTests) {
            errors.push({
                pass: false,
                message: trpcSuccessTests,
                index: i
            });
        }
    }

    return errors;
}

export { validateResponse, ValidationResult };