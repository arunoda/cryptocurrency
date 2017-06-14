const crypto = require('../lib/crypto')
const ScroogeCoin = require('./')

describe('ScroogeCoin', () => {
  it ('should support creating coins', async () => {
    const user = await crypto.createUser()
    const tx = await ScroogeCoin.createCoin(user.publicKey, 10)

    expect(tx.coins).toEqual(
      [{owner: user.publicKey, value: 10}]
    )
    expect(tx.type).toBe('create')
    expect(await ScroogeCoin.verify(tx)).toBe(true)
  })

  it ('should detect modified transactions when verifying', async () => {
    const user = await crypto.createUser()
    const tx = await ScroogeCoin.createCoin(user.publicKey, 10)
    tx.coins[0].value = 100

    expect(await ScroogeCoin.verify(tx)).toBe(false)
  })

  describe('pay coins', () => {
    it ('should allow to pay coins', async () => {
      const arunoda = await crypto.createUser()
      const nadee = await crypto.createUser()
      const jamo = await crypto.createUser()
      const olleh = await crypto.createUser()

      const arunodaCoin = await ScroogeCoin.createCoin(arunoda.publicKey, 10)
      const nadeeCoin = await ScroogeCoin.createCoin(nadee.publicKey, 20)

      const tx = await ScroogeCoin.payCoins(
        [`${arunodaCoin.buildHash()}::0`, `${nadeeCoin.buildHash()}::0`],
        [
          { owner: jamo.publicKey, value: 15},
          { owner: olleh.publicKey, value: 15}
        ],
        function coinOwnerSign(ownerPublicKey, hash) {
          if (ownerPublicKey === arunoda.publicKey) {
            return crypto.signData(arunoda.privateKey, hash)
          }

          if (ownerPublicKey === nadee.publicKey) {
            return crypto.signData(nadee.privateKey, hash)
          }

          throw new Error('No user to sign the coin')   
        }
      )

      expect(tx.coins).toEqual(
        [
          { owner: jamo.publicKey, value: 15},
          { owner: olleh.publicKey, value: 15}
        ]
      )
    })

    it('should not allow to pay if totals are different', async () => {
      const arunoda = await crypto.createUser()
      const nadee = await crypto.createUser()
      const jamo = await crypto.createUser()
      const olleh = await crypto.createUser()

      const arunodaCoin = await ScroogeCoin.createCoin(arunoda.publicKey, 10)
      const nadeeCoin = await ScroogeCoin.createCoin(nadee.publicKey, 20)

      try {
        const fn = await ScroogeCoin.payCoins(
          [`${arunodaCoin.buildHash()}::0`, `${nadeeCoin.buildHash()}::0`],
          [
            { owner: jamo.publicKey, value: 15},
            { owner: olleh.publicKey, value: 20}
          ]
        )
        throw new Error('Should fail')
      } catch(ex) {
        if (/Coin totals are not the same/.test(ex.message)) return
        throw ex
      }
      
    })

    it ('should not allow to pay already spent coins', async () => {
      const arunoda = await crypto.createUser()
      const jamo = await crypto.createUser()

      const arunodaCoin = await ScroogeCoin.createCoin(arunoda.publicKey, 10)

      // Pay arunoda's coin to jamo 
      await ScroogeCoin.payCoins(
        [`${arunodaCoin.buildHash()}::0`],
        [{ owner: jamo.publicKey, value: 10}],
        (owner, hash) => crypto.signData(arunoda.privateKey, hash)
      )

      // Try to pay it again
      try {
        await ScroogeCoin.payCoins(
          [`${arunodaCoin.buildHash()}::0`],
          [{ owner: jamo.publicKey, value: 10}],
          (owner, hash) => crypto.signData(arunoda.privateKey, hash)
        )
        throw new Error('Should fail')
      } catch(ex) {
        if(/Coin has already paid/.test(ex.message)) return
        throw ex
      }

    })

    it ('should reject coins with no transaction', async () => {
      // Pay arunoda's coin to jamo 
      try {
        await ScroogeCoin.payCoins(
          [`KKRD::0`]
        )
        throw new Error('Should fail')
      } catch(ex) {
        if(/The coin has never created/.test(ex.message)) return
        throw ex
      }
    })

    it ('should reject coins with no coin but a transaction', async () => {
      const arunoda = await crypto.createUser()
      const arunodaCoin = await ScroogeCoin.createCoin(arunoda.publicKey, 10)

      // Pay arunoda's coin to jamo 
      try {
        await ScroogeCoin.payCoins(
          [`${arunodaCoin.buildHash()}::10`]
        )
        throw new Error('Should fail')
      } catch(ex) {
        if(/The coin has never created/.test(ex.message)) return
        throw ex
      }
    })

    it ('should block if a prev transaction is modified', async () => {
      const arunoda = await crypto.createUser()
      const jamo = await crypto.createUser()

      const arunodaCoin = await ScroogeCoin.createCoin(arunoda.publicKey, 10)
      const arunodaCoinHash = arunodaCoin.buildHash()
      arunodaCoin.coins[0].value = 20

      // Pay arunoda's modified coin to jamo 
      try {
        await ScroogeCoin.payCoins(
          [`${arunodaCoinHash}::0`],
          [{ owner: jamo.publicKey, value: 20}],
          (owner, hash) => crypto.signData(arunoda.privateKey, hash)
        )
        throw new Error('Should fail')
      } catch(ex) {
        if(/The coin has been illegally modified/.test(ex.message)) return
        throw ex
      }

    })

  })

})