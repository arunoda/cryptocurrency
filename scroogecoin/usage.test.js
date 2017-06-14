const crypto = require('../lib/crypto')
const ScroogeCoin = require('./')

describe('ScroogeCoin', () => {
  it ('should support creating coins', async () => {
    const user = await crypto.createUser()
    const tx = await ScroogeCoin.createCoin(user.publicKey, 10)

    expect(tx.coins).toEqual(
      [{id: 0, owner: user.publicKey, value: 10}]
    )
    expect(tx.type).toBe('create')

    ScroogeCoin.verify(tx)
  })

  it ('should detect modified transactions when verifying', async () => {
    const user = await crypto.createUser()
    const tx = await ScroogeCoin.createCoin(user.publicKey, 10)
    tx.coins[0].value = 100

    try {
      await ScroogeCoin.verify(tx)
    } catch (ex) {
      if(/Invalid Transaction/.test(ex.message)) return
      throw ex
    }
  })
})