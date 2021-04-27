const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");
const truffleAssert = require('truffle-assertions');

contract("Dex", accounts => {
  it("should throw an error if ETH balance is too low when creating BUY limit orders", async () => {
      let dex = await Dex.deployed()
      let link = await Link.deployed()
      await truffleAssert.reverts(
        dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1) // amount = 10 , price = 1
      )
      await dex.depositEth(web3.utils.fromUtf8("ETH"), 10)
      await truffleAssert.passes(
        dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1)
      )
  })

  //The user must have enough tokens deposited such that token balance >= sell order amount
  it("should throw an error if token balance is too low when creating SELL limit order", async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()
    await debug(truffleAssert.reverts(
        dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1)," this reverts"
    ))
    await debug((link.approve(dex.address, 500)));
    await debug(dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]}))
    await debug(dex.deposit(10, web3.utils.fromUtf8("LINK")));
    await debug(truffleAssert.passes(
        dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1),"this passes"
    ))
})

  it("should arrange BUY Order Book prices from highest to lowest starting at index 0", async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()
    await link.approve(dex.address, 500);
    await dex.depositEth(web3.utils.fromUtf8("ETH"), 3000)
    await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 1, 300)
    await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 1, 100)
    await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 1, 200) //[300, 200, 100]

    let orderBook = await dex.getOrderBook(web3.utils.fromUtf8("LINK"), 0);
    assert(orderBook.length > 0);
    for (let i = 0; i < orderBook.length -1; i++) {
      assert(orderBook[i].price >= orderBook[i + 1]).price, "incorrect order in BUY book"
    }
  })

  it("should arrange SELL Order Book prices from lowest to highest starting at index 0", async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()
    await link.approve(dex.address, 500);
    await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 1, 300)
    await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 1, 200)
    await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 1, 200)
    //[100, 200, 300]
    //orderBook.length -1 -> this allows us to have one more index left to compare with 

    let orderBook = await dex.getOrderBook(web3.utils.fromUtf8("LINK"), 1);
    assert(orderBook.length > 0);

    for(let i = 0; i < orderBook.length -1; i++) {
      assert(orderBook[i].price <= orderBook[i + 1].price, "incorrect order in SELL book");
    }
  })

})

