module.exports = (fn) => {
  fn().catch(ex => {
    console.error(ex.stack)
    process.exit(1)
  })
}