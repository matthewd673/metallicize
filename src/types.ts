interface TestSuccess {
    status?: number;
    code?: string;
    errorMessage?: string;
    dataStrict?: boolean;
    data?: any;
    headers?: any;
}

interface TestQuery {
    route: string;
    input: any;
}

interface TestMutation {
    route: string;
    input: any;
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