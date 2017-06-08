const crypto = require('../lib/crypto')

class Coin {
  constructor (type, owner, value, prev) {
    this.prev = prev
    this.payload = {
      type,
      owner,
      value,
      prevHash: prev? prev.getHash() : null
    }

  }

  getHash () {
    return crypto.hashObject(this.payload)
  }

  setSignature (signature) {
    this.signature = signature
  }

  getSignature () {
    return this.signature
  }

  transfer (user, newOwner) {
    if (user.publicKey !== this.payload.owner) {
      throw new Error('You are not the owner of this coin')
    }

    const newCoin = new Coin(
      'pay',
      newOwner,
      this.payload.value,
      this
    )

    const signature = crypto.signData(user.privateKey, newCoin.getHash())
    newCoin.setSignature(signature)

    return newCoin
  }

  verify () {
    // If this is just a created coin, there's nothing to verify
    if (this.payload.type === 'create') return true

    if (this.prev.getHash() !== this.payload.prevHash) {
      throw new Error('Previous coin has changed.')
    }

    const verified = crypto.verify(this.prev.payload.owner, this.signature, this.getHash())
    if (!verified) {
      throw new Error('This coin has been changed after signed.')
    }

    return true
  }
}

module.exports.createCoin = (owner, value) => {
  const coin = new Coin(
    'create',
    owner,
    value,
    null
  )

  return coin
}