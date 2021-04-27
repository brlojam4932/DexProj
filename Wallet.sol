// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 < 0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable {

  using SafeMath for uint256;

  struct Token {
    bytes32 ticker;
    address tokenAddress;
  }

  mapping(bytes32 => Token) public tokenMapping;
  bytes32[] public tokenList;

  mapping(address => mapping(bytes32 => uint256)) public balances;

  modifier tokenExists(bytes32 ticker){
    require(tokenMapping[ticker].tokenAddress != address(0), "Token does not exist");
    _;
  }

  function addToken(bytes31 ticker, address tokenAddress) external onlyOwner {
    tokenMapping[ticker] = Token(ticker, tokenAddress);
    tokenList.push(ticker);
    //bytes32("LINK"); // BYTES 32 VALUE FROM A STRING
  }

  function deposit(uint256 amount, bytes32 ticker) external tokenExists(ticker) {
    IERC20(tokenMapping[ticker].tokenAddress).transferFrom(msg.sender, address(this), amount);
    balances[msg.sender][ticker] = balances[msg.sender][ticker].add(amount);
  }

  function withdraw(uint256 amount, bytes32 ticker) external tokenExists(ticker) onlyOwner {
    require(balances[msg.sender][ticker] >= amount, "Balance not sufficient");
    
    balances[msg.sender][ticker] = balances[msg.sender][ticker].sub(amount);
    IERC20(tokenMapping[ticker].tokenAddress).transfer(msg.sender, amount);
  }

}