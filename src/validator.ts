import { TrpcResponse } from "./runner";
import { TestSuccess } from "./types";

interface ValidationResult {
    pass: boolean;
    message: string;
}

const validateHttp = (response:TrpcResponse, success:TestSuccess) => {
    // success.status
    if (success.status && success.status !== response.status) {
        return {
            pass: false,
            message: `Expected status ${success.status} but got ${response.status}`
        }
    }
}

const validateTrpcErrors = (response:TrpcResponse, success:TestSuccess) => {
    // TODO: batched responses
    const resError = response.data[0].error?.json;

    // success.code
    if (success.code && resError?.data?.code) {
        if (success.code !== resError?.data?.code) {
            return {
                pass: false,
                message: `Expected code '${success.code}' but got code '${resError?.data?.code}'`
            }
        }
    }
    else if (success.code) {
        return {
            pass: false,
            message: "Response did not contain error code"
        }
    }

    // success.errorMessage
    if (success.errorMessage && resError?.message) {
        if (success.errorMessage !== resError?.message) {
            return {
                pass: false,
                message: `Expected a different error message`
            }
        }
    }
    else if (success.errorMessage) {
        return {
            pass: false,
            message: "Response did not contain error message"
        }
    }
}

const validateTrpcSuccesses = (response:TrpcResponse, success:TestSuccess) => {
    // TODO: batched responses
    const resData = response.data[0].result?.data?.json;

    // success.data
    if (success.data && resData) {
        const keys = Object.keys(success.data).sort();
        const resKeys = Object.keys(resData).sort();

        if (keys.length !== resKeys.length) {
            return {
                pass: false,
                message: `Expected a different number of data values`
            }
        }

        for (let i = 0; i < keys.length; i++) {
            if (resKeys[i] !== keys[i]) {
                return {
                    pass: false,
                    message: `Response contained unexpected key '${resKeys[i]}'`
                }
            }
        }

        for (let i = 0; i < keys.length; i++) {
            if (success.data[keys[i]] !== resData[keys[i]]) {
                return {
                    pass: false,
                    message: `Value of '${keys[i]}' differed`
                }
            }
        }
    }
    else if (success.data && !resData) {
        // console.log(response.data.result.data);
        return {
            pass: false,
            message: `Response did not contain data`
        }
    }
}

const validateQueryResponse = (response:TrpcResponse, success:TestSuccess) => {
    const httpTests = validateHttp(response, success);
    if (httpTests) {
        return httpTests;
    }

    const trpcErrorTests = validateTrpcErrors(response, success);
    if (trpcErrorTests) {
        return trpcErrorTests;
    }

    const trpcSuccessTests = validateTrpcSuccesses(response, success);
    if (trpcSuccessTests) {
        return trpcSuccessTests;
    }

    return {
        pass: true,
        message: "All cases passed"
    };
}

export { validateQueryResponse };