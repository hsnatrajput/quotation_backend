const { customAlphabet } = require('nanoid');

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const generateProposalId = customAlphabet(alphabet, 10); // 10 characters

module.exports = generateProposalId;