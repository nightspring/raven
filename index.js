import { cardInfo } from '/modules/cardInfo.mjs';

// initialize cardsArray
let cardsArray = [];
for(let i = 0; i < 40; i++) {
    cardsArray[i] = i;
}

// initialize scoreboard variables
let usScore = 0;
let themScore = 0;
let currentBid = 0;
let trumpColor = 'None';

// initialize player hands and middle
let playerHand = [];
let partnerHand = [];
let rival1Hand = [];
let rival2Hand = [];
let middle = [];
let discards = [];

// initialize player max bids
let playerBid = 0;
let partnerBid = 0;
let rival1Bid = 0;
let rival2Bid = 0;

// initialize array for storing Interval and Timeout pointers
let intervalArray =  [];
let timeoutArray = [];

// initialize variables relating to bidding
let firstBidder = 'partner';
let highestBidder = '';
let hasPlayerAnswered = false;

// initialize variables relating to player clicking on cards
let canPlayerDiscard = false;
let canPlayerSelectCard = false;

// initialize variables relating to playing cards
let round = 0;
let leadColor = 'none';
let leadPlayer = 'none';
let cardsPlayedThisRound = [];
let cardsWonByPlayerTeam = [];
let cardsWonByRivalTeam = [];


// initialize scoreboard, status update, and game buttons
const usScoreElem = document.querySelector('.usScore');
const themScoreElem = document.querySelector('.themScore');
const currentBidElem = document.querySelector('.currentBid');
const trumpBadgeContainer = document.querySelector('.trump-badge-container');
const trumpElem = document.querySelector('.trumpElem');
const currentStatusElem = document.querySelector('.current-status');
const playGameButton = document.getElementById('playGame');
const resetButton = document.getElementById('resetGame');

// initialize player hand elements
const playerHandContainer = document.querySelector('.player-hand-container');
// the below only selects the first instance of the class
const playerHandImgClass = document.querySelector('.player-hand-img');

// initialize middle card elements
const middleFourContainer = document.querySelector('.middle-four-container');

// initialize inner game table element
const innerGameTableContainer = document.querySelector('.inner-game-table-container');
const partnerCardContainer = document.querySelector('.partner-card-container');
const rival1CardContainer = document.querySelector('.rival1-card-container');
const rival2CardContainer = document.querySelector('.rival2-card-container');
const playerCardContainer = document.querySelector('.player-card-container');

// attaches event listener to game buttons
playGameButton.addEventListener('click', () => startGame());
resetButton.addEventListener('click', () => resetGame());

// define shuffleCards
function shuffleCards() {
    for(let i = cardsArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = cardsArray[i];
        cardsArray[i] = cardsArray[j];
        cardsArray[j] = temp;
    }
}

// define function to clear player hands and middle
function clearHandsAndMiddle() {
    playerHand = [];
    partnerHand = [];
    rival1Hand = [];
    rival2Hand = [];
    middle = [];
}

// define function to populate all player hands and middle
function dealCards() {
    for(let i = 0; i < 9; i++) {
        playerHand.push(cardsArray[i]);
    }
    for(let i = 9; i < 18; i++) {
        partnerHand.push(cardsArray[i]);
    }
    for(let i = 18; i < 27; i++) {
        rival1Hand.push(cardsArray[i]);
    }
    for(let i = 27; i < 36; i++) {
        rival2Hand.push(cardsArray[i]);
    }
    for(let i = 36; i < 40; i++) {
        middle.push(cardsArray[i]);
    }
}

// define update scoreboard function
function updateScoreboardElement(elem, innerHTML, color) {
    elem.innerHTML = innerHTML;

    // updates color word and border on its container
    if(arguments.length > 2) {
        if(color == 'Black') {
            trumpBadgeContainer.style.color = "black";
            trumpBadgeContainer.style.borderColor = "black";
        } else if(color == 'Red') {
            trumpBadgeContainer.style.color = "#B01919";
            trumpBadgeContainer.style.borderColor = "#B01919";
        } else if(color == 'Green') {
            trumpBadgeContainer.style.color = "#147E04"
            trumpBadgeContainer.style.borderColor = "#147E04";
        } else {
            trumpBadgeContainer.style.color = "#C3AB1C";
            trumpBadgeContainer.style.borderColor = "#C3AB1C";
        }
    }
}

// define function to sort player's hand
function sortPlayerHand(hand) {
    hand.sort((a,b) => a-b);
}

// define function to populate images of player's hand, attach click listener
function dealPlayerHand() {
    // reset placeholder, last round player hand img
    playerHandContainer.innerHTML = "";

    // iterates through player's hand to generate image element
    for(let i in playerHand) {
        let cardID = playerHand[i];
        let j = cardInfo[cardID].img;
        let k = `<img src="${j}" id="${cardID}" class="card player-hand-img invisible">`;

        // inserts img
        playerHandContainer.insertAdjacentHTML("beforeend", k);

        // attaches click listener to card
        document.getElementById(cardID).addEventListener("click", () => {
            handleCardClick(cardID);
        });
    }
}

// deals the middle cards front invisibly and attach event listener
function dealMiddleCardsFront() {

    // iterates through the middle array to populate images and attach click listeners
    for(let i in middle) {
        let cardID = middle[i];
        let j = cardInfo[cardID].img;
        let k = `<img src="${j}" id="${cardID}" class="card middle-card invisible">`;

        // inserts img
        middleFourContainer.insertAdjacentHTML("beforeend", k);

        // attaches click listener to card
        document.getElementById(cardID).addEventListener("click", () => {
            handleCardClick(cardID);
        });
    }
}

