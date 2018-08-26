Each header lists a potential problem and the sections describe how that problem was avoided.

## Overflow/Underflow
Values in this contract can only be incremented 1 at a time, making it effectively imposible to have an overflow on a `uint256`. The exception to this is the total value, which is incremented by 0.1 ETH each time someone joins. There are no signed ints in this contract, so underflow is not a concern. Although it seems impossible to reach an overflow, precautions were taken anyway to ensure contract safety. These precautions were:
1. Thse use of SafeMath for all math operations
2. Checking the user input (team selection, as an integer), prior to using that input
3. Limiting the number of players who can enter to prevent array sizes from overflowing

## Exposed API Keys
This was avoided by using an encrypted query for the Oraclize call to our API. This query requires a MySportsFeeds API key to obtain game results, which needs to be kept hidden.

## External Calls
All calls are to trusted contracts by either OpenZeppelin or Oraclize. Regardless, the checks-effects-interactions pattern is used throughout as an additional security measure.

## Pull vs. Push Payments
Payments are handled with both push and pull, depending on the specific payment, with the following justification:
* The GiveDirectly charity payout is always handled first as a push payment. This is an actively used address and trusted organization, therefore it is acceptable to push a payment to them
* Winner payouts are handled afterwards in the following ways:
    * Sole winners receive their payments via push payment. This is ok because if someone deliberately enters from a contract that would cause `address.transfer()` to fail, and they are the sole winner, there is no risk to other players since all the money is owed to the malicious actor anyway. Furthermore, all state changes and other actions have already occured, and this is the final action. Therefore, a push payment is ok here.
    * For multiple winners, `asyncTransfer()` is used from OpenZeppelin's `PullPayment.sol` contract in order to configure push payments for each winner. These push payments are configured in a loop, which poses cost risks, but Survivor pools never have more than a handful of winners so the risk of the for loop exceeding the block gas limit is small.

## Denial of Service (DoS)
A DoS attack can happen in two ways:
1. Unexpected reverts, e.g. if one operation fails in a loop
2. Reaching the block gas limit by performing operations in a loop

Because we require a for loop when there are multiple winners, this contract is vulnerable to both of these attacks. Attack 1 is prevented through the use of pull payments as described in the previous section. Because we call our own function to prepare the payouts, there is no way a malicious actor could cause this function call within the loop to fail.

However, we are vulnerable to the second attack depending on how many winners there are. In situations like this, it is good practice to plan for the loop to take place over multiple blocks. This setup brings additional considerations, such as ensuring the contract state stays constant between blocks, and needing someone to call the function again. Due to the nature of Survivor pools, there are only ever a handful of winners. Because of this, it is safe to assume we can fit all payouts within one block.

## Timestamp Dependence
This is an important consideration here since we don't want people making picks after a game has started. We also don't want miners to be able to squeeze their picks in immediately after a game has started, as sometimes there are quick touchdowns that can sway the odds.

Condequently, we cautiously set deadlines to about 15-20 minutes before the start time of each week's first game, to prevent any manipulation. This allows us to tolerate the +/- 30 second drift that can result from `block.timestamp`, and this margin makes `now` and `block.timestamp` safe for  use.

## Race Conditions / Reentrancy
The checks-effects-interactions approach is used to mitigate this risk. Furthermore, very few functions are exposed to the user, and the ones that are do not allow for much damage should control flow somehow be taken over during execution of these exposed functions.
