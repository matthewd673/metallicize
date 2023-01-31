# metallicize

Simple test runner for tRPC.

```
npm i metallicize -g
metallicize test sequence.json
```

## Build
```
npm run build
npm i -g
metallicize test <test-sequence-file> [output-csv-file]
```

## Options
### `metallicize test`
|Option|Description|
|---|---
|`-p --print <properties...>`|Print additional information about each test. **Values:** `url`, `headers`, `data`.
|`-t --time`|Print the duration of each test's web request. Time data is always recorded and always included in CSV output.

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
|`input:Object\|string`|An object to be passed as input to the route, or a path to a JSON file

Queries and mutations can also be batched together by defining them in a list using `tests.queries` or `tests.mutations`.

*Note: all API calls are automatically batched internally for compatibility with `create-t3-app`'s `AppRouter` settings.*

### Success
Success states define the conditions that must be met for a test to pass. Any number of conditions may be included, and they must all match exactly.

|Key|Description|
|---|---
`status?:number`|The HTTP status code
`code?:string`|The `TRPCError` code (e.g.: `NOT_FOUND`)
`errorMessage?:string`|The custom message attached to a `TRPCError`
`dataStrict?:boolean`|When `true`, `data` must match the response object *exactly* to pass. Otherwise, only the keys specified in `data` must match.
`data?:Object\|string`|The JSON object expected for a successful request, or a path to a JSON file
`headers?:any`|The response headers. Any headers specified within must match exactly.

*Note: if every field is omitted, the test will always pass.*