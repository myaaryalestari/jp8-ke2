const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Untuk membaca request body berupa JSON

// Fungsi helper untuk terhubung ke jaringan Fabric
async function getContract() {
    // 1. Ambil peta koneksi
    const ccpPath = path.resolve(__dirname, 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // 2. Ambil dompet digital yang barusan dibuat
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // 3. Bangun koneksi melalui Gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
    });

    // 4. Masuk ke channel dan hubungkan ke chaincode
    const network = await gateway.getNetwork('mychannel');
    
    // CATATAN: Pastikan nama 'academic_cc' ini sama dengan nama chaincode 
    // yang nanti di-install oleh Orang 2 (Chaincode Developer)
    const contract = network.getContract('academic_cc'); 
    
    return { contract, gateway };
}

// =========================================================================
// ENDPOINT 1: Membuat Aset Baru (CreateAsset)
// =========================================================================
app.post('/api/createAsset', async (req, res) => {
    try {
        const { id, studentName, university, degree, gpa } = req.body;
        const { contract, gateway } = await getContract();

        // Submit transaksi ke blockchain
        await contract.submitTransaction('CreateAsset', id, studentName, university, degree, gpa);
        gateway.disconnect();

        res.status(200).json({ message: `Kredensial untuk ${studentName} berhasil dicatat di blockchain!` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =========================================================================
// ENDPOINT 2: Mentransfer/Mengubah Aset (TransferAsset)
// =========================================================================
app.post('/api/transferAsset', async (req, res) => {
    try {
        const { id, newOwner } = req.body;
        const { contract, gateway } = await getContract();

        await contract.submitTransaction('TransferAsset', id, newOwner);
        gateway.disconnect();

        res.status(200).json({ message: `Aset ${id} berhasil dipindahtangankan ke ${newOwner}.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =========================================================================
// ENDPOINT 3: Melihat Histori (GetAssetHistory) - Memanfaatkan CouchDB
// =========================================================================
app.get('/api/getAssetHistory/:id', async (req, res) => {
    try {
        const { contract, gateway } = await getContract();

        // Evaluate transaction tidak mengubah data, hanya membaca
        const result = await contract.evaluateTransaction('GetAssetHistory', req.params.id);
        gateway.disconnect();

        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Jalankan Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server REST API berhasil berjalan di http://localhost:${PORT}`);
    console.log(`Menunggu request dari Frontend...`);
});