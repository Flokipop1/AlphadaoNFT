import * as fs from 'fs';
import  path  from 'path';
import { compileFunc } from '@ton-community/func-js';
import { Cell } from '@ton/core';

export async function compileScripts() {
  console.log('🛠 Compiling certification_nft.fc to .tvc, .fif, and ABI...');

  const contractPath = './contracts/certification_nft.fc';
  const stdlibPath = path.resolve(__dirname, '../contracts/stdlib.fc'); 
  const outputDir = './build';

  try {
    const compileResult = await compileFunc({
      targets: [contractPath],
      sources: (filePath: string) => {
        if (filePath.includes('stdlib.fc')) {
          if (fs.existsSync(stdlibPath)) {
            return fs.readFileSync(stdlibPath, 'utf8');
          }
          throw new Error('stdlib.fc not found');
        }
        return fs.readFileSync(filePath, 'utf8');
      },
    });

    if (compileResult.status === 'error') {
      console.error('❌ Compilation failed:', compileResult.message);
      process.exit(1);
    }

    // Ensure build/ exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Save .tvc (Base64)
    const tvcPath = path.join(outputDir, 'certification_nft.tvc');
    fs.writeFileSync(tvcPath, compileResult.codeBoc, 'utf-8');

    // Decode to Cell to save hex (.txt)
    const cell = Cell.fromBoc(Buffer.from(compileResult.codeBoc, 'base64'))[0];
    const hex = cell.toBoc().toString('hex');

    fs.writeFileSync(path.join(outputDir, 'certification_nft.txt'), hex, 'utf-8');
    fs.writeFileSync(path.join(outputDir, 'certification_nft.compile.json'), JSON.stringify({ hex }, null, 2));

    // Simulated ABI (manually created)
    const abi = {
      name: "CertificationNFT",
      methods: [
        { name: "mint", op: 0x01, inputs: ["recipient: address", "metadata: cell"] },
        { name: "add_admin", op: 0x02, inputs: ["admin_address: address"] }
      ]
    };
    fs.writeFileSync(path.join(outputDir, 'certification_nft.abi.json'), JSON.stringify(abi, null, 2));

   

    console.log('✅ Compilation successful. Outputs saved in /build');

    return { cell, hex, tvcBase64: compileResult.codeBoc };
  } catch (err) {
    console.error('❌ Error during compilation:', err);
    process.exit(1);
  }
}

compileScripts();
export { compileScripts as compile };