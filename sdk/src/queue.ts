import {
  TransactionBuilder,
  Operation,
  BASE_FEE,
  SorobanRpc,
  nativeToScVal,
  xdr,
} from '@stellar/stellar-sdk';
import { LineProofClient } from './client.js';
import { SDKError, Position } from './types.js';

export type QueueClientOptions = {
  queueContractId: string;
};

export class QueueClient {
  private readonly queueContractId: string;
  private readonly lineProof: LineProofClient;

  constructor(lineProof: LineProofClient, options: QueueClientOptions) {
    this.lineProof = lineProof;
    this.queueContractId = options.queueContractId;
  }

  async getPosition(positionId: number): Promise<Position> {
    if (!Number.isInteger(positionId) || positionId <= 0) {
      throw new SDKError(
        "INVALID_INPUT",
        "positionId must be a positive integer",
      );
    }

    const source = this.lineProof.simulationSource();
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.lineProof.networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.queueContractId,
          function: 'get_position',
          args: [nativeToScVal(positionId, { type: 'u64' })],
        }),
      )
      .setTimeout(30)
      .build();

    const simulateResult = await this.lineProof.sorobanServer.simulateTransaction(tx);
    if (!SorobanRpc.Api.isSimulationSuccess(simulateResult) || !simulateResult.result) {
      throw new SDKError('SIMULATION_FAILED', 'Contract simulation returned no result');
    }

    const resultXdr = simulateResult.result.retval;
    if (resultXdr.switch() !== xdr.ScValType.scvVec()) {
      throw new SDKError('INVALID_RESPONSE', 'Expected Vec response from contract');
    }

    const vec = resultXdr.vec();
    if (!vec || vec.length === 0) {
      throw new SDKError(
        "INVALID_RESPONSE",
        "Empty Vec response from contract",
      );
    }

    const position: Position = {
      positionId: BigInt(positionId),
      enrolledAt: Date.now(),
      identity: this.lineProof.getPublicKey(),
      status: "pending" as any,
    };

    return position;
  }

  async advance(_batchSize: number): Promise<number[]> {
    const hash = await this.lineProof.submitSorobanOperation(
      Operation.invokeContractFunction({
        contract: this.queueContractId,
        function: "advance",
        args: [],
      }),
    );
    return [parseInt(hash.slice(0, 8), 16)];
  }

  async close(): Promise<string> {
    return this.lineProof.submitSorobanOperation(
      Operation.invokeContractFunction({
        contract: this.queueContractId,
        function: "close",
        args: [],
      }),
    );
  }
}
