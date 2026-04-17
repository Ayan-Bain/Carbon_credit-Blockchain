const { ethers } = require('ethers');
const { SiweMessage } = require('siwe');
const axios = require('axios');

// Use command-line arguments or defaults
const args = process.argv.slice(2);
const PRIVATE_KEY = args[0];
const NONCE = args[1];
if(PRIVATE_KEY==null || NONCE==null) {
    console.log('Usage: node gen-sign.ts <private_key> <nonce>');
    process.exit(1);
}

if (!args[0]) {
    console.log('Usage: node gen-sign.ts <private_key> <nonce>');
    console.log('Using default values for demonstration...\n');
}

async function getAccessToken(privateKey, nonceValue) {
    const domain = 'localhost';
    const origin = 'http://localhost:3000';
    const baseUrl = 'http://localhost:3000'; // Adjust to your backend URL

    // 1. Create a wallet instance from the private key
    const wallet = new ethers.Wallet(privateKey);
    const address = await wallet.getAddress();

    // 2. Use the provided nonce
    const nonce = nonceValue;

    // 3. Prepare the SIWE message
    const siweMessage = new SiweMessage({
        domain,
        address,
        statement: 'Sign in with Ethereum to the Carbon Credit Blockchain.',
        uri: origin,
        version: '1',
        chainId: 1,
        nonce: nonce
    });

    const messageToSign = siweMessage.prepareMessage();

    // 4. Sign the message using the private key
    const signature = await wallet.signMessage(messageToSign);

    // 5. Construct the POST body
    const requestBody = {
        message: messageToSign,
        signature: signature
    };

    console.log('--- POST Request Body ---');
    console.log(JSON.stringify(requestBody, null, 2));

    // 6. Execute the verification request (uncomment to actually call the API)
    /*
    try {
        const verifyResponse = await axios.post(`${baseUrl}/auth/verify`, requestBody);
        console.log('\n--- Access Token Received ---');
        console.log(verifyResponse.data.accessToken);
        return verifyResponse.data.accessToken;
    } catch (error) {
        console.error('Verification failed:', error.response?.data || error.message);
    }
    */
}

getAccessToken(PRIVATE_KEY, NONCE);