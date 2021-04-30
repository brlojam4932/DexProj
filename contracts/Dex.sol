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

  uint public nextOrderId = 0;

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

  function depositEth() external payable {
    balances[msg.sender][bytes32("ETH")] = balances[msg.sender][bytes32("ETH")].add(msg.value);

  }

  function createLimitOrder(Side side, bytes32 ticker, uint amount, uint price) public {
      if(side == Side.BUY) {
        require(balances[msg.sender]["ETH"] >= amount.mul(price), "Not enough Eth balance");
      } else if (side == Side.SELL) {
        require(balances[msg.sender][ticker] >= amount, "Low token balance");
      }

      Order[] storage orders = OrderBook[ticker][uint(side)];
      orders.push(Order(nextOrderId, msg.sender, side, ticker, amount, price));

      //Bubble sort
      uint i = orders.length > 0 ? orders.length -1 : 0;
      //defines the start, if array is empty it equals 0; shortened if statement

      if(side == Side.BUY){
        for (i = 0; i < orders.length -1; i++) {
          if (orders[i].price < orders[i + 1].price) {
            
              Order memory swap = orders[i + 1];
              orders[i + 1] = orders[i];
              orders[i] = swap;
              i++; 
            }
        }
      }
      else if(side == Side.SELL) {
        for (i = 0; i < orders.length -1; i++) {
          if (orders[i].price > orders[i + 1].price) {
            
              Order memory swap = orders[i + 1];
              orders[i + 1] = orders[i];
              orders[i] = swap;
              i++; 
            }
        }
        
      }
      nextOrderId++;
    
  }

}
