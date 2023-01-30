# metallicize

Simple test runner for tRPC.

## Build & Run
```
npm run build
npm i -g
metallicize <test-sequence-file>
```

## Syntax
### Sequences
A sequence is a series of tests which are executed in order.

|Key|Description|
|---|---
|`name:string`|The name of the sequence
|`url:string`|The URL of a tRPC API
|`tests:test[]`|A list of tests

### Tests
Tests consist of a single query, mutation, or batch to a tRPC route, as well as a success state.

|Key|Description|
|---|---
|`name:string`|The name of the test
|`query?:query`|A tRPC query
|`mutation?:mutation`|A tRPC mutation
|`queries?:query[]`|A batch of tRPC queries
|`mutations?:mutation[]`|A batch of tRPC mutations
|`success:success`|The tests' success state

*Note: each test must include exactly one `query`, `mutation`, `queries`, or `mutations`.*

### Query/Mutation
Queries and mutations define tRPC API calls and work like `useQuery()` and `useMutation()`. They have the same structure but are distinct internally.

|Key|Description|
|---|---
|`route:string`|A public tRPC query or mutation route
|`input:any`|An object to be passed as input to the route

Queries and mutations can also be batched together by defining them in a list using `tests.queries` or `tests.mutations`.

*Note: all API calls are automatically batched internally for compatibility with `create-t3-app`'s `AppRouter` settings.*

### Success
Success states define the conditions that must be met for a test to pass. Any number of conditions may be included, and they must all exactly match (for now) to pass.

|Key|Description|
|---|---
`status?:number`|The HTTP status code
`code?:string`|The `TRPCError` code (e.g.: `NOT_FOUND`)
`errorMessage?:string`|The custom message attached to a `TRPCError`
`data?:any`|The JSON object returned by a successful request

*Note: if every field is omitted, the test will always pass.*