// define function to deal middle cards face down invisible
function dealMiddleCards() {
    // reset last rounds middle
    middleFourContainer.innerHTML = "";
    
    // iterates four times to generate middle card back elements
    // start i at 100 to not interfere with id numbers of actual cards
    for(let i = 100; i < 104; i++) {
        let card = `<img src="/img/card-back.png" id="${i}" class="card middle-card invisible">`;
        middleFourContainer.insertAdjacentHTML("beforeend", card);
    }
}

// define function to reveal middle cards face down
function revealMiddleCardsBack() {
    let count = 100;

    const middleBackInterval = setInterval(showMiddle, 400);
    intervalArray.push(middleBackInterval);

    middleFourContainer.classList.remove('invisible');

    function showMiddle() {
        if(count < 104) {
            let card = document.getElementById(count);
            card.classList.remove('invisible');
            count++;
        } else {
            clearInterval(middleBackInterval);

            // now that middle cards are shown, handle bids can start
            handleBids();
        }
    }
}

// define function to reveal the middle cards front
function revealMiddleCardsFront() {
    let count = 0;

    // generates the invisible front cards
    dealMiddleCardsFront();

    // reveals the front
    const middleFrontInterval = setInterval(showMiddleFront, 400);
    intervalArray.push(middleFrontInterval);

    function showMiddleFront() {
        if(count < 4) {
            let card = document.getElementById(middle[count]);
            card.classList.remove('invisible');
            count++;
        } else {
            clearInterval(middleFrontInterval);

            // now that middle front is shown, can handle discard four cards
            handleDiscarding();
        }
    }
}

// define function to handle card clicking
function handleCardClick(cardID) {
    
    // handle selecting cards to play
    if(canPlayerSelectCard) {
        console.log("will handle");

    // handle discarding of four cards
    } else if(canPlayerDiscard) {
        // adds card to discard array and makes it invsibile
        if(discards.length < 3) {
            discards.push(cardID);
            let card = document.getElementById(cardID);
            card.classList.add('invisible');

        // last discard chosen
        } else if (discards.length == 3) {
            discards.push(cardID);
            let card = document.getElementById(cardID);
            card.classList.add('invisible');
            canPlayerDiscard = false;
            updateCurrentStatus("Discards chosen. Re-arranging your hand...");

            // goes through player hand (which includes middle) to delete the discards
            for(let i in discards) {
                let j = playerHand.indexOf(discards[i]);
                playerHand.splice(j, 1);
            }
            // sorts player hand again
            sortPlayerHand(playerHand);

            // adds a one second delay after selecting 4th discard
            const clearHandsAndMiddleTimeout = setTimeout(() => {
                // clears middle and player hand card elements
                middleFourContainer.innerHTML = "";
                playerHandContainer.innerHTML = "";
                middleFourContainer.classList.add('invisible');

                // invisibly deals the player hand
                dealPlayerHand();

                // reveal hand for second time
                revealPlayerHandAfterDiscard();

            }, 1000);
            timeoutArray.push(clearHandsAndMiddleTimeout);
        }
    }
}

// define function to handle Discarding of four cards
function handleDiscarding() {
    if(highestBidder == 'player') {

        // sorts autoPlayer hands
        partnerHand = sortAutoPlayerHand(partnerHand);
        rival1Hand = sortAutoPlayerHand(rival1Hand);
        rival2Hand = sortAutoPlayerHand(rival2Hand);

        playerDiscarding();
    } else {
        autoDiscarding();
    }
}

// define function to handle the player discarding four cards
function playerDiscarding() {
    updateCurrentStatus("Click on the four cards in your hand or in the middle you would like to discard.");

    // adds the middle cards to players hand array
    for(let i in middle) {
        playerHand.push(middle[i]);
    }

    // allows player to click on cards to discard
    canPlayerDiscard = true;
}

// define function to handle the auto discard of four cards
function autoDiscarding() {
    
    // adds the middle to the highest auto bidder's hand
    if(highestBidder == 'rival1') {
        for(let i in middle) {
            rival1Hand.push(middle[i]);
        }

        sortPlayerHand(rival1Hand);
        // choose Trump color then update scoreboard element
        trumpColor = chooseTrump(rival1Hand);
        // discard autoplayer cards here
        rival1Hand = discardFourAutoPlayerCards(rival1Hand);

        beginRoundOneAutoPlayer();
    } else if(highestBidder == 'rival2') {
        for(let i in middle) {
            rival2Hand.push(middle[i]);         
        }

        sortPlayerHand(rival2Hand);
        // choose Trump color then update scoreboard element
        trumpColor = chooseTrump(rival2Hand);

        // discard autoplayer cards here
        rival2Hand = discardFourAutoPlayerCards(rival2Hand);

        beginRoundOneAutoPlayer();
    } else {
        for(let i in middle) {
            partnerHand.push(middle[i]);
        }

        sortPlayerHand(partnerHand);
        // choose Trump color then update scoreboard element
        trumpColor = chooseTrump(partnerHand);

        // discard autoplayer cards here
        partnerHand = discardFourAutoPlayerCards(partnerHand);
        
        beginRoundOneAutoPlayer();
    }
}

