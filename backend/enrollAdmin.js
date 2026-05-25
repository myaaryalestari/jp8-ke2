const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // 1. Buat folder "wallet" di dalam direktori backend/
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Lokasi Wallet: ${walletPath}`);

        // 2. Cek apakah identitas admin sudah ada di dalam wallet
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('Identitas admin sudah ada di dalam wallet, bro!');
            return;
        }

        // 3. Cari jalur (path) menuju sertifikat admin yang dibuat oleh cryptogen di folder network
        const credPath = path.join(__dirname, '..', 'network', 'crypto-config', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp');
        const certPath = path.join(credPath, 'signcerts', 'Admin@org1.example.com-cert.pem');
        
        // Baca isi file sertifikat
        const certificate = fs.readFileSync(certPath).toString();

        // 4. Baca file private key
        // Karena cryptogen membuat nama file private key secara acak (contoh: 1234abcd_sk), 
        // kita perintahkan sistem untuk mengambil file apa pun yang ada di dalam folder keystore
        const keystorePath = path.join(credPath, 'keystore');
        const files = fs.readdirSync(keystorePath);
        const keyPath = path.join(keystorePath, files[0]);
        const privateKey = fs.readFileSync(keyPath).toString();

        // 5. Bungkus menjadi format identitas X.509 standar Hyperledger Fabric
        const x509Identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        // 6. Masukkan ke dalam dompet
        await wallet.put('admin', x509Identity);
        console.log('Sukses! Identitas admin berhasil dimasukkan ke dalam dompet digital.');

    } catch (error) {
        console.error(`Gagal mengekstrak identitas admin: ${error}`);
        process.exit(1);
    }
}

main();