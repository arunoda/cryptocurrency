const main = require('../lib/main')
const crypto = require('../lib/crypto')
const Goofycoin = require('./')

main(async function () {
  const arunoda = await crypto.createUser()
  const nadee = await crypto.createUser()

  const firstCoin = Goofycoin.createCoin(arunoda.publicKey, 100)
  const nadeeCoin = firstCoin.transfer(arunoda, nadee.publicKey)
  nadeeCoin.verify()

  // Now verification will fail.
  nadeeCoin.payload.value = 200
  nadeeCoin.verify()
})