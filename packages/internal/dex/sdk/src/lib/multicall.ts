import { Interface } from 'ethers';
import {
  Multicall,
  UniswapInterfaceMulticall,
} from '../contracts/types/Multicall';
import { UniswapV3Pool__factory } from '../contracts/types';

const DEFAULT_GAS_QUOTE = 2_000_000;

type Address = string;

export type BlockTag = 'latest' | `0x${string}`;

export type SingleContractCallOptions = {
  gasRequired: number;
  blockTag: BlockTag;
};

export type MulticallOptions = {
  blockTag: BlockTag;
};

export type MulticallResponse = {
  blockNumber: bigint;
  returnData: UniswapInterfaceMulticall.ResultStructOutput[];
};

// TODO: Better description of function and args
export async function multicallSingleCallDataMultipleContracts(
  multicallContract: Multicall,
  functionName: string,
  addresses: Address[],
  options?: MulticallOptions,
): Promise<MulticallResponse> {
  // Encode args - generate calldata for contract
  const contractIFace = UniswapV3Pool__factory.createInterface();
  // TODO: fix used before defined error
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const callData = getCallData(functionName, contractIFace);

  const calls: UniswapInterfaceMulticall.CallStruct[] = [];

  if (callData) {
    addresses.forEach((address) => {
      if (address) {
        calls.push({
          target: address,
          callData,
          gasLimit: BigInt('1000000'),
        });
      }
    });
  }

  // Use block number if provided, otherwise use latest block
  if (options?.blockTag) {
    return multicallContract.multicall.staticCall(calls, { blockTag: options.blockTag });
  }
  return multicallContract.multicall.staticCall(calls);
}

// TODO: Better description of function and args
export async function multicallMultipleCallDataSingContract(
  multicallContract: Multicall,
  calldata: string[],
  address: Address,
  options?: SingleContractCallOptions,
): Promise<MulticallResponse> {
  // Create call objects
  const calls = new Array<UniswapInterfaceMulticall.CallStruct>(calldata.length);
  // TODO: use object.keys of something similar to avoid iterating over
  // entire object prototype
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const i in calldata) {
    calls[i] = {
      target: address,
      callData: calldata[i],
      gasLimit: options?.gasRequired ?? DEFAULT_GAS_QUOTE,
    };
  }

  // Use block number if provided, otherwise use latest block
  if (options?.blockTag) {
    return multicallContract.multicall.staticCall(calls, { blockTag: options.blockTag });
  }
  return multicallContract.multicall.staticCall(calls);
}

const getCallData = (
  methodName: string,
  contractInterface: Interface | null | undefined,
): string | undefined => {
  // Create ethers function fragment
  const fragment = contractInterface?.getFunction(methodName);

  return fragment ? contractInterface?.encodeFunctionData(fragment) : undefined;
};
