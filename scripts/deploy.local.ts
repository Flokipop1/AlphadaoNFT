import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell } from '@ton/core';
import { compile } from './compile';
import { CertificationNFT } from '../wrappers/certification_nft';

export async function run(): Promise<{
  provider: Blockchain;
  admin: SandboxContract<TreasuryContract>;
  contract: SandboxContract<CertificationNFT>;
}> {
  const blockchain = await Blockchain.create();
  const admin = await blockchain.treasury('admin');

  // Compile FunC code
  const { cell: code } = await compile();

  // Create CertificationNFT instance
  const contract = CertificationNFT.createFromConfig(
    { admin: admin.address },
    code
  );

  // Open the contract in sandbox
  const contractAccount = await blockchain.openContract(contract);

  // Send deployment messagesssss
  await contractAccount.sendDeploy(admin.getSender(), toNano('0.05'));

  console.log('✅ CertificationNFT deployed at:', contractAccount.address.toString());

  return {
    provider: blockchain,
    admin,
    contract: contractAccount,
  };
}

// CLI support
if (require.main === module) {
  run().catch((err) => {
    console.error('❌ Deployment failed:', err);
  });
}