// the package for hex-bytes transform
import { hexToBytes } from "hada";
import { crypto } from "@iroha2/crypto-target-node";
import { KeyPair } from "@iroha2/crypto-core";
import { setCrypto } from "@iroha2/client";
import { Client } from "@iroha2/client";
import {
  DomainId,
  AccountId,
  EvaluatesToRegistrableBox,
  Executable,
  Expression,
  IdentifiableBox,
  Instruction,
  MapNameValue,
  Metadata,
  NewDomain,
  OptionIpfsPath,
  QueryBox,
  RegisterBox,
  Value,
  VecInstruction,
} from "@iroha2/data-model";
import fetch from "node-fetch";
import consola from "consola";

setCrypto(crypto);

async function delay(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

function generateKeyPair(params: {
  publicKeyMultihash: string;
  privateKey: {
    digestFunction: string;
    payload: string;
  };
}): KeyPair {
  const multihashBytes = Uint8Array.from(hexToBytes(params.publicKeyMultihash));
  const multihash = crypto.createMultihashFromBytes(multihashBytes);
  const publicKey = crypto.createPublicKeyFromMultihash(multihash);
  const privateKey = crypto.createPrivateKeyFromJsKey(params.privateKey);

  const keyPair = crypto.createKeyPairFromKeys(publicKey, privateKey);

  // don't forget to "free" created structures
  for (const x of [publicKey, privateKey, multihash]) {
    x.free();
  }

  return keyPair;
}

const kp = generateKeyPair({
  publicKeyMultihash:
    "ed01207233bfc89dcbd68c19fde6ce6158225298ec1131b6a130d1aeb454c1ab5183c0",
  privateKey: {
    digestFunction: "ed25519",
    payload:
      "9ac47abf59b356e0bd7dcbbbb4dec080e302156a48ca907e47cb6aea1d32719e7233bfc89dcbd68c19fde6ce6158225298ec1131b6a130d1aeb454c1ab5183c0",
  },
});

const client = new Client({
  torii: {
    // Both URLs are optional in case you only need one of them,
    // e.g. only the telemetry endpoints
    apiURL: "http://127.0.0.1:8080",
    telemetryURL: "http://127.0.0.1:8081",
  },
  accountId: AccountId({
    // Account name
    name: "alice",
    // The domain where this account is registered
    domain_id: DomainId({
      name: "wonderland",
    }),
  }),
  // A key pair, needed for transactions and queries
  keyPair: kp,
  fetch,
});

async function registerDomain(domainName: string) {
  const registerBox = RegisterBox({
    object: EvaluatesToRegistrableBox({
      expression: Expression(
        "Raw",
        Value(
          "Identifiable",
          IdentifiableBox(
            "NewDomain",
            NewDomain({
              id: DomainId({
                name: domainName,
              }),
              metadata: Metadata({ map: MapNameValue(new Map()) }),
              logo: OptionIpfsPath("None"),
            })
          )
        )
      ),
    }),
  });

  await client.submit(
    Executable(
      "Instructions",
      VecInstruction([Instruction("Register", registerBox)])
    )
  );
}

async function ensureDomainExistence(domainName: string) {
  // Query all domains
  const result = await client.request(QueryBox("FindAllDomains", null));

  // Obtain the domain
  const domain = result
    .as("Ok")
    .result.as("Vec")
    .map((x) => x.as("Identifiable").as("Domain"))
    .find((x) => x.id.name === domainName);

  // Throw an error if the domain is unavailable
  if (!domain) throw new Error("Not found");
}

async function main() {
  const DOMAIN = "looking_glass";

  /**
   * In the Iroha config.json we've specified `SUMERAGI.BLOCK_TIME_MS` as 100ms.
   * With a doubled value we can be sure that during this time the block will be committed
   * for sure.
   */
  const BLOCK_COMMIT_TIME = 100 * 2;

  consola.info("Registering %o domain...", DOMAIN);
  await registerDomain(DOMAIN);
  await delay(BLOCK_COMMIT_TIME);

  consola.info("Fine, checking that %o is registered...", DOMAIN);
  await ensureDomainExistence("looking_glass");
  consola.success("Everything is fine ^_^");
}

main().catch((err) => {
  consola.fatal(err);
  process.exit(1);
});
