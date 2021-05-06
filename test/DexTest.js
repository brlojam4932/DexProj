const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");
const truffleAssert = require('truffle-assertions');


contract.skip("Dex", accounts => {
 
  it("should throw an error if ETH balance is too low when creating BUY limit orders", async () => {
      let dex = await Dex.deployed()
      let link = await Link.deployed()
      await truffleAssert.reverts(
        dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1) // amount = 10 , price = 1
      )
      await dex.depositEth({value:10})
      await truffleAssert.passes(
        dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1)
      )
  });

  //The user must have enough tokens deposited such that token balance >= sell order amount
  it("should throw an error if token balance is too low when creating SELL limit order", async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()
    await truffleAssert.reverts(
        dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1)
    )
    await link.approve(dex.address, 500);
    await dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})
    await dex.deposit(10, web3.utils.fromUtf8("LINK"));
    await truffleAssert.passes(
        dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1)
    )
});

  it("should arrange BUY Order Book prices from highest to lowest starting at index 0", async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()
    await link.approve(dex.address, 500);
    await dex.depositEth({value: 3000});
    await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 1, 300)
    await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 1, 100)
    await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 1, 200) //[300, 200, 100]

    let orderBook = await dex.getOrderBook(web3.utils.fromUtf8("LINK"), 0);
    assert(orderBook.length > 0);
    console.log(orderBook);
    
    for(let i = 0; i < orderBook.length -1; i++) {
      assert(orderBook[i].price >= orderBook[i + 1].price, "incorrect order in BUY Order Book");
    }
  });

  it("should arrange SELL Order Book prices from lowest to highest starting at index 0", async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()
    await link.approve(dex.address, 500);
    await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 1, 300)
    await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 1, 100)
    await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 1, 200)
    //[100, 200, 300]
    //orderBook.length -1 -> this allows us to have one more index left to compare with 

    let orderBook = await dex.getOrderBook(web3.utils.fromUtf8("LINK"), 1);
    assert(orderBook.length > 0);
    console.log(orderBook);

    for(let i = 0; i < orderBook.length -1; i++) {
      assert(orderBook[i].price <= orderBook[i + 1].price, "incorrect order in SELL Order Book");
    };
  });

});

contract("Dex2", accounts => {
  //==============MARKET ORDERS=========================================

  // when creating a SELL market order, the sellar needs to have enough tokens for the trade
  it ("should throw an error if insuficient amount of tokens when creating a SELL market order", 
  async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()
    await truffleAssert.reverts(
      dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 1000, 1)
    )
    await link.approve(dex.address, 500);
    await dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]});
    await dex.deposit(10, web3.utils.fromUtf8("LINK"));
    await truffleAssert.passes(
      dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 10, 1)
    )
  }); 

  // when creating a BUY market order, the buyer needs to have enough ETH for the trade
  it ("should have enough ETH for the trade when creating a BUY marker order",
  async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()
    await truffleAssert.reverts(
      dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 3100, 1)
    )
    await dex.depositEth({value: 10});
    await truffleAssert.passes(
      dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 10, 1)
    )
  });

  // Market orders can be submitted even if the order book is empty
  it ("should submit orders even if the order book is empty",
  async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()

    let orderBook = await dex.getOrderBook(web3.utils.fromUtf8("LINK"), 0)
    assert(orderBook.length === 0);
    console.log(orderBook);

    await dex.depositEth({value: 1000});
    await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 1, 300)
    await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 1, 100)
    await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 1, 200)
    
  });

  // Market orders should be filled until the order book is empty or the market order is 100% filled
  it ("should fill Market orders until order book is empty or market order is 100% filled",
  async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()

    await link.approve(dex.address, 500);
    await dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})
    await dex.deposit(10, web3.utils.fromUtf8("LINK"));
    await dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 1, 300)
    await dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 1, 100)
    await dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 1, 200)
    
    await dex.depositEth({value: 1000});
    await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 1, 300)
    await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 1, 100)
    await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 1, 200)

    // transfer Link tokens from account[0] to wallet for sell market orders
    // withdraw eth from wallet buying link at market price
    //link.transferFrom(dex.address, link.address, 500)

    let orderBook = await dex.getOrderBook(web3.utils.fromUtf8("LINK"), 1)

    for(let i = 0; i < orderBook.length; i++) {
      assert(orderBook.length === 0, "Orders not filled");
    }
    console.log(orderBook);
    
  });
  // The ETH balance of the buyer should decrease with the filled amounts.
  it ("should decrease the buyer's ETH balance from the filled amounts", 
  async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()

    // transactions here
    await link.approve(dex.address, 500);
    await dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})
    await dex.deposit(10, web3.utils.fromUtf8("LINK"))
    await dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 1, 300)

    await dex.depositEth({value: 1000})
    await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 1, 300)
    
    await dex.withdrawEth({value: 300})
    let balance = await dex.balances(accounts[0], web3.utils.fromUtf8("ETH"))

    assert.isBelow(balance.toNumber(), 3010); // total eth deposited

  });
  // The token balances of the limit order sellers should decrease with the filled amounts.
  it("should decrease seller's limit orders token balances once filled", 
  async () => {
    let dex = await Dex.deployed()
    let link = await Link.deployed()

    //function approve(address spender, uint256 amount)
    await link.approve(dex.address, 500)
    await dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})
    await dex.deposit(10, web3.utils.fromUtf8("LINK"))
    
    await dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 1, 300)
    
    await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 1, 300)

    assert(link.balanceOf(dex.address < 10));

  })
  // Filled limit orders should be removed from the orderbook

});

