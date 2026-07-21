import {
  TransactionBuilder,
  Operation,
  BASE_FEE,
  SorobanRpc,
  xdr,
} from '@stellar/stellar-sdk';
import { LineProofClient } from './client.js';
import { SDKError } from './types.js';

export class EnrollmentClient {
  private readonly client: LineProofClient;

  constructor(client: LineProofClient) {
    this.client = client;
  }

  async enroll(queueId: string, _identity: string): Promise<string> {
    return this.client.submitSorobanOperation(
      Operation.invokeContractFunction({
        contract: queueId,
        function: "enroll",
        args: [],
      }),
    );
  }

  async cancel(queueId: string, _identity: string): Promise<string> {
    return this.client.submitSorobanOperation(
      Operation.invokeContractFunction({
        contract: queueId,
        function: "cancel",
        args: [],
      }),
    );
  }

  async isEnrolled(queueId: string, identity: string): Promise<boolean> {
    const source = this.client.simulationSource();
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.client.getNetworkPassphrase(),
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: queueId,
          function: "is_enrolled",
          args: [xdr.ScVal.scvString(identity)],
        }),
      )
      .setTimeout(30)
      .build();

    const simulateResult = await this.client.sorobanServer.simulateTransaction(tx);
    if (!SorobanRpc.Api.isSimulationSuccess(simulateResult) || !simulateResult.result) {
      throw new SDKError('SIMULATION_FAILED', 'Contract simulation returned no result');
    }

    const resultXdr = simulateResult.result.retval;
    if (resultXdr.switch() !== xdr.ScValType.scvBool()) {
      throw new SDKError('INVALID_RESPONSE', 'Expected Bool response from contract');
    }
    return resultXdr.b();
  }
}
