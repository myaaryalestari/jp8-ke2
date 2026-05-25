#!/bin/bash

# Konfigurasi Environment untuk bertindak sebagai Admin Org1
export FABRIC_CFG_PATH="${PWD}/config"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${PWD}/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="${PWD}/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org1.example.com

# 1. Membuat Channel dari file mychannel.tx
echo "Menciptakan Channel 'mychannel'..."
./bin/peer channel create -o localhost:7050 -c mychannel -f ./channel-artifacts/mychannel.tx --tls --ordererTLSHostnameOverride orderer.example.com --cafile "${PWD}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# 2. Org1 Bergabung ke Channel
echo "Org1 bergabung ke channel..."
./bin/peer channel join -b mychannel.block