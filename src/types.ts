interface TestSuccess {
    status?: number;
    code?: string;
    errorMessage?: string;
    dataStrict?: boolean;
    data?: Object|string;
    headers?: any;
}

interface TestQuery {
    route: string;
    input: Object|string;
}

interface TestMutation {
    route: string;
    input: Object|string;
}

interface TestStep {
    name: string;
    query?: TestQuery;
    mutation?: TestMutation;
    queries?: TestQuery[];
    mutations?: TestMutation[];
    success: TestSuccess;
}

interface TestSequence {
    name: string;
    url: string;
    tests: TestStep[];
}

export { TestSequence, TestStep, TestMutation, TestQuery, TestSuccess };