// sorts AutoPlayer hands in order of 14s, 13s, 12s, etc.
function sortAutoPlayerHand(tempHand) {
    let hand2 = [];

    // goes through player hand and pushes cards to hand2, in order of 14s, 13s, 12s, etc.
    for(let i in tempHand) {
        if(tempHand[i] == 0) {
            hand2.push(0);
        } else if(tempHand[i] == 10) {
            hand2.push(10);
        } else if(tempHand[i] == 20) {
            hand2.push(20);
        } else if(tempHand[i] == 30) {
            hand2.push(30);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 1) {
            hand2.push(1);
        } else if(tempHand[i] == 11) {
            hand2.push(11);
        } else if(tempHand[i] == 21) {
            hand2.push(21);
        } else if(tempHand[i] == 31) {
            hand2.push(31);
        }
    }
    for(let i in tempHand) {
        if(tempHand[i] == 2) {
            hand2.push(2);
        } else if(tempHand[i] == 12) {
            hand2.push(12);
        } else if(tempHand[i] == 22) {
            hand2.push(22);
        } else if(tempHand[i] == 32) {
            hand2.push(32);
        }
    }
    for(let i in tempHand) {
        if(tempHand[i] == 3) {
            hand2.push(3);
        } else if(tempHand[i] == 13) {
            hand2.push(13);
        } else if(tempHand[i] == 23) {
            hand2.push(23);
        } else if(tempHand[i] == 33) {
            hand2.push(33);
        }
    }
    for(let i in tempHand) {
        if(tempHand[i] == 4) {
            hand2.push(4);
        } else if(tempHand[i] == 14) {
            hand2.push(14);
        } else if(tempHand[i] == 24) {
            hand2.push(24);
        } else if(tempHand[i] == 34) {
            hand2.push(34);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 5) {
            hand2.push(5);
        } else if(tempHand[i] == 15) {
            hand2.push(15);
        } else if(tempHand[i] == 25) {
            hand2.push(25);
        } else if(tempHand[i] == 35) {
            hand2.push(35);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 6) {
            hand2.push(6);
        } else if(tempHand[i] == 16) {
            hand2.push(16);
        } else if(tempHand[i] == 26) {
            hand2.push(26);
        } else if(tempHand[i] == 36) {
            hand2.push(36);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 7) {
            hand2.push(7);
        } else if(tempHand[i] == 17) {
            hand2.push(17);
        } else if(tempHand[i] == 27) {
            hand2.push(27);
        } else if(tempHand[i] == 37) {
            hand2.push(37);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 8) {
            hand2.push(8);
        } else if(tempHand[i] == 18) {
            hand2.push(18);
        } else if(tempHand[i] == 28) {
            hand2.push(28);
        } else if(tempHand[i] == 38) {
            hand2.push(38);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 9) {
            hand2.push(9);
        } else if(tempHand[i] == 19) {
            hand2.push(19);
        } else if(tempHand[i] == 29) {
            hand2.push(29);
        } else if(tempHand[i] == 39) {
            hand2.push(39);
        }
    }

    return hand2;
}

// discards four auto player cards and returns the new player hand array
function discardFourAutoPlayerCards(hand) {
    let hand2 = [];
    let tempHand = [];

    // push trump cards to hand2 and replace with a dummy value
    for(let i in hand) {
        if(trumpColor == 'Red') {
            if(hand[i] >= 0 && hand[i] < 10) {
                hand2.push(hand[i]);
                hand[i] = 40;
            }
        } else if(trumpColor == 'Black') {
            if(hand[i] >= 10 && hand[i] < 20) {
                hand2.push(hand[i]);
                hand[i] = 40;
            }
        } else if(trumpColor == 'Green') {
            if(hand[i] >= 20 && hand[i] < 30) {
                hand2.push(hand[i]);
                hand[i] = 40;
            }
        } else {
            if(hand[i] >= 30 && hand[i] < 40) {
                hand2.push(hand[i]);
                hand[i] = 40;
            }
        }
    }

    // pushes remaining non-trump cards to new temporary hand
    for(let i in hand) {
        if(hand[i] < 40) {
            tempHand.push(hand[i]);
        }
    }

    // goes through tempHand and pushes non-trump cards to hand2, in order of 14s, 13s, 12s, etc.
    for(let i in tempHand) {
        if(tempHand[i] == 0) {
            hand2.push(0);
        } else if(tempHand[i] == 10) {
            hand2.push(10);
        } else if(tempHand[i] == 20) {
            hand2.push(20);
        } else if(tempHand[i] == 30) {
            hand2.push(30);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 1) {
            hand2.push(1);
        } else if(tempHand[i] == 11) {
            hand2.push(11);
        } else if(tempHand[i] == 21) {
            hand2.push(21);
        } else if(tempHand[i] == 31) {
            hand2.push(31);
        }
    }
    for(let i in tempHand) {
        if(tempHand[i] == 2) {
            hand2.push(2);
        } else if(tempHand[i] == 12) {
            hand2.push(12);
        } else if(tempHand[i] == 22) {
            hand2.push(22);
        } else if(tempHand[i] == 32) {
            hand2.push(32);
        }
    }
    for(let i in tempHand) {
        if(tempHand[i] == 3) {
            hand2.push(3);
        } else if(tempHand[i] == 13) {
            hand2.push(13);
        } else if(tempHand[i] == 23) {
            hand2.push(23);
        } else if(tempHand[i] == 33) {
            hand2.push(33);
        }
    }
    for(let i in tempHand) {
        if(tempHand[i] == 4) {
            hand2.push(4);
        } else if(tempHand[i] == 14) {
            hand2.push(14);
        } else if(tempHand[i] == 24) {
            hand2.push(24);
        } else if(tempHand[i] == 34) {
            hand2.push(34);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 5) {
            hand2.push(5);
        } else if(tempHand[i] == 15) {
            hand2.push(15);
        } else if(tempHand[i] == 25) {
            hand2.push(25);
        } else if(tempHand[i] == 35) {
            hand2.push(35);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 6) {
            hand2.push(6);
        } else if(tempHand[i] == 16) {
            hand2.push(16);
        } else if(tempHand[i] == 26) {
            hand2.push(26);
        } else if(tempHand[i] == 36) {
            hand2.push(36);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 7) {
            hand2.push(7);
        } else if(tempHand[i] == 17) {
            hand2.push(17);
        } else if(tempHand[i] == 27) {
            hand2.push(27);
        } else if(tempHand[i] == 37) {
            hand2.push(37);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 8) {
            hand2.push(8);
        } else if(tempHand[i] == 18) {
            hand2.push(18);
        } else if(tempHand[i] == 28) {
            hand2.push(28);
        } else if(tempHand[i] == 38) {
            hand2.push(38);
        } 
    }
    for(let i in tempHand) {
        if(tempHand[i] == 9) {
            hand2.push(9);
        } else if(tempHand[i] == 19) {
            hand2.push(19);
        } else if(tempHand[i] == 29) {
            hand2.push(29);
        } else if(tempHand[i] == 39) {
            hand2.push(39);
        }
    }
    
    // slice off the last 4 and put into the discards array
    discards = hand2.slice(9, 13);

    // slice off the first 9 and re-assign to hand2
    hand2 = hand2.slice(0, 9);

    return hand2;
}

