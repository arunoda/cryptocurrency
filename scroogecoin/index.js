const { createUser, hashObject, signData, verify } = require('../lib/crypto')

// This is an async user
const scrooge = createUser()
const store = {}
const spentCoins = {}
exports.lastest = null

class Transaction {
  constructor(prevHash, type, spentCoins, newCoins) {
    this.coins = newCoins

    this.type = type
    this.prevHash = prevHash
    this.spentCoins = null

    // metadata
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
  const coins = [{ owner, value }]
  const tx = new Transaction(
    exports.latest,
    'create',
    null,
    coins
  )

  // Sign it
  const hash = tx.buildHash()
  const signature = signData(privateKey, hash)
  tx.sign(publicKey, signature)

  // Store it
  exports.latest = tx
  store[hash] = tx

  return tx
}

exports.payCoins = async function (prevCoins, newCoins, signFn) {
  const tx = new Transaction(
    exports.latest,
    'pay',
    prevCoins,
    newCoins
  )

  let totalValue = 0
  const coinOwners = []

  // Verify prev coins
  for (const coinId of prevCoins) {
    // Check if this coin paid earlier
    if (spentCoins[coinId]) {
      throw new Error(`Coin has already paid: ${coinId}`)
    }

    // Check coin existness
    const [hash, index] = coinId.split('::')
    const coinTx = store[hash]
    if (!coinTx) {
      throw new Error('The coin has never created')
    }

    const storedCoin = coinTx.coins[parseInt(index)]
    if (!storedCoin) {
      throw new Error('The coin has never created')
    }

    coinOwners.push(storedCoin.owner)
    totalValue += storedCoin.value
  }

  // Check for new coins
  let newCoinsTotal = newCoins.reduce(
    (total, c) => total + c.value,
    0 
  )

  if (newCoinsTotal !== totalValue) {
    throw new Error(`Coin totals are not the same. new: ${newCoinsTotal}, current: ${totalValue}`)
  }

  // Build the hash
  const hash = tx.buildHash()
  
  // Get signatures coin owners
  for(const owner of coinOwners) {
    const signature = signFn(owner, hash)
    if (!verify(owner, signature, hash)) {
      throw new Error(`Signed signature is wrong for user: ${owner}`)
    }
    tx.sign(owner, signature)
  }

  // Sign the token
  const { privateKey, publicKey } = await scrooge
  const signature = signData(privateKey, hash)
  tx.sign(publicKey, signature)

  // Store it
  exports.latest = tx
  store[hash] = tx
  prevCoins.forEach(id => spentCoins[id] = true)

  return tx
}

exports.verify = async function (transaction) {
  const { publicKey } = await scrooge
  const hash = transaction.buildHash()

  const verified = verify(publicKey, transaction.signatures[publicKey], hash)
  if (!verified) {
    throw new Error('Invalid Transaction')
  }
}