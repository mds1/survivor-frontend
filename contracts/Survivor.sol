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
  //   ARI	-- 0    DAL -- 8     LAC -- 16    OAK -- 24
  //   ATL	-- 1    DEN -- 9     LAR -- 17    PHI -- 25
  //   BAL	-- 2    DET -- 10    MIA -- 18    PIT -- 26
  //   BUF	-- 3    GB	-- 11    MIN -- 19    SEA -- 27
  //   CAR	-- 4    HOU -- 12    NE	 -- 20    SF	-- 28
  //   CHI	-- 5    IND -- 13    NO	 -- 21    TB  -- 29
  //   CIN	-- 6    JAX -- 14    NYG -- 22    TEN -- 30
  //   CLE	-- 7    KC	-- 15    NYJ -- 23    WAS -- 31
  uint256 constant NUMBER_OF_TEAMS = 32;
  uint256[NUMBER_OF_TEAMS] TEAMS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];


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


  // Variables for Oraclize ----------------------------------------------------
  mapping(bytes32 => bool) validIds; // used for validating Query IDs
  uint constant gasPriceForOraclize = 15000000000 wei; // for Oraclize callback, 15 Gwei

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
  // Contract ownership handled by Ownable


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
    require(now <= ENTRY_DEADLINE);
    _;
  }

  // Ensure pick deadline has not passed
  modifier onlyBeforePickDeadline() {
    require(now <= currentPickDeadline);
    _;
  }

  // Ensure caller has not been eliminated
  modifier onlyPlayersWhoJoined() {
    require(
      players[msg.sender].hasJoined);
    _;
  }

  // Ensure team has not yet been chosen
  modifier onlyAllowNewTeams(uint256 _team) {
    require(
      !players[msg.sender].picks[_team]);
    _;
  }

  // Ensure all games for this week have ended
  modifier onlyAfterThisWeeksGamesEnd() {
    require(
      now >= currentWeekGameEnd);
    _;
  }


  // ===========================================================================
  //                                Constructor
  // ===========================================================================
  function Survivor(uint256 _entryFee, uint256 _entryDeadline, uint256 _firstWeekGameEnd)
    public
  {

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
  {

    // CHECKS
    // Ensure required Ether was sent
    require(msg.value == ENTRY_FEE);
    // Ensure this address has not joined already
    require(!players[msg.sender].hasJoined);

    // EFFECTS
    // Update variables to indicate that player has joined
    players[msg.sender].hasJoined = true;
    playersEntered.push(msg.sender);
    numPlayersRemaining = numPlayersRemaining.add(1);
    // players[msg.sender].picks defaults to all false, so doesn't need to be updated

    LogNewPlayerJoined(msg.sender);

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
  {

    // CHECKS
    // Most checks handled with modifiers. We do not validate that a player is
    // not eliminated. That is handled on the server. Handling it here makes the
    // smart contract logic complicated and gas costs get expensive

    // Make sure valid team is selected
    require(_team >= 0 && _team <= 31);

    // EFFECTS
    // Update the players current pick
    players[msg.sender].currentPick = _team;
    // Update their history of picks
    players[msg.sender].picks[_team] = true;

    LogPickMade(msg.sender, _team);

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
  {

    // CHECKS
    // All checks handled with modifiers

    // EFFECTS
    uint oldteam = players[msg.sender].currentPick = _team;
    uint newteam = _team;
    // TODO -- not yet implemented

    LogPickChanged(msg.sender, oldteam, newteam);

  } // end changePick



  /**
   * @dev Begins process of getting this weeks results from the server
   */
  function getThisWeeksResults()
    public
    onlyOwner
    onlyAfterThisWeeksGamesEnd
    whenNotPaused
  {
    // CHECKS
    // Checks handled with modifiers

    // Send query
    bytes32 queryId = oraclize_query(
      "nested",
      "[URL] ['json(https://api.random.org/json-rpc/1/invoke).result.random[\"data\"]', '\\n{\"jsonrpc\": \"2.0\", \"method\": \"generateSignedIntegers\", \"params\": { \"apiKey\": \"${[decrypt] BOxGYn1YIfhJZHTFQKSKZ/G5K2eeUwOnlCZeOOlNdm3ZKoguY0DLeJxaOqHl66GgmTqd7NEYY2g6omOhCguFQUZlz3CyQk8WmEZ5FKWfznFTFCHKkR1CPFoezErj84ukyOnwt6aNAaSJhB5gMWceBRvjVDH/}\", \"n\": 1, \"min\": 1, \"max\": 1000, \"replacement\": true, \"base\": 10${[identity] \"}\"}, \"id\": 14215${[identity] \"}\"}']"
    );

    // Add query ID to mapping
    validIds[queryId] = true;

    // Log that query was sent
    LogOraclizeQuery("Oraclize query was sent, standing by for the answer..");

  } // end


  function prepareForNextWeek()
    private
    onlyAfterThisWeeksGamesEnd
    whenNotPaused
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
    currentWeek = currentWeek.add(1);
    currentPickDeadline += 1 weeks;
    currentWeekGameEnd += 1 weeks;
  } // end prepareForNextWeek


  function preparePayouts()
    private
    onlyAfterThisWeeksGamesEnd
    whenNotPaused
  {

  }



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
  function __callback(bytes32 queryId, string result, bytes proof) public {
    // Only allow Oraclize to call this function
    // require(msg.sender == oraclize_cbAddress());

    // Validate the query ID
    require(validIds[queryId]);

    // Reset mapping of this ID to false (this ensures the callback for a given
    // queryID is never called twice)
    validIds[queryId] = false;

    // get the random number, result is of the form: [268]
    // if we also returned "serialNumber", form would be: [3008768, [268]]
    remainingPlayers = [0x0000000000000000000000000000000000000000];

    // log the new number that was obtained
    LogRemainingPlayersReceived(remainingPlayers);

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


  function getNumberOfPlayers()
    public
    view
    returns(uint256)
  {
    return playersEntered.length;
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