// define function to handle the middle four
function handleMiddleCardsFront() {

    // wait 1 second to remove middle card backs
    const clearMiddleTimeout = setTimeout(() => {
        middleFourContainer.innerHTML = "";
    }, 1000);
    timeoutArray.push(clearMiddleTimeout);

    // waits another half second to start revealing the middle front
    const revealMiddleFrontTimeout = setTimeout(() => {
        revealMiddleCardsFront();
    }, 1500);
    timeoutArray.push(revealMiddleFrontTimeout);
}

// define function to reveal player's hand after discarding
function revealPlayerHandAfterDiscard() {

    let count = 0;

    const playerHandSecondInterval = setInterval(flyInAgain, 400);
    intervalArray.push(playerHandSecondInterval);

    function flyInAgain() {
        if(count < 9) {
            let card = document.getElementById(playerHand[count]);
            card.classList.remove('invisible');
            count++;
        } else {
            clearInterval(playerHandSecondInterval);

            // need a handler here
        }
    }
}

// handles Round One if auto player is highest bidder
function beginRoundOneAutoPlayer() {
    round = 1;
    
    const roundOneBeginningTimeout = setTimeout(() => {
        updateCurrentStatus("The winning bidder will play first and set the trump color.");
        middleFourContainer.innerHTML = "";
        middleFourContainer.classList.add('invisible');
    }, 1000);
    timeoutArray.push(roundOneBeginningTimeout);

    const showInnerGameTableTimeout = setTimeout(() => {
        // show the inner game table container
        innerGameTableContainer.classList.remove('invisible');
    }, 3000);
    timeoutArray.push(showInnerGameTableTimeout);

    const playCardOneTimeout = setTimeout(() => {
        playFirstTrumpAutoPlayer();
    }, 5000);
    timeoutArray.push(playCardOneTimeout);
}

// the first card of the game is played for AutoPlayers
function playFirstTrumpAutoPlayer() {
    

    if(highestBidder == 'partner') {
        // plays and displays the card
        playCard('partner', partnerHand[0]);
        // removes the card from hand
        partnerHand.shift();

        updateScoreboardElement(trumpBadgeContainer, trumpColor, trumpColor);

        // update playing card info
        leadColor = trumpColor;
        leadPlayer = 'partner';

        // sort rival1 and rival2 hands
        rival1Hand = sortAutoPlayerHand(rival1Hand);
        rival2Hand = sortAutoPlayerHand(rival2Hand);

        // send over to rival1
        const playRival1CardTimeout = setTimeout(() => {
            playRival1Card();
        }, 2000);
        timeoutArray.push(playRival1CardTimeout);
        

    } else if(highestBidder == 'rival1') {
        playCard('rival1', rival1Hand[0]);
        rival1Hand.shift();
        updateScoreboardElement(trumpBadgeContainer, trumpColor, trumpColor);

        // update playing card info
        leadColor = trumpColor;
        leadPlayer = 'rival1';

        // sort rival2 and partner hands
        partnerHand = sortAutoPlayerHand(partnerHand);
        rival2Hand = sortAutoPlayerHand(rival2Hand);

        // send over to player


    } else {
        playCard('rival2', rival2Hand[0]);
        rival2Hand.shift();
        updateScoreboardElement(trumpBadgeContainer, trumpColor, trumpColor);

        // update playing card info
        leadColor = trumpColor;
        leadPlayer = 'rival2';

        // sort partner and rival1 hands
        rival1Hand = sortAutoPlayerHand(rival1Hand);
        partnerHand = sortAutoPlayerHand(partnerHand);

        //send over to partner

    }
}


// returns array of cards in a hand that match lead color
function cardsThatMatchLeadColor(hand) {
    let temp = [];
    for(let i in hand) {
        if(cardInfo[hand[i]].color == leadColor) {
            temp.push(hand[i]);
        }
    }
    return temp;
}

// calls display card, pushes to cardsPlayedThisRound
function playCard(player, card) {
    if(player == 'rival1') {
        displayCard('rival1', card);
        cardsPlayedThisRound.push(card);

    } else if(player == 'rival2') {
        displayCard('rival2', card);
        cardsPlayedThisRound.push(card);

    } else if(player == 'partner') {
        displayCard('partner', card);
        cardsPlayedThisRound.push(card);

    } else if(player == 'player') {
        displayCard('player', card);
        cardsPlayedThisRound.push(card);
    }
}

