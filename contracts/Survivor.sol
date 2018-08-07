/*

This contract attempts to follow one of the goals of Vyper, which the Vyper
documentation defines as:

Auditability: Vyper code should be maximally human-readable. Furthermore, it
should be maximally difficult to write misleading code. Simplicity for the
reader is more important than simplicity for the writer, and simplicity for
readers with low prior experience with Vyper (and low prior experience with
programming in general) is particularly important.

For this reason, the following design descisions are used (most of the below is
paraphrased from the Vyper documention):
  - Bounds and overflow checking will be performed on all arithmetic and array
    access operations
  - No inheritance, for reasons similar to those of modifiers
  - No inline assembly, as it removes the ability to search for a variable name
    to find all instances of its modification. Furthermore, assembly is not
    readable to those unfamiliar with it
  - No function or operator overloading, since it is easy to write misleading
    code and
  - No recursive calling, as it prevents setings upper bounds on gas limits
  - No infinite length loops, as they prevent setting upper bounds on gas limits

Rules
  - NFL season begins Thursday, September 6, 2018, at 8:20 pm EST
  - New players will be allowed to enter until Monday at 8:20 pm EST
  - Players will have until that Thursday at 8:00 pm EST to make their pick
      - This gap is to prevent miner manipulation of block timestamps

Notes
  - To get epoch timestamp, use https://www.epochconverter.com/

Notation
  - Constant variables are written in UPPERCASE

Architecture (idea)
  - Upon creating the contract, we define the entry fee and deadline, and a time
    by which all week 1 games are over
  - We now allow players to join the pool and make week 1 picks
  - After week 1 games end, we make a query to our server using Oraclize
      - If number of players remaining = 1, we return the winning address
      - Otherwise, the server maintains the list of remaining vs. eliminated
        players and we use that to properly display the front-end


  - In the contract, we store a list of players, their current pick, and their
    historical picks
      - This is how we verify a pick is ok when submitted
      - However, we do not verify that a player is still alive (i.e. not
        eliminated) on the smart contract. If they make a pick and are
        eliminated, it will get ignored by the server
  - We also store the total number of players remaining
  - If the total remaining players is 1, we reach out to our API and figure out
    who that player is
  - This architecture is not yet implemented
*/

pragma solidity ^0.4.24;

