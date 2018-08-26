## Initial Cost
Initial deployment cost is 6,928,099 gas. This is under the block limit and deployable, but still fairly high. Let's try a few quick things to get this closer to 6 million so we have some more margin

## Final Cost
Cut down gas about 15% to 5.85 million million. Details are below.

## Details
1. Removed `FIRST_PICK_DEADLINE` and `FIRST_WEEK_GAME_END` since they didnt really do anything
    * New deployment cost: 6,880,433
    * Gas savings: 47,666

2. Removed the `TEAMS` array since it was never used
    * New deployment cost: 6,208,448
    * Gas savings: 671,995

3. When the game ends, `remainingPlayers === winningPlayers`, so we can remove the variable-sized `winningPlayers` array. This required updating the `getWinningPlayers()` helper function to ensure the game was over before returning the `remainingPlayers` array
    * New deployment cost: 6,182,428
    * Gas savings: 26,020

4. `NUMBER_OF_TEAMS` is only used once when defining the `PlayerInfo` struct, and that will never change, so we can hardcode it
   * No change. I assume this was handled by the optimizer before

5. Incorporated the `changePick()` functionality into `makePick()`, which reduces gas costs and simplifies front end logic
    * New deployment cost: 5,854,399
    * Gas savings: 237,602

After this brief optimization, constructor inputs were moved to become constants, and contract payout logic was slightly modified to improve security and fix bugs. Therefore the deployment cost may differ slightly from the final number given above.