## Details
Security analysis conducted using [Mythril](https://github.com/ConsenSys/mythril)
* Date: 2018-Aug-23
* Contract version: From commit `e8c1daee6271cb21cc7b212e022ff773337f8db1`
* Analysis: Ran `myth --truffle` on referenced version of the contract (before gas optimizations)

Outputs are pasted below for `Survivor.sol`. Outputs for library contracts are not included

## Summary
Security analysis summary:
* Informational: 2
* Warning: 2

One informational result was simply a declaration of an array of addresses, and can be safely ignored. The second informational result was about a call to an OpenZeppelin contract,which is trusted, and therefore this message can be safely ignored as well.

The two warnings were about a possible overflow on array length. A limit of 100,000 players was added (checked in the `joinPool` function) in response to this.


## Output
```
# Analysis result for Survivor:

==== Exception state ====
Type: Informational
Contract: Survivor
Function name: remainingPlayers(uint256)
PC address: 2760
A reachable exception (opcode 0xfe) has been detected. This can be caused by type errors, division by zero, out-of-bounds array access, or assert violations. This is acceptable in most situations. Note however that `assert()` should only be used to check invariants. Use `require()` for regular input checking.
--------------------
In file: Survivor.sol:134

address[] public remainingPlayers

--------------------

==== Message call to external contract ====
Type: Informational
Contract: Survivor
Function name: withdrawPayments()
PC address: 3382
This contract executes a message call to to another contract. Make sure that the called contract is trusted and does not execute user-supplied code.
--------------------
In file: Survivor.sol:13

ion defines as:

Audit

--------------------

==== Integer Overflow ====
Type: Warning
Contract: Survivor
Function name: getWinningPlayers()
PC address: 3745
A possible integer overflow exists in the function `getWinningPlayers()`.
The addition or multiplication may result in a value higher than the maximum representable integer.
--------------------
In file: Survivor.sol:677

return winningPlayers

--------------------

==== Integer Overflow ====
Type: Warning
Contract: Survivor
Function name: getWinningPlayers()
PC address: 3747
A possible integer overflow exists in the function `getWinningPlayers()`.
The addition or multiplication may result in a value higher than the maximum representable integer.
--------------------
In file: Survivor.sol:677

return winningPlayers

--------------------
```