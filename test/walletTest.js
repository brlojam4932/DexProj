const Dex = artifacts.require("Dex")
const Link = artifacts.require("Link")
const truffleAssert = require('truffle-assertions');

contract("Dex", accounts => {
    it("should allow tokens added by owner only", async () => {
        let dex = await Dex.deployed()
        let link = await Link.deployed()
        await truffleAssert.passes(
          dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})
        )
        await truffleAssert.reverts(
          dex.addToken(web3.utils.fromUtf8("AAVE"), link.address, {from: accounts[1]})
        )
    })

    it("should allow deposits to correct token and account", async () => {
      let dex = await Dex.deployed()
      let link = await Link.deployed()

      await link.approve(dex.address, 500);
      await dex.deposit(100, web3.utils.fromUtf8("LINK"));
      let balance = await dex.balances(accounts[0], web3.utils.fromUtf8("LINK"))
      assert.equal(balance.toNumber(), 100)
    })

    it("should prohibit withdrawals larger than balance amount", async () => {
      let dex = await Dex.deployed()
      let link = await Link.deployed()

      await truffleAssert.reverts(
        dex.withdraw(1000, web3.utils.fromUtf8("LINK")));
    })

    it("should allow withdrawals with enough balance in account", async () => {
      let dex = await Dex.deployed()
      let link = await Link.deployed()

      await truffleAssert.passes(dex.withdraw(100, web3.utils.fromUtf8("LINK")))
    })
})














