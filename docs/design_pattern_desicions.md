Each header lists a design topic, and the sections describe that decision.

## Upgradable Contracts
All methods of implementing upgradable contracts bring their own risks and introduce additional attack surface. Because this contract is only designed to last for one NFL season (September through December), the risk of providing upgradability does not seem worth it. If a bug is found, the functionality described in the below Circuit Breaker section can be used to halt the contract, and fixes can be implemented for next year's contract. Similarly, the short life of the contract means any general improvements or optimizations are better off implemented a new contract in the following year.

## Circuit Breaker
Open Zeppelin's `Pausable.sol` was implemented to allow the game to be paused if a major bug was found. Once the contract is paused, there are currently very few options. There is currently no functionality to refund money during the paused state (due to time constraints, but this would likely be a worthwhile addition if deploying this contract live).

One option for refunding money, which requires trust of the owner, is to modify the backend API. For example, every week have it return two random, unowned addresses as the remaining players. This keeps the game going until week 17, but without calling any functions that make payouts. On week 17, again change the API to return every entered player as the winner, and each player will then have the ability to withdraw their entry fee (assuming the cost of executing the `for` loop is under the block gas limit).

If users trust the owner, and if block gas limit is a concern, we can instead immediately (without waiting for week 17) have the API return the owner as the winner, and have the owner manually refund the money.

## Libraries / Inherited Contracts
Libaries and inherited contracts were inlined into `Survivor.sol` as this makes the contract more readable, and makes it simpler to verify the code on Etherscan. Veryifying the code is important as it provides an additional layer of confidence to the users.

## Obtaining Game Results
We need some way to obtain the game results each week, and Oraclize is a common option. The downside here is that it would get pretty costly to parse the results and determine the winners on-chain.

Instead, I decided to write a simple server that does this step for us, and instead returns the list of remaining players to the contract. More details, including other options considered, can be found here.

## Scheduling Transactions
Game results need to be obtained each week, and it would be ideal if there were automated instead of needing to fetched manually via a function call. There are a few different ways to do this.

[Ethereum Alarm Clock](https://www.ethereum-alarm-clock.com/) is one approach, but this is only deployed on Ropsten. It also relies on incentivizing humans to make the function call and therefore cannot be tested. Transactions can also be scheduled through [Geth](https://geth.ethereum.org/) or [Parity](https://www.parity.io/), but I do not run a node and did not want to set one up for this. Another option would be to run a server that calls the functions weekly. The downside of these last two options is that it's not clear to a user that this is implemented, e.g. they can't see the scheduled transactions when reading the contract.

Oraclize lets you delay calls, and since we are already using Oraclize to obtain game results so this is a great solution. By making the next call to Oraclize in our `__callback` function it becomes trivial to schedule weekly calls to our API each week. So in our constructor, we can compute the time from contract deployment to the first needed call, and use that as our delay input. In the callback function, we then just need to use 1 week each time. Once the pool is over, the `whenGameIsNotOver` modifier will prevent Oraclize from calling the callback, thus ending the recursive call loop.

If interested, a few additional details and options considered for this section and the previous seciton can be found on [this](https://medium.com/@msolomon44/lessons-learned-from-developing-an-nfl-survivor-pool-on-ethereum-992dd4efbb25) Medium article I wrote

## Identifying Teams
There are 32 teams that can be chosen, and the obvious approach for representing teams and a players pick history is using strings. However, strings are expensive and hard to manipulate in Solidity, so this is not a great approach.

Instead, we can map each team to an integer, 1-32, based on the alphabetical order of the full team name (e.g. New York Giants instead of just Giants). The default value of a `uint` is 0, so we start at 1 to make it easier to distinguish between no pick and a pick of the Arizona Cardinals (the first alphabetical team). Conversions between team names and integers are handled on the front-end, so the user never knows they are dealing wiht integers.

This approach makes it easier to keep track of pick history as well. Instead of requiring a variable-sized `string` array, we can used a fixed size `bool` array of length 32. All values initialize to false, and we set index _i-1_ to `true` when team _i_ is chosen. The only downside here is we must remember to use _i-1_ instead of _i_ when indexing the pick history array (since indexing is 0-based and our team mapping is 1-based).