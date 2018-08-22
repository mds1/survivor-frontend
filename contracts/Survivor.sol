pragma solidity ^0.4.19;

// Import libraries
// (note: Pausable is Ownable, so we don't need to import Ownable)
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/payment/PullPayment.sol";
import "./usingOraclize.sol";

/*

This contract attempts to follow one of the goals of Vyper, which the Vyper
documentation defines as:

Auditability: Vyper code should be maximally human-readable. Furthermore, it
should be maximally difficult to write misleading code. Simplicity for the
reader is more important than simplicity for the writer, and simplicity for
readers with low prior experience with Vyper (and low prior experience with
programming in general) is particularly important.

For this reason, the following design descisions are used (a lot of the below is
paraphrased from the Vyper documention):
  - The above modules will be moved inline later to improve readability (and to
    help with verifying code on Etherscan)
  - Bounds and overflow checking will be performed on all arithmetic and array
    access operations
  - No inline assembly, as it removes the ability to search for a variable name
    to find all instances of its modification. Furthermore, assembly is not
    readable to those unfamiliar with it
  - No function or operator overloading, since it is easy to write misleading
    code and
  - No recursive calling, as it prevents setings upper bounds on gas limits
    (exception here is using Oraclize to schedule weekly API calls)

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

/**
 * @title Survivor
 * @dev NFL Survivor Contract
 */
