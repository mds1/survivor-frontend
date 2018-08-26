Each header lists a potential problem and the sections describe how that problem was avoided.

## Overflow/Underflow
This was avoided through:
1. Thse use of SafeMath for all math operations
2. Checking the user input (team selection, as an integer), prior to using that input
3. Limiting the number of players who can enter to prevent array sizes from overflowing

## Exposed API Keys
This was avoided by using an encrypted query for the Oraclize call to our API. This query requires a MySportsFeeds API key to obtain game results, which needs to be kept hidden.

## External Calls
All calls are to trusted contracts by either OpenZeppelin or Oraclize. Regardless, the checks-effects-interactions pattern is used throughout as an additional security measure

## Pull vs. Push Payments
Payments are handled with both push and pull, depending on the specific payment, with the following justification:
* The GiveDirectly charity payout is always handled first as a push payment. This is an actively used address and trusted organization, therefore it is acceptable to push a payment to them
* Winner payouts are handled afterwards in the following ways:
    * Sole winners receive their payments via push payment. This is ok because if someone deliberately enters from a contract that would cause `address.transfer()` to fail, and they are the sole winner, there is no risk to other players since all the money is owed to the malicious actor anyway. Furthermore, all state changes and other actions have already occured, and this is the final action. Therefore, a push payment is ok here.
    * For multiple winners, `asyncTransfer()` is used from OpenZeppelin's `PullPayment.sol` contract in order to configure push payments for each winner. These push payments are configured in a loop, which poses cost risks, but Survivor pools never have more than a handful of winners so the risk of the for loop exceeding the block gas limit is small.


## Timestamp Dependence
This is an important consideration here since we don't want people making picks after a game has started. Therefore, we cautiously set deadlines to about 15-20 minutes before the start time of each week's first game, to prevent any manipulation. This allows us to tolerate the +/- 30 second drift that can result from `block.timestamp`, and this margin makes `now` and `block.timestamp` safe for  use.

## Race Conditions / Reentrancy
The checks-effects-interactions approach is used to mitigate this risk. Furthermore, very few functions are exposed to the user, and the ones that are do not allow for much damage should control flow somehow be taken over during execution of the exposed functions.