// handles the logic to choose which card rival1 will play
function chooseRival1Card() {

    // must play leadColor if in hand
    let temp = cardsThatMatchLeadColor(rival1Hand);
    console.log("rival1 hand is " + rival1Hand);
    console.log("cards that match lead color are " + temp);

    // if a match for leadColor is found
    if(temp.length > 0) {

        // play highest card that matches color
        let index = rival1Hand.indexOf(temp[0]);
        
        // if it is a higher value card than lead color card, update leadPlayer
        if(cardInfo[temp[0]].number > cardInfo[cardsPlayedThisRound[0]].number) {
            console.log("lead player updated to rival1");
            leadPlayer = 'rival1';
        }        
        playCard('rival1', rival1Hand[index]);
        rival1Hand.splice(index, 1);

    // no color match found
    } else {
        
        // if it is a trump card, need to update lead player
        // this is untested!!
        if(rival1Hand[0].color == trumpColor) {
            let tempArray = [];

            // get any trump cards that might have been played
            for(let i in cardsPlayedThisRound) {
                if(cardInfo[cardsPlayedThisRound[i]].color == trumpColor) {
                    tempArray.push(cardsPlayedThisRound[i]);
                }
            }

            let myCardHigh = true;

            for(let j in tempArray) {
                if(cardInfo[tempArray[j]].number > rival1Hand[0].number) {
                    myCardHigh = false;
                }
            }

            if(myCardHigh) {
                leadPlayer = 'rival1';
                console.log("Trumped! lead player updated to " + rival1);
            }
        }

        playCard('rival1', rival1Hand[0]);
        rival1Hand.shift();
    }
}

function playRival1Card() {

    // if first player this round, play trump or high card
    if(cardsPlayedThisRound.length == 0) {
        playCard('rival1', rival1Hand[0]);
        rival1Hand.shift();
        leadColor = cardInfo[rival1Hand[0]].color;
        leadPlayer = 'rival1';

    // if 2nd, 3rd or 4th player
    } else if(cardsPlayedThisRound.length < 4) {

        chooseRival1Card();
    }

    // card has been played, now to decide where to next
    if(cardsPlayedThisRound.length < 4) {
        // need to send to player
        console.log("send to player");
    } else {
        // round over, send to next round
        console.log("send to next round");
    }
}

// display a card to the screen
function displayCard(player, card) {

    if(player == 'partner') {
        let j = cardInfo[card].img;
        let k = `<img src="${j}" class="card">`;
        // inserts img
        partnerCardContainer.innerHTML = k;
        partnerCardContainer.classList.remove('invisible');

    } else if(player == 'rival1') {
        let j = cardInfo[card].img;
        let k = `<img src="${j}" class="card rival-card">`;
        // inserts img
        rival1CardContainer.innerHTML = k;
        rival1CardContainer.classList.remove('invisible');

    } else if(player == 'rival2') {
        let j = cardInfo[card].img;
        let k = `<img src="${j}" class="card rival-card">`;
        // inserts img
        rival2CardContainer.innerHTML = k;
        rival2CardContainer.classList.remove('invisible');
    } else if(player == 'player') {
        let j = cardInfo[card].img;
        let k = `<img src="${j}" class="card player-card">`;
        // inserts img
        playerCardContainer.innerHTML = k;
        playerCardContainer.classList.remove('invisible');
    }
}

// reveal player's hand and middle back slowly
function revealPlayerHand() {
    updateCurrentStatus("Dealing cards...");
    let count = 0;

    const playerHandInterval = setInterval(flyIn, 400);
    intervalArray.push(playerHandInterval);

    function flyIn() {
        if(count < 9) {
            let card = document.getElementById(playerHand[count]);
            card.classList.remove('invisible');
            count++;
        } else {
            clearInterval(playerHandInterval);

            // starts revealing middle back cards when player's hand is finished dealing
            revealMiddleCardsBack();
        }
    }
}

// look for 5 cards of one color
function hasFiveOneColor(hand) {
    let rCount = 0;
    let bCount = 0;
    let gCount = 0;
    let yCount = 0;
    for(let i in hand) {
        if(hand[i] >= 0 && hand[i] < 10) {
            rCount++;
        } else if(hand[i] >= 10 && hand[i] < 20) {
            bCount++;
        } else if(hand[i] >= 20 && hand[i] < 30) {
            gCount++;
        } else yCount++;
    }
    return (rCount > 4 || bCount > 4 || gCount > 4 || yCount > 4);
}

// choose Trump color for auto player
function chooseTrump(hand) {

    let rCount = 0;
    let rNumberCount = 0;
    let bCount = 0;
    let bNumberCount = 0;
    let gCount = 0;
    let gNumberCount = 0;
    let yCount = 0;
    let yNumberCount = 0;

    for(let i in hand) {
        if(hand[i] >= 0 && hand[i] < 10) {
            rCount++;
            rNumberCount += cardInfo[hand[i]].number;
        } else if(hand[i] >= 10 && hand[i] < 20) {
            bCount++;
            bNumberCount += cardInfo[hand[i]].number;
        } else if(hand[i] >= 20 && hand[i] < 30) {
            gCount++;
            gNumberCount += cardInfo[hand[i]].number;
        } else {
            yCount++;
            yNumberCount += cardInfo[hand[i]].number;
        }
    }

    // find if one numberCount is more dominant
    if(rNumberCount > bNumberCount && rNumberCount > gNumberCount && rNumberCount > yNumberCount) {
        return 'Red';
    } else if(bNumberCount > gNumberCount && bNumberCount > yNumberCount && bNumberCount > rNumberCount) {
        return 'Black';
    } else if(gNumberCount > yNumberCount && gNumberCount > rNumberCount && gNumberCount > bNumberCount) {
        return 'Green';
    } else if (yNumberCount > rNumberCount && yNumberCount > bNumberCount && yNumberCount > gNumberCount) {
        return 'Yellow';
    }
        
    // if we made it here then there is a tie in numberCount
    // to make it easy, return the highest or tied highest number of color cards
    
    if(rCount >= bCount && rCount >= gCount && rCount >= yCount) {
        return 'Red';
    } else if(bCount >= gCount && bCount >= yCount) {
        return 'Black';
    } else if(gCount >= yCount) {
        return 'Green';
    } else {
        return 'Yellow';
    }
}