contract Survivor is Pausable, usingOraclize {
  using SafeMath for uint;

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
  uint256 public currentWeek;
  // to avoid strings, use numbers to alphabetically map the teams, such that:
  //   ARI	-- 1    DAL -- 9     LAC -- 17    OAK -- 25
  //   ATL	-- 2    DEN -- 10    LAR -- 18    PHI -- 26
  //   BAL	-- 3    DET -- 11    MIA -- 19    PIT -- 27
  //   BUF	-- 4    GB	-- 12    MIN -- 20    SEA -- 28
  //   CAR	-- 5    HOU -- 13    NE	 -- 21    SF	-- 29
  //   CHI	-- 6    IND -- 14    NO	 -- 22    TB  -- 30
  //   CIN	-- 7    JAX -- 15    NYG -- 23    TEN -- 31
  //   CLE	-- 8    KC	-- 16    NYJ -- 24    WAS -- 32

  // Teams start at 1 since uints will default to a value of 0. This helps
  // distringuish between a pick of ARI vs. no pick


  uint256 constant NUMBER_OF_TEAMS = 32;
  uint256[NUMBER_OF_TEAMS] TEAMS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];


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


  // Variables for Game Management ---------------------------------------------
  // structure to track info for each player
  struct PlayerInfo {
    bool hasJoined;    // used to ensure players only enter once
    bool[NUMBER_OF_TEAMS] picks; // change index to true once a team is picked
    uint256 currentPick; // integer 0-31 represeting players current pick
  }
  // mapping of players to their status
  mapping(address => PlayerInfo) public players;
  // array of all entered players (this can't be retrieved from a mapping)
  address[] public playersEntered;
  // array of remaining players that is passed in from the API
  address[] public remainingPlayers;
  // number of players remaining
  uint256 public numPlayersRemaining;
  // address of the winners
  address[] public winningPlayers;

  // Use states to determine what to do with remaining players each week
  // (see __callback function for more info)
  enum State { PrepareForNextWeek, PayOneWinner, PayMultipleWinners };
  State state = State.PrepareForNextWeek;

  // Variables for Oraclize ----------------------------------------------------
  mapping(bytes32 => bool) validIds; // used for validating Query IDs
  uint constant gasPriceForOraclize = 15000000000 wei; // for Oraclize callback, 15 Gwei


  // Administrative variables --------------------------------------------------
  // Contract ownership handled by Ownable

  // Keep track of when game ends to prevent further contract interaction
  bool isGameOver = false;


  // ===========================================================================
  //                                 Events
  // ===========================================================================

  event LogNewPlayerJoined(address indexed player);
  event LogPickMade(address indexed player, uint256 indexed team);
  event LogPickChanged(address indexed player, uint256 indexed oldteam, uint256 indexed newteam);
  event LogOraclizeQuery(string description);
  event LogRemainingPlayersReceived(address[] indexed players);


  // ===========================================================================
  //                               Modifiers
  // ===========================================================================

  // In addition to the modifiers below, the following additional used modifiers
  // exist from the imports defined at the top of this file:
  //   whenPaused    [Pausable.sol]
  //   whenNotPaused [Pausable.sol]
  //   onlyOwner     [Pausable.sol is Ownable.sol]

  // Ensure entry deadline has not passed
  modifier onlyBeforeEntryDeadline() {
    require(
      now <= ENTRY_DEADLINE,
      "The entry deadline has passed, so this function cannot be called");
    _;
  }

  // Ensure pick deadline has not passed
  modifier onlyBeforePickDeadline() {
    require(
      now <= currentPickDeadline,
      "The weekly pick deadline has passed, so this function cannot be called");
    _;
  }

  // Ensure caller has not been eliminated
  modifier onlyPlayersWhoJoined() {
    require(
      players[msg.sender].hasJoined,
      "Only players who have not been eliminated can call this function");
    _;
  }

  // Ensure team has not yet been chosen
  modifier onlyAllowNewTeams(uint256 _team) {
    require(
      !players[msg.sender].picks[_team],
      "Teams can only be picked one. Please pick a new team");
    _;
  }

  // Ensure all games for this week have ended
  modifier onlyAfterThisWeeksGamesEnd() {
    require(
      now >= currentWeekGameEnd,
      "This function can only be called once this week's games end");
    _;
  }

  // Only allow function calls when game is not over
  modifier whenGameIsNotOver() {
    require(
      !isGameOver,
      "This function cannot be called because the game is over");
    _;
  }


  // ===========================================================================
  //                                Constructor
  // ===========================================================================
  constructor(uint256 _entryFee, uint256 _entryDeadline, uint256 _firstWeekGameEnd)
    public
  {

    // EFFECTS
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

    // Set Oraclize proof type
    oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);

    // Set gas price for Oraclize callback
    oraclize_setCustomGasPrice(gasPriceForOraclize);

    // At the time of deployment, we kick-off sending weekly Oraclize queries.
    // First we compute the time remaining until we want to call the API
    uint timeRemaining = now - currentWeekGameEnd;


    // INTERACTIONS
    // Now we schedule the Oraclize call, which is calls our custom API
    // deployed on Heroku
    //   GitLab for this API: https://github.com/mds1/survivor-backend
    //   Heroku site: https://survivor-backend.herokuapp.com/api/getresults?apikey=My-MySportsFeeds-v2.0-API-Key
    //
    //   The query to the API is encrypted to hide my API key (it's easier and
    //   presumably cheaper to just encrypt the who query instead of only
    //   encrypting the API key and then using the nested data source)
    oraclize_query(
      timeRemaining,
      "URL",
      "BLMs5ftOLkLj1AGjL0nuHz/jcEWHvlU5lJ9qtX0MnK9Q+bDAJHL61bjeVZvkTiohthHHCY8pI6s8l8iY+mKGTFlMcuM05BSHOWdxbUHWT9U6Qev72WWWEyDlmJ6wSL53J25xRJ8h24WHahYXGQszc2oWIvsRAXwvAm43J0mIaoQcl1FPaIqe4zxxE7625BiapLQcLen/pdqr6bi+2FLMW8UMV8yxUiATQrLjMgfaoFHAgOCk21lfEzOWxMKzurWYeW0C"
    );

  }



  // ===========================================================================
  //                                Methods
  // ===========================================================================

  // In addition to the functions below, the following additional used functions
  // exist from the imports defined at the top of this file:
  //   asyncTransfer    [PullPayment.sol]


  /**
   * @dev Allows players to join the pool if they send the required entry fee
   */
  function joinPool()
    external
    payable
    onlyBeforeEntryDeadline
    whenNotPaused
    whenGameIsNotOver
  {

    // CHECKS
    // Ensure required Ether was sent
    require(
      msg.value == ENTRY_FEE,
      "The entry fee must be sent to join the pool");

    // Ensure this address has not joined already
    require(
      !players[msg.sender].hasJoined,
      "You have already joined the pool. Only one entry allowed per player");

    // EFFECTS
    // Update variables to indicate that player has joined
    players[msg.sender].hasJoined = true;
    playersEntered.push(msg.sender);
    numPlayersRemaining = numPlayersRemaining.add(1);
    // players[msg.sender].picks defaults to all false, so doesn't need to be updated

    emit LogNewPlayerJoined(msg.sender);

  } // end joinPool


  /**
   * @dev Allows players to make their pick for the week
   * @param _team Integer 0-31 representing chosen team, mapped as shown above
   */
  function makePick(uint256 _team)
    external
    onlyPlayersWhoJoined
    onlyBeforePickDeadline
    onlyAllowNewTeams(_team)
    whenNotPaused
    whenGameIsNotOver
  {

    // CHECKS
    // Most checks handled with modifiers. We do not validate that a player is
    // not eliminated. That is handled on the server. Handling it here makes the
    // smart contract logic complicated and gas costs get expensive

    // Make sure valid team is selected
    require(
      _team >= 1 && _team <= 32,
      "Please select a valid team");

    // EFFECTS
    // Update the players current pick
    players[msg.sender].currentPick = _team;
    // Update their history of picks
    players[msg.sender].picks[_team] = true;
    // Add to remaining players array
    remainingPlayers.push(msg.sender);

    emit LogPickMade(msg.sender, _team);

  } // end makePick


  /**
   * @dev Allows players to change their pick for the week
   * @param _team Integer 0-31 representing chosen team, mapped as shown above
   */
  function changePick(uint256 _team)
    external
    view
    onlyBeforePickDeadline
    onlyAllowNewTeams(_team)
    whenNotPaused
    whenGameIsNotOver
  {

    // CHECKS
    // All checks handled with modifiers

    // EFFECTS
    uint oldteam = players[msg.sender].currentPick = _team;
    uint newteam = _team;
    // TODO -- not yet implemented

    emit LogPickChanged(msg.sender, oldteam, newteam);

  } // end changePick



  /**
   * @dev Callback function for Oralize once it retreives the data
   *
   * SCENARIOS (handled on server unless 1 player left):
   *
   *           | It was not week 17         | It was week 17
   * ----------|----------------------------|-----------------------------------
   * 0 Players | Keep eliminated players    | Split pot among eliminated players
   * Left      | Outcome: Make picks        | Outcome: Game ends
   * ----------|----------------------------|-----------------------------------
   * 1 Player  | Pay winner                 | Pay winner
   * Left      | Outcome: Game ends         | Outcome: Game ends
   * ----------|----------------------------|-----------------------------------
   * >1 Players| Prepare for next week      | Split pot among remaining players
   * Left      | Outcome: Make picks        | Outcome: Game ends
   * ----------|----------------------------|-----------------------------------*/
  function __callback(bytes32 queryId, address[] result, bytes proof)
    public
    onlyAfterThisWeeksGamesEnd
    whenNotPaused
    whenGameIsNotOver
  {
    // CHECKS
    // Only allow Oraclize to call this function
    require(
      msg.sender == oraclize_cbAddress(),
      "Only Oraclize can call this function"
    );

    // Validate the query ID
    require(
      validIds[queryId],
      "Invalid queryID received"
    );

    // EFFECTS
    // Reset mapping of this ID to false (this ensures the callback for a given
    // queryID is never called twice)
    validIds[queryId] = false;

    // Get the array of remaining players
    remainingPlayers = result;

    // Log the remaining players
    emit LogRemainingPlayersReceived(remainingPlayers);

    // Determine scenario based on the above table
    if (remainingPlayers.length == 0) {
      if (week != 17) {
        // TOP LEFT
        state = States.PrepareForNextWeek;
      } else {
        // TOP RIGHT
        state = States.PayMultipleWinners;
      }
    } else if (remainingPlayers.length == 1) {
      // MIDDLE ROW
      state = States.PayOneWinner;
    } else {
      if (week != 17) {
        // BOTTOM LEFT
        state = States.PrepareForNextWeek;
      } else {
        // BOTTOM RIGHT
        state = States.PayMultipleWinners
      }
    }

    // Call appropriate function based on scenarion
    if (state == States.PrepareForNextWeek) {
      prepareForNextWeek();
    } else if (state == States.PayOneWinner) {
      payOneWinner(remainingPlayers);
    } else { // state == States.PayMultipleWinners
      payMultipleWinners(remainingPlayers);
    }


    // INTERACTIONS
    // Schedule the next query to oraclize in 1 week, using the same query that
    // we used in the constructor but with a delay of 1 week (604800 seconds)
    oraclize_query(
      604800,
      "URL",
      "BLMs5ftOLkLj1AGjL0nuHz/jcEWHvlU5lJ9qtX0MnK9Q+bDAJHL61bjeVZvkTiohthHHCY8pI6s8l8iY+mKGTFlMcuM05BSHOWdxbUHWT9U6Qev72WWWEyDlmJ6wSL53J25xRJ8h24WHahYXGQszc2oWIvsRAXwvAm43J0mIaoQcl1FPaIqe4zxxE7625BiapLQcLen/pdqr6bi+2FLMW8UMV8yxUiATQrLjMgfaoFHAgOCk21lfEzOWxMKzurWYeW0C"
    );
  } // end __callback for Oraclize


  function prepareForNextWeek()
    private
    onlyAfterThisWeeksGamesEnd
    whenNotPaused
    whenGameIsNotOver
  {
    // CHECKS
    // Ensure only this contract is calling this
    // Ensure all games for this week have ended

    // Make sure this wasn't the last week
    require(
      currentWeek < 17,
      "This function cannot be called because it is the last week of the season");

    // Make sure there are players remaining
    require(
      numPlayersRemaining > 1,
      "This function cannot be called because a winner has been determined");

    // EFFECTS
    // Update deadlines
    currentWeek = currentWeek.add(1);
    currentPickDeadline += 1 weeks;
    currentWeekGameEnd += 1 weeks;
  } // end prepareForNextWeek


  function payOneWinner(address _address)
    private
    onlyAfterThisWeeksGamesEnd
    whenNotPaused
    whenGameIsNotOver
  {
    // EFFECTS
    // Change state to paused to end the game
    isGameOver = true;
  }


    function payMultipleWinners(address[] _addresses)
    private
    onlyAfterThisWeeksGamesEnd
    whenNotPaused
    whenGameIsNotOver
  {
    // EFFECTS
    // Change state to paused to end the game
    isGameOver = true;
  }



  // ===========================================================================
  //                           Front End Helpers
  // ===========================================================================

  function getEnteredPlayers()
    public
    view
    returns(address[])
  {
    return playersEntered;
  }


  function getRemainingPlayers()
    public
    view
    returns(address[])
  {
    return remainingPlayers;
  }

  function getWinningPlayers()
    public
    view
    returns(address[])
  {
    return winningPlayers;
  }


  function getNumberOfPlayers()
    public
    view
    returns(uint256)
  {
    return playersEntered.length;
  }


  function getPlayersPick(address _player)
    public
    view
    returns(uint256)
  {
    return players[_player].currentPick;
  }


  function getPlayersPickHistory(address _player)
    public
    view
    returns(bool[32])
  {
    return players[_player].picks;
  }


  function getContractBalance()
    public
    view
    returns(uint256)
  {
    return address(this).balance;
  }


  function getTime()
    public
    view
    returns(uint256)
  {
    return block.timestamp;
  }


}
