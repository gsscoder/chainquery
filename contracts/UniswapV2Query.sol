pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint256) external view returns (address pair);
    function allPairsLength() external view returns (uint256);
}

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);
}

contract UniswapV2Query is Ownable {

    struct Token {
        address address_;
        string symbol;
        string name;
        uint8 decimals;
    }

    function getPairsLenght(address factoryAddr) external onlyOwner view returns (uint256) {
        IUniswapV2Factory factory = IUniswapV2Factory(factoryAddr);
        return factory.allPairsLength();
    }

    function getPairsByRange(address factoryAddr, uint256 fromIndex, uint256 toIndex) external onlyOwner view returns (address[3][] memory)  {
        require(fromIndex <= toIndex, "fromIndex cannot be greater than toIndex");
        IUniswapV2Factory factory = IUniswapV2Factory(factoryAddr);
        uint256 _length = factory.allPairsLength();
        require (toIndex < _length, "toIndex cannot be greater than all pairs length");
        uint256 quantity = (toIndex - fromIndex) + 1;
        address[3][] memory result = new address[3][](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            IUniswapV2Pair pair = IUniswapV2Pair(factory.allPairs(fromIndex + i));
            result[i][0] = pair.token0();
            result[i][1] = pair.token1();
            result[i][2] = address(pair);         
        }
        return result;
    }

    function getERC20Token(address address_) public onlyOwner view returns (Token memory) {
        Token memory result;
        IERC20 token = IERC20(address_);
        result.address_ = address_;
        try token.symbol() returns (string memory s) {
            result.symbol = s;
        } catch { }
        try token.name() returns (string memory n) {
            result.name = n;
        } catch { }
        try token.decimals() returns (uint8 d) {
            result.decimals = d;
        } catch { }
        return result;
    }    

    function getERC20Tokens(address[] calldata tokens) external onlyOwner view returns (Token[] memory) {
        Token[] memory result = new Token[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            result[i] = getERC20Token(tokens[i]);
        }
        return result;
    }    
}
