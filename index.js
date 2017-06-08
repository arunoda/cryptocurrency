const crypto = require('./lib/crypto')

async function main() {

  const user = await crypto.createUser()
  const data = 'Hello doc'
  const signature = crypto.signData(user.privateKey, data)
  const verified = crypto.verify(user.publicKey, signature, data)

  console.log('Verified:', verified)
}

main()