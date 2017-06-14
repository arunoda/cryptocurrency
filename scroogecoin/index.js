const { createUser, hashObject, signData, verify } = require('../lib/crypto')

// This is an async user
const scrooge = createUser()
const store = {}
exports.lastest = null

class Transaction {
  constructor(prevHash, type, spentCoins, newCoins) {
    this.coins = newCoins

    this.type = type
    this.prevHash = prevHash
    this.spentCoins = null

    // metadata
    this.hash = this.buildHash()
    this.signatures = {}
  }

  buildHash () {
    const payload = {
      prevHash: this.prevHash,
      type: this.type,
      coints: this.coins,
      spentCoins: this.spentCoins
    }

    return hashObject(payload)
  }

  sign (user, signature) {
    this.signatures[user] = signature
  }
}

exports.createCoin = async function (owner, value) {
  const { privateKey, publicKey } = await scrooge

  // Create coin
  const coins = [{ id: 0, owner, value }]
  const transaction = new Transaction(
    exports.latest,
    'create',
    null,
    coins
  )

  // Sign it
  const signature = signData(privateKey, transaction.hash)
  transaction.sign(publicKey, signature)

  // Store it
  exports.latest = transaction
  store[transaction.hash] = transaction

  return transaction
}

exports.verify = async function (transaction) {
  const { publicKey } = await scrooge
  const hash = transaction.buildHash()

  const verified = verify(publicKey, transaction.signatures[publicKey], hash)
  if (!verified) {
    throw new Error('Invalid Transaction')
  }
}