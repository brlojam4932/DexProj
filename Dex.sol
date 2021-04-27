// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 < 0.9.0;
pragma abicoder v2;

import "./Wallet.sol";

contract Dex is Wallet {

  using SafeMath for uint256;

  enum Side {BUY, SELL} // 0, 1

  struct Order {
    uint256 id;
    address trader;
    Side side;
    bytes32 ticker;
    uint256 amount;
    uint256 price;
  }

  // as enum
  // order.side = Side.BUY;
  // as boolean
  // order.BUY = true;

  mapping(bytes32 => mapping(uint256 => Order[])) public OrderBook;

  function getOrderBook(bytes32 ticker, Side side) public view returns(Order[] memory) {
    return OrderBook[ticker][uint(side)];
    //getOrderBook(bytes32("LINK"), Side.BUY); Filip converts it here but says it's not
    //necessary as we have done it above
  }

  function depositEth(bytes32 ticker, uint256 amount) public {
    balances[msg.sender][ticker] = balances[msg.sender][ticker].add(amount);

  }

  function createLimitOrder(Side side, bytes32 ticker, uint amount, uint price) public view {
      if(side == Side.BUY) {
        require(balances[msg.sender]["ETH"] >= amount.mul(price), "Not enough Eth balance");
      } else if (side == Side.SELL) {
        require(balances[msg.sender][ticker] >= amount, "not enough token balance");
      }
    
  }


}