// calculate max bid
function calculateMaxBid(hand) {
    // looks for four high cards
    if((hand.includes(0) && hand.includes(1) && hand.includes(2) && hand.includes(3)) || 
    (hand.includes(10) && hand.includes(11) && hand.includes(12) && hand.includes(13)) ||
    (hand.includes(20) && hand.includes(21) && hand.includes(22) && hand.includes(23)) ||
    (hand.includes(30) && hand.includes(31) && hand.includes(32) && hand.includes(33))) {
        return 75;
    
    // looks for two pair of high cards
    } else if((hand.includes(0) && hand.includes(1) && hand.includes(10) && hand.includes(11)) ||
    (hand.includes(0) && hand.includes(1) && hand.includes(20) && hand.includes(21)) ||
    (hand.includes(0) && hand.includes(1) && hand.includes(30) && hand.includes(31)) ||
    (hand.includes(10) && hand.includes(11) && hand.includes(20) && hand.includes(21)) ||
    (hand.includes(10) && hand.includes(11) && hand.includes(30) && hand.includes(31)) ||
    (hand.includes(20) && hand.includes(21) && hand.includes(30) && hand.includes(31))) {
        return 70;

    // looks for three 14s    
    } else if((hand.includes(0) && hand.includes(10) && hand.includes(20)) ||
    (hand.includes(0) && hand.includes(20) && hand.includes(30)) ||
    (hand.includes(10) && hand.includes(20) && hand.includes(30)) ||
    (hand.includes(0) && hand.includes(10) && hand.includes(30))) {
        return 70;
    
    // looks for five of one color
    } else if(hasFiveOneColor(hand)) {
        return 70;

    // looks for 14 and 13 of same color    
    } else if((hand.includes[0] && hand.includes[1]) ||
    (hand.includes[10] && hand.includes[11]) ||
    (hand.includes[20] && hand.includes[21]) ||
    (hand.includes[30] && hand.includes[31])) {
        return 65;

    // looks for two 14s
    } else if((hand.includes(0) && hand.includes(10)) || 
    (hand.includes(0) && hand.includes(20)) ||
    (hand.includes(0) && hand.includes(30)) ||
    (hand.includes(10) && hand.includes(20)) ||
    (hand.includes(10) && hand.includes(30)) ||
    (hand.includes(20) && hand.includes(30))) {
        return 65;
    } else {
        return 0;
    }
}

// collect bids from the autoPlayers
function collectBidsFromAutoPlayers() {
    // partnerBid = calculateMaxBid(partnerHand);
    partnerBid = 90;
    rival1Bid = calculateMaxBid(rival1Hand);
    rival2Bid = calculateMaxBid(rival2Hand);
}

// clear setIntervals
function clearMyIntervals() {
    for(let i in intervalArray) {
        clearInterval(intervalArray[i]);
    }
}

// clear setTimeouts
function clearMyTimeouts() {
    for(let i in timeoutArray) {
        clearTimeout(timeoutArray[i]);
    }
}

