'use strict';

const { Contract } = require('fabric-contract-api');

class AcademicContract extends Contract {

    // Fungsi 1: CreateAsset - Mencatat Kredensial Ijazah Mahasiswa Baru (Sesuai server.js Orang 1)
    async CreateAsset(ctx, id, studentName, university, degree, gpa) {
        // Cek dulu apakah data mahasiswa dengan ID ijazah/NIM ini sudah ada
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`Kredensial dengan ID ${id} sudah terdaftar di dalam sistem!`);
        }

        // Struktur data JSON akademis sesuai standar CouchDB kelompok
        const academicAsset = {
            docType: 'academic',
            id: id,
            studentName: studentName,
            university: university,
            degree: degree,
            gpa: gpa,
            waktuPencatatan: new Date().toISOString()
        };

        // Simpan ke State Database (CouchDB)
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(academicAsset)));
        return JSON.stringify(academicAsset);
    }

    // Fungsi 2: TransferAsset - Mengubah Otoritas/Verifikator Ijazah (Sesuai server.js Orang 1)
    async TransferAsset(ctx, id, newOwner) {
        // Ambil data ijazah yang ada di ledger
        const assetAsBytes = await ctx.stub.getState(id);
        if (!assetAsBytes || assetAsBytes.length === 0) {
            throw new Error(`Kredensial dengan ID ${id} tidak ditemukan!`);
        }

        const academicAsset = JSON.parse(assetAsBytes.toString());
        
        // Mengubah instansi/pemilik otoritas verifikasi ijazah
        academicAsset.owner = newOwner; 
        academicAsset.waktuUpdate = new Date().toISOString();

        // Simpan kembali perubahan ke ledger
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(academicAsset)));
        return JSON.stringify(academicAsset);
    }

    // Fungsi 3: GetAssetHistory - Menampilkan Histori Audit Ijazah (Sesuai server.js Orang 1)
    async GetAssetHistory(ctx, id) {
        // Ambil semua riwayat transaksi untuk ID tersebut
        const iterator = await ctx.stub.getHistoryForKey(id);
        const allResults = [];

        let result = await iterator.next();
        while (!result.done) {
            if (result.value) {
                const obj = {
                    txId: result.value.txId,           // ID Transaksi unik blockchain
                    timestamp: result.value.timestamp,   // Waktu block divalidasi jaringan
                    isDelete: result.value.isDelete     // Status penghapusan data
                };
                
                try {
                    obj.data = JSON.parse(result.value.value.toString('utf8'));
                } catch (err) {
                    obj.data = result.value.value.toString('utf8');
                }
                
                allResults.push(obj);
            }
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }

    // Fungsi Pembantu: Mengecek keberadaan data di database
    async AssetExists(ctx, id) {
        const assetAsBytes = await ctx.stub.getState(id);
        return assetAsBytes && assetAsBytes.length > 0;
    }
}

module.exports = AcademicContract;