Generated diff diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644 index 0000000..8ec382e --- /dev/null +++
b/.github/workflows/ci.yml @@ -0,0 +1,31 @@ +name: Deno CI + +on:

- push:
- branches:
- - main
- pull_request:
- branches:
- - main
-

+jobs:

- test:
- runs-on: ubuntu-latest
-
- steps:
- - name: Checkout
- uses: actions/checkout@v4
-
- - name: Setup Deno
- uses: denoland/setup-deno@v1
- with:
- deno-version: v1.x
-
- - name: Check formatting
- run: deno fmt --check
-
- - name: Lint code
- run: deno lint
-
- - name: Run tests
- run: deno task test