// handle the bidding process
function handleBids() {
    
    // Partner is first bidder and player hasn't answered
    if(firstBidder == 'partner' && !hasPlayerAnswered) {
        updateCurrentStatus('The bidding process will now start.');

        // Partner bids first
        const partnerBidTimeout = setTimeout(() => {
            let temp = "";
            if(partnerBid > currentBid) {
                temp = "Your partner bids " + partnerBid + ".";
                currentBid = partnerBid;
                updateCurrentBid(currentBid);
                highestBidder = 'partner';
                
            } else {
                temp = "Your partner passes.";
            }
            updateCurrentStatus(temp);
        }, 3000);
        timeoutArray.push(partnerBidTimeout);

        // rival1 bids second
        const rival1BidTimeout = setTimeout(() => {
            let temp = "";
            if(rival1Bid > currentBid) {
                temp = "Rival #1 bids " + rival1Bid + ".";
                currentBid = rival1Bid;
                updateCurrentBid(currentBid);
                highestBidder = 'rival1';
                
            } else {
                temp = "Rival #1 passes.";
            }
            updateCurrentStatus(temp);
        }, 6000);
        timeoutArray.push(rival1BidTimeout);

        // Player's first time bidding, third overall
        const playerBidTimeout = setTimeout(() => {
            promptPlayer();
        }, 9000);
        timeoutArray.push(playerBidTimeout);

    // Partner is first bidder and player has answered    
    } else if(firstBidder == 'partner' && hasPlayerAnswered) {

        // rival2 is the last bidder
        const rival2BidTimeout = setTimeout(() => {
            let temp = "";
            
            // makes sure the last bid is at least 60
            if(currentBid < 60 && rival2Bid == 0) {
                rival2Bid = 60;
            }
            if(rival2Bid > currentBid) {
                temp = "Rival #2 bids " + rival2Bid + ".";
                currentBid = rival2Bid;
                updateCurrentBid(currentBid);
                highestBidder = 'rival2';
                
            } else {
                temp = "Rival #2 passes.";
            }
            updateCurrentStatus(temp);
        }, 3000);
        timeoutArray.push(rival2BidTimeout);

        // Goes back to the player for the last bid opportunity
        const playerSecondBidTimeout = setTimeout(() => {
            promptPlayerSecondTime();
        }, 6000);
        timeoutArray.push(playerSecondBidTimeout);

    // rival1 is the first bidder and player hasn't answered    
    } else if(firstBidder == 'rival1' && !hasPlayerAnswered) {
        updateCurrentStatus('The bidding process will now start.');

        // Rival1 is the first bid
        const rival1BidTimeout = setTimeout(() => {
            let temp = "";
            if(rival1Bid > currentBid) {
                temp = "Rival #1 bids " + rival1Bid + ".";
                currentBid = rival1Bid;
                updateCurrentBid(currentBid);
                highestBidder = 'rival1';
                
            } else {
                temp = "Rival #1 passes.";
            }
            updateCurrentStatus(temp);
        }, 3000);
        timeoutArray.push(rival1BidTimeout);

        // Player's first time bidding and second overall bid
        const playerBidTimeout = setTimeout(() => {
            promptPlayer();
        }, 6000);
        timeoutArray.push(playerBidTimeout);

    // rival1 is first bidder and the player has answered    
    } else if(firstBidder == 'rival1' && hasPlayerAnswered) {
        
        // rival2 is the third bidder
        const rival2BidTimeout = setTimeout(() => {
            let temp = "";
            if(rival2Bid > currentBid) {
                temp = "Rival #2 bids " + rival2Bid + ".";
                currentBid = rival2Bid;
                updateCurrentBid(currentBid);
                highestBidder = 'rival2';
                
            } else {
                temp = "Rival #2 passes.";
            }
            updateCurrentStatus(temp);
        }, 3000);
        timeoutArray.push(rival2BidTimeout);

        // Partner is the 4th bidder
        const partnerBidTimeout = setTimeout(() => {
            let temp = "";
            // makes sure last bid is at least 60
            if(currentBid < 60 && partnerBid == 0) {
                partnerBid = 60;
            }
            if(partnerBid > currentBid) {
                temp = "Your partner bids " + partnerBid + ".";
                currentBid = partnerBid;
                updateCurrentBid(currentBid);
                highestBidder = 'partner';
                
            } else {
                temp = "Your partner passes.";
            }
            updateCurrentStatus(temp);
        }, 6000);
        timeoutArray.push(partnerBidTimeout);

        // Goes back to the player for the last bid opportunity
        const playerSecondBidTimeout = setTimeout(() => {
            promptPlayerSecondTime();
        }, 9000);
        timeoutArray.push(playerSecondBidTimeout);

    // The player is the first bidder and hasn't bid yet
    } else if(firstBidder == 'player' && !hasPlayerAnswered) {
        updateCurrentStatus('The bidding process will now start.');

        // Player's first time bidding and first overall bid
        const playerBidTimeout = setTimeout(() => {
            promptPlayer();
        }, 3000);
        timeoutArray.push(playerBidTimeout);

    // The player is the first bidder and has already answered
    } else if(firstBidder == 'player' && hasPlayerAnswered) {

        // rival2 is the second bidder
        const rival2BidTimeout = setTimeout(() => {
            let temp = "";
            if(rival2Bid > currentBid) {
                temp = "Rival #2 bids " + rival2Bid + ".";
                currentBid = rival2Bid;
                updateCurrentBid(currentBid);
                highestBidder = 'rival2';
                
            } else {
                temp = "Rival #2 passes.";
            }
            updateCurrentStatus(temp);
        }, 3000);
        timeoutArray.push(rival2BidTimeout);

        // Partner bids third
        const partnerBidTimeout = setTimeout(() => {
            let temp = "";
            if(partnerBid > currentBid) {
                temp = "Your partner bids " + partnerBid + ".";
                currentBid = partnerBid;
                updateCurrentBid(currentBid);
                highestBidder = 'partner';
                
            } else {
                temp = "Your partner passes.";
            }
            updateCurrentStatus(temp);
        }, 6000);
        timeoutArray.push(partnerBidTimeout);

        // rival1 bids 4th
        const rival1BidTimeout = setTimeout(() => {
            let temp = "";
            // makes sure last bid is at least 60
            if(currentBid < 60 && rival1Bid == 0) {
                rival1Bid = 60;
            }
            if(rival1Bid > currentBid) {
                temp = "Rival #1 bids " + rival1Bid + ".";
                currentBid = rival1Bid;
                updateCurrentBid(currentBid);
                highestBidder = 'rival1';
                
            } else {
                temp = "Rival #1 passes.";
            }
            updateCurrentStatus(temp);
        }, 9000);
        timeoutArray.push(rival1BidTimeout);

        // Goes back to the player for the last bid opportunity
        const playerSecondBidTimeout = setTimeout(() => {
            promptPlayerSecondTime();
        }, 12000);
        timeoutArray.push(playerSecondBidTimeout);

    // Rival2 is the first bidder and player hasn't answered
    } else if(firstBidder == 'rival2' && !hasPlayerAnswered) {
        updateCurrentStatus('The bidding process will now start.');

        // rival2 is the first bidder
        const rival2BidTimeout = setTimeout(() => {
            let temp = "";
            if(rival2Bid > currentBid) {
                temp = "Rival #2 bids " + rival2Bid + ".";
                currentBid = rival2Bid;
                updateCurrentBid(currentBid);
                highestBidder = 'rival2';
                
            } else {
                temp = "Rival #2 passes.";
            }
            updateCurrentStatus(temp);
        }, 3000);
        timeoutArray.push(rival2BidTimeout);

        // Partner bids second
        const partnerBidTimeout = setTimeout(() => {
            let temp = "";
            if(partnerBid > currentBid) {
                temp = "Your partner bids " + partnerBid + ".";
                currentBid = partnerBid;
                updateCurrentBid(currentBid);
                highestBidder = 'partner';
                
            } else {
                temp = "Your partner passes.";
            }
            updateCurrentStatus(temp);
        }, 6000);
        timeoutArray.push(partnerBidTimeout);

        // rival1 bids third
        const rival1BidTimeout = setTimeout(() => {
            let temp = "";
            // makes sure last bid is at least 60
            if(currentBid < 60 && rival1Bid == 0) {
                rival1Bid = 60;
            }
            if(rival1Bid > currentBid) {
                temp = "Rival #1 bids " + rival1Bid + ".";
                currentBid = rival1Bid;
                updateCurrentBid(currentBid);
                highestBidder = 'rival1';
                
            } else {
                temp = "Rival #1 passes.";
            }
            updateCurrentStatus(temp);
        }, 9000);
        timeoutArray.push(rival1BidTimeout);

        // Player's first time bidding and fourth overall bid
        const playerBidTimeout = setTimeout(() => {
            promptPlayer();
        }, 12000);
        timeoutArray.push(playerBidTimeout);

    // Rival2 is the first bidder and the player has already answered
    } else if(firstBidder == 'rival2' && hasPlayerAnswered) {
        // Goes back to the player for the last bid opportunity
        const playerSecondBidTimeout = setTimeout(() => {
            promptPlayerSecondTime();
        }, 3000);
        timeoutArray.push(playerSecondBidTimeout);
    }
}

