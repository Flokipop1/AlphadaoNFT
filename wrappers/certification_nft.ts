import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, Slice } from '@ton/core';

export type CertificationNFTConfig = {
  admin: Address;
};

export function certificationNFTConfigToCell(config: CertificationNFTConfig): Cell {
  return beginCell()
    .storeAddress(config.admin)
    .storeUint(0, 8)                  // admin_count
    .storeRef(beginCell().endCell()) // empty admin_dict
    .storeUint(0, 32)                 // total minted
    .storeUint(0, 32)                // next_id
    .storeDict(null)                // tokens dict
    .endCell();
}

export class CertificationNFT implements Contract {
  readonly address: Address;
  readonly init: { code: Cell; data: Cell };

  constructor(address: Address, init?: { code: Cell; data: Cell }) {
    this.address = address;
    this.init = init!;
  }

  static createFromConfig(config: CertificationNFTConfig, code: Cell, workchain = 0) {
    const data = certificationNFTConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);
    return new CertificationNFT(address, init);
  }

  async sendAddAdmin(provider: ContractProvider, sender: Sender, newAdmin: Address) {
    const msgBody = beginCell()
      .storeUint(0x01, 32) // OP_ADD_ADMIN
      .storeRef(beginCell().storeAddress(newAdmin).endCell())
      .endCell();

    await provider.internal(sender, {
      value: '0.05', // enough for gas
      body: msgBody,
    });
  }

  async sendMint(provider: ContractProvider, sender: Sender, student: Address, metadata: Cell) {
    const msgBody = beginCell()
      .storeUint(0x02, 32) // OP_MINT
      .storeSlice(beginCell().storeAddress(student).endCell().beginParse()) // student
      .storeRef(metadata)
      .endCell();

    await provider.internal(sender, {
      value: '0.1',
      body: msgBody,
    });
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
  // The init message body can be empty unless your recv_internal() expects specific data
  await provider.internal(via, {
    value,
    bounce: false,
  });
}

  async getState(provider: ContractProvider) {
    const result = await provider.get('get_state', []);
   const stack = result.stack;
const owner = stack.readCell().beginParse().loadAddress();
const adminCount = stack.readNumber();
const adminsDict = stack.readCell();  // optional if you don't need it
const total = stack.readNumber();
const nextId = stack.readNumber();
const tokensDict = stack.readCell();  // optional if you don't need it

    return {
      owner,
      adminCount,
      total,
      nextId
    };
  }
}