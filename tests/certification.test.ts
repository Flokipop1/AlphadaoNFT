import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell } from '@ton/core';
import { CertificationNFT } from '../wrappers/certification_nft';
import { compile } from '../scripts/compile'; // adjust path if needed

let blockchain: Blockchain;
let admin: SandboxContract<TreasuryContract>;
let contract: SandboxContract<CertificationNFT>;

beforeAll(async () => {
  blockchain = await Blockchain.create();
  admin = await blockchain.treasury('admin');

  const { cell: code } = await compile();

  const nft = CertificationNFT.createFromConfig({ admin: admin.address }, code);
  contract = await blockchain.openContract(nft);

  await contract.sendDeploy(admin.getSender(), toNano('0.05'));
});

it('should allow minting a certification NFT', async () => {
  const student = await blockchain.treasury('student1');
  const metadataString = 'cert:graduated:2025';
  const metadata = beginCell().storeStringTail(metadataString).endCell();

  await contract.sendMint(
    admin.getSender(),
    student.address,
    metadata
  );
});