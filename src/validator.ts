import { TrpcResponse } from "./runner";
import { TestSuccess } from "./types";

interface ValidationResult {
    pass: boolean;
    message: string;
}

const validateQueryResponse = (response:TrpcResponse, success:TestSuccess) => {
    // HTTP TESTS
    // test status
    if (success.status && success.status !== response.status) {
        return {
            pass: false,
            message: `Expected status ${success.status} but got ${response.status}`
        }
    }

    // test headers

    // TRPC TESTS

    // test data
    const resData = response.data[0].result?.data?.json;
    if (success.data && resData) {
        const keys = Object.keys(success.data).sort();
        const resKeys = Object.keys(resData).sort();

        if (keys.length !== resKeys.length) {
            return {
                pass: false,
                message: `Response contained a different number of values`
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

    return {
        pass: true,
        message: "All cases passed"
    };
}

export { validateQueryResponse };