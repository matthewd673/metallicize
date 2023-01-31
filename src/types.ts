interface TestSuccess {
    status?: number;
    code?: string;
    errorMessage?: string;
    dataStrict?: boolean;
    data?: any|string;
    headers?: any;
}

interface TestQuery {
    route: string;
    input: any|string;
}

interface TestMutation {
    route: string;
    input: any|string;
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
    vars?: any|string;
    tests: TestStep[];
}

export { TestSequence, TestStep, TestMutation, TestQuery, TestSuccess };