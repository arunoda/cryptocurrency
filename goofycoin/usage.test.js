const crypto = require('../lib/crypto')
const Goofycoin = require('./')

describe('Goofycoin', () => {
  it('should support coin transferring', async () => {
    const arunoda = await crypto.createUser()
    const nadee = await crypto.createUser()

    const firstCoin = Goofycoin.createCoin(arunoda.publicKey, 100)
    const nadeeCoin = firstCoin.transfer(arunoda, nadee.publicKey)
    nadeeCoin.verify()
  })

  it('should only allow owner to do the tranfering', async () => {
    const arunoda = await crypto.createUser()
    const nadee = await crypto.createUser()

    const firstCoin = Goofycoin.createCoin(arunoda.publicKey, 100)
    expect(() => firstCoin.transfer(nadee, nadee.publicKey))
      .toThrow(/You are not the owner of this coin/)
  })

  it('should detect changes to coin after signed', async () => {
    const arunoda = await crypto.createUser()
    const nadee = await crypto.createUser()

    const firstCoin = Goofycoin.createCoin(arunoda.publicKey, 100)
    const nadeeCoin = firstCoin.transfer(arunoda, nadee.publicKey)
    
    nadeeCoin.payload.value = 1000
    expect(() => nadeeCoin.verify()).toThrow(/This coin has been changed after signed/)
  })

  it('should detect changes in prev coin', async () => {
    const arunoda = await crypto.createUser()
    const nadee = await crypto.createUser()

    const firstCoin = Goofycoin.createCoin(arunoda.publicKey, 100)
    const nadeeCoin = firstCoin.transfer(arunoda, nadee.publicKey)

    firstCoin.payload.owner = nadee.publicKey

    expect(() => nadeeCoin.verify()).toThrow(/Previous coin has changed/)
  })
})