contract Survivor {

  // ===========================================================================
  //                             State Variables
  // ===========================================================================

  // Variables for entering the contract ---------------------------------------
  // fee required to enter
  uint256 public ENTRY_FEE;
  // timestamp of entry deadline
  uint256 public ENTRY_DEADLINE;


  // NFL details ---------------------------------------------------------------
  // integer 1-17, NFL week number
  uint8 public currentWeek;
  // to avoid strings, use numbers to alphabetically map the teams, such that:
  //   ARI	-- 0    DAL -- 8     LAC -- 16    OAK -- 24
  //   ATL	-- 1    DEN -- 9     LAR -- 17    PHI -- 25
  //   BAL	-- 2    DET -- 10    MIA -- 18    PIT -- 26
  //   BUF	-- 3    GB	-- 11    MIN -- 19    SEA -- 27
  //   CAR	-- 4    HOU -- 12    NE	 -- 20    SF	-- 28
  //   CHI	-- 5    IND -- 13    NO	 -- 21    TB  -- 29
  //   CIN	-- 6    JAX -- 14    NYG -- 22    TEN -- 30
  //   CLE	-- 7    KC	-- 15    NYJ -- 23    WAS -- 31
  uint256 constant NUMBER_OF_TEAMS = 32;
  uint8[NUMBER_OF_TEAMS] TEAMS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];


  // Variables for making weekly picks -----------------------------------------
  // timestamp, deadline to make week 1 picks
  uint256 FIRST_PICK_DEADLINE = ENTRY_DEADLINE;
  // timestamp, deadline for current week's pick
  uint256 public currentPickDeadline;


  // Variables to indicate when games are over ---------------------------------
  // timestamp, when all week 1 games are over
  uint256 FIRST_WEEK_GAME_END;
  // timestamp, when this week's games are over
  uint256 public currentWeekGameEnd;


  // Varaibles for Game Management ---------------------------------------------
  // structure to track info for each player
  struct PlayerInfo {
    bool hasJoined;    // used to ensure players only enter once
    bool[NUMBER_OF_TEAMS] picks; // change index to true once a team is picked
    uint8 currentPick; // integer 0-31 represeting players current pick
  }
  // mapping of players to their status
  mapping(address => PlayerInfo) players;
  // number of players who have entered
  uint256 public numPlayersEntered;
  // number of players remaining
  uint256 public numPlayersRemaining;
  // address of the winner
  address public winningPlayer;


  // Contract States -----------------------------------------------------------
  // define possible states of the contract
  //   Entry           -- users can enter the pool, and can also make their
  //                      picks for the first week
  //   MakePicks       -- users submit their picks for who they think will win
  //                      this week
  //   WaitForGames    -- nothing happens here, we just wait for all of that
  //                      week's games to be completed
  //   DetermineResult -- contract determines weekly winners and eliminates
  //                      players accordingly
  //   Final           -- a winning condition, as described above, has been met


  // Administrative variables --------------------------------------------------
  // Contract owner
  address public OWNER;


  // ===========================================================================
  //                                 Events
  // ===========================================================================



  // ===========================================================================
  //                               Modifiers
  // ===========================================================================

  // Only allow owner to call function
  modifier onlyOwner() {
    require(
      msg.sender == OWNER,
      "Only the contract owner can call this function"
    );
    _;
  }

  // Ensure entry deadline has not passed
  modifier onlyBeforeEntryDeadline() {
    require(
      now <= ENTRY_DEADLINE,
      "This function can only be called before the entry deadline"
    );
    _;
  }

  // Ensure pick deadline has not passed
  modifier onlyBeforePickDeadline() {
    require(
      now <= currentPickDeadline,
      "This function can only be called before the pick deadline"
    );
    _;
  }

  // // Ensure caller has not been eliminated
  // modifier onlyRemainingPlayers() {
  //   require(
  //     players[msg.sender].isAlive,
  //     "This function can only be called by remaining players"
  //   );
  //   _;
  // }

  // Ensure team has not yet been chosen
  modifier onlyAllowNewTeams(uint8 _team) {
    require(
      !players[msg.sender].picks[_team],
      "Each team can only be selected once. Please pick a new team"
    );
    _;
  }

  // Ensure all games for this week have ended
  modifier onlyAfterThisWeeksGamesEnd() {
    require(
      now >= currentWeekGameEnd,
      "This function can only be called one all of this weeks games are over");
    _;
  }

  // ===========================================================================
  //                                Constructor
  // ===========================================================================
  constructor(uint _entryFee, uint _entryDeadline,uint _firstWeekGameEnd)
    public
  {
    // Assign owner
    OWNER = msg.sender;

    // Set entry fee
    ENTRY_FEE = _entryFee;

    // Initialize deadlines
    ENTRY_DEADLINE = _entryDeadline;
    FIRST_PICK_DEADLINE = ENTRY_DEADLINE;
    FIRST_WEEK_GAME_END = _firstWeekGameEnd;

    // Set variables to week 1 conditions
    currentWeek = 1;
    currentPickDeadline = FIRST_PICK_DEADLINE;
    currentWeekGameEnd = FIRST_WEEK_GAME_END;
  }



  // ===========================================================================
  //                                Methods
  // ===========================================================================

  // FUNCTION joinPool ---------------------------------------------------------
  //   When a player wants to join the Survivor pool, they call this function.
  //   Requires ENTRY_FEE to be sent with transaction
  function joinPool()
    external
    payable
    onlyBeforeEntryDeadline
  {

    // CHECKS
    // Ensure required Ether was sent
    require(msg.value == ENTRY_FEE);
    // Ensure this address has not joined already
    require(!players[msg.sender].hasJoined);

    // EFFECTS
    // Update variables to indicate that player has joined
    players[msg.sender].hasJoined = true;
    numPlayersEntered += 1;
    numPlayersRemaining += 1;
    // players[msg.sender].picks defaults to all false, so it doesn't need to be
    // updated

  } // End joinPool


  // FUNCTION makePick ---------------------------------------------------------
  //   Players use this function to make their pick for the week. Picks can be
  //   changed afterwards by calling the changePick funcition
  // INPUTS
  //   _team -- integer representing chosen team, alphabetically mapped to teams
  function makePick(uint8 _team)
    external
    onlyBeforePickDeadline
    onlyAllowNewTeams(_team)
  {

    // CHECKS
    // All checks handled with modifiers. We do not validate that a player is
    // not eliminated. That is handled on the server. Handling it here makes the
    // smart contract logic complicated and gas costs get expensive

    // EFFECTS
    // Update the players current pick
    players[msg.sender].currentPick = _team;
    // Update their history of picks
    players[msg.sender].picks[_team] = true;

  } // End makePick

  // FUNCTION changePick -------------------------------------------------------
  //   Players use this function to change their weekly pick
  // INPUTS
  //   _team -- integer representing chosen team, alphabetically mapped to teams
  function changePick(uint8 _team)
    external
    view
    onlyBeforePickDeadline
    onlyAllowNewTeams(_team)
  {

    // CHECKS
    // All checks handled with modifiers

    // TODO

  } // End changePick


  // FUNCTION finishThisWeek ---------------------------------------------------
  //   Once games for the week are over, server (Oracle) calls this function to
  //   perform the appropriate actions based on the scenario table below
  // INPUTS
  //   TBD
  // OUTPUTS
  //   TBD

  // SCENARIOS (handled on server unless 1 player left):
  /*
            | It was not week 17            | It was week 17
  ----------|-------------------------------|-----------------------------------
  0 Players | Keep eliminated players       | Split pot among eliminated players
  Left      | Next State: MakePicks         | Next State: Final
  ----------|-------------------------------|-----------------------------------
  1 Player  | Pay winner                    | Pay winner
  Left      | Next State: Final             | Next State: Final
  ----------|-------------------------------|-----------------------------------
  >1 Players| Prepare for next week         | Split pot among remaining players
  Left      | Next State: MakePicks         | Next State: Final
  ----------|-------------------------------|-----------------------------------
  */
  function finishThisWeek()
    public
    onlyOwner
    onlyAfterThisWeeksGamesEnd
  {
    // CHECKS
    // Checks handled with modifiers


    // EFFECTS
    // Get results from Oracle
    // If the returned call begins with "T", we have winners
    // If the returned call begins with "F", we continue on to next week
    bool weHaveWinners = true;

    // TOP ROW -----------------------------------------------------------------
    if (weHaveWinners) {
      preparePayouts();
    } else {
      prepareForNextWeek();
    }

  } // end


  function prepareForNextWeek()
    private
    onlyAfterThisWeeksGamesEnd
  {
    // CHECKS
    // Ensure only this contract is calling this
    // Ensure all games for this week have ended

    // Make sure this wasn't the last week
    require(currentWeek < 17);
    // Make sure there are players remaining
    require(numPlayersRemaining > 1);

    // EFFECTS
    // Update deadlines
    currentWeek += 1;
    currentPickDeadline += 1 weeks;
    currentWeekGameEnd += 1 weeks;
  } // end prepareForNextWeek


  function preparePayouts()
    private
    onlyAfterThisWeeksGamesEnd
  {

  }



}
