const crypto = require('crypto')
const getKeyPair = require('akeypair')

module.exports.createUser = async () => {
  return new Promise((resolve, reject) => {
    getKeyPair({bits: 1024}, (err, pair) => {
      if (err) return reject(err)
      const user = {
        privateKey: pair.private,
        publicKey: pair.public
      }
      resolve(user)
    })
  })
}

module.exports.signData = (privateKey, data) => {
  const sign = crypto.createSign('sha256')
  sign.write(data)
  sign.end()

  return sign.sign(privateKey, 'hex')
}

module.exports.verify = (publicKey, signature, data) => {
  const verify = crypto.createVerify('sha256')
  verify.write(data)
  verify.end()

  return verify.verify(publicKey, signature, 'hex')
}

module.exports.hashObject = (obj) => {
  const pairs = Object
    .keys(obj)
    .sort((a, b) => a - b)
    .map(key => [key, obj[key]])

  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(pairs))
  return hash.digest('hex')
}