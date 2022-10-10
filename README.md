# Iroha 2 - Domain Registration and Querying Reproduction

Works with `iroha v2.0.0-pre-rc.6` - https://github.com/hyperledger/iroha/tree/9bfdb39aaaa2490a82a17ebc255d3557d3ad38da

## Prerequisites

- Rust installed
- Node.js installed
- PNPM installed. If you have installed Node.js, then PNPM can be easily installed as well:

  ```bash
  npm i -g pnpm
  ```

## Steps

1. Build Iroha into a local directory with Cargo:

   ```bash
   cargo install \
     --root ./cargo \
     --git https://github.com/hyperledger/iroha.git \
     --rev 9bfdb39aaaa2490a82a17ebc255d3557d3ad38da \
     iroha
   ```

   It will take some time.

2. Run it with the provided configuration:

   ```bash
   IROHA2_CONFIG_PATH=./src/iroha_cfg/config.json \
     IROHA2_GENESIS_PATH=./src/iroha_cfg/genesis.json \
     ./cargo/bin/iroha --submit-genesis
   ```

3. Run the script:

   ```bash
   pnpm register_domain
   ```

   And see the result:

   ```
   ℹ Registering 'looking_glass' domain...
   ℹ Fine, checking that 'looking_glass' is registered...
   ✔ Everything is fine ^_^
   ```