// prompts the player for their first bid
function promptPlayer() {
    let answer = prompt('Enter a bid between 0 and 100 in increments of 5.');
    if(answer >= 0 && answer <= 100 && (answer % 5 == 0)) {
        playerBid = answer;
        hasPlayerAnswered = true;
        let temp = "";
        if(playerBid > currentBid) {
            currentBid = playerBid;
            updateCurrentBid(currentBid);
            highestBidder = 'player';
            temp = "You bid " + playerBid + ".";
            updateCurrentStatus(temp);
            handleBids();
        } else {
            temp = "You pass.";
            updateCurrentStatus(temp);
            handleBids();
        }
    } else {
        promptPlayer();
    }
}

// prompts a player for a second time
function promptPlayerSecondTime() {
    let answer = prompt('The highest bid is ' + currentBid + '. Enter a higher number if you want to increase the bid.');
    if(answer > currentBid && answer <= 100 && (answer % 5 == 0)) {
        playerBid = answer;
        currentBid = playerBid;
        updateCurrentBid(currentBid);
        highestBidder = 'player';
        let temp = "You bid " + currentBid + ".";
        updateCurrentStatus(temp);
        
        // determine message displayed for highest bidder
        let gameStartMessage = '';
        if(highestBidder == 'partner') {
            gameStartMessage = 'Your partner is the highest bidder. Revealing middle cards...';
        } else if(highestBidder == 'player') {
            gameStartMessage = 'You are the highest bidder. Revealing middle cards...';
        } else if(highestBidder == 'rival1') {
            gameStartMessage = 'Rival #1 is the highest bidder. Revealing middle cards...';
        } else {
            gameStartMessage = 'Rival #2 is the highest bidder. Revealing middle cards...';
        }
        // reveal middle cards
        updateCurrentStatus(gameStartMessage);
        handleMiddleCardsFront();
    } else {
        // determine message displayed for highest bidder
        let gameStartMessage = '';
        if(highestBidder == 'partner') {
            gameStartMessage = 'Your partner is the highest bidder. Revealing middle cards...';
        } else if(highestBidder == 'player') {
            gameStartMessage = 'You are the highest bidder. Revealing middle cards...';
        } else if(highestBidder == 'rival1') {
            gameStartMessage = 'Rival #1 is the highest bidder. Revealing middle cards...';
        } else {
            gameStartMessage = 'Rival #2 is the highest bidder. Revealing middle cards...';
        }
        // reveal middle cards
        updateCurrentStatus(gameStartMessage);
        handleMiddleCardsFront();
    }
}

// update the current status element
function updateCurrentStatus(text) {
    currentStatusElem.innerHTML = text;
}

// update the current bid
function updateCurrentBid(bid) {
    currentBidElem.innerHTML = bid;
}

// starts the game
function startGame() {
    playGameButton.disabled = true;
    shuffleCards();
    dealCards();
    sortPlayerHand(playerHand);
    // deals hand invisibly, is revealed later
    dealPlayerHand();
    // deals the cards invisibly, is revealed later
    dealMiddleCards();
    collectBidsFromAutoPlayers();

    // player hand revealed => revealMiddleCardsBack => handleBids => promptPlayerSecondTime =>
    // handleMiddleCardsFront => handleDiscarding (playerDiscarding or autoDiscarding)
    revealPlayerHand();

}

// resets the game
function resetGame() {
    clearMyIntervals();
    clearMyTimeouts();
    intervalArray = [];
    timeoutArray = [];
    middleFourContainer.innerHTML = "";
    playerHandContainer.innerHTML = "";
    innerGameTableContainer.classList.add('invisible');
    partnerCardContainer.classList.add('invisible');
    rival1CardContainer.classList.add('invisible');
    rival2CardContainer.classList.add('invisible');
    playerCardContainer.classList.add('invisible');
    updateCurrentStatus("Click 'Play Game' button to start the game.");
    updateCurrentBid(0);
    usScore = 0;
    themScore = 0;
    currentBid = 0;
    playerBid = 0;
    partnerBid = 0;
    rival1Bid = 0;
    rival2Bid = 0;
    trumpColor = 'None';
    updateScoreboardElement(trumpBadgeContainer, "None", "Black");
    playerHand = [];
    partnerHand = [];
    rival1Hand = [];
    rival2Hand = [];
    middle = [];
    discards = [];
    firstBidder = 'partner';
    highestBidder = '';
    hasPlayerAnswered = false;
    canPlayerDiscard = false;
    canPlayerSelectCard = false;
    playGameButton.disabled = false;
    round = 0;
    leadColor = 'none';
    leadPlayer = 'none';
    cardsPlayedThisRound = [];
    cardsWonByPlayerTeam = [];
    cardsWonByRivalTeam = [];
}



