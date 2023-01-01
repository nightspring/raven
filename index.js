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

    // sets the player-hand-container to visible
/*     playerHandContainer.style.visibility = 'visible';
    playerHandContainer.style.opacity = '1'; */
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
    console.log("Auto discarding");
    console.log(highestBidder);

    // adds the middle to the highest auto bidder's hand
    if(highestBidder == 'rival1') {
        for(let i in middle) {
            rival1Hand.push(middle[i]);
        }

        sortPlayerHand(rival1Hand);
        // choose Trump color then update scoreboard element
        trumpColor = chooseTrump(rival1Hand);
        updateScoreboardElement(trumpBadgeContainer, trumpColor, trumpColor);
    } else if(highestBidder == 'rival2') {
        for(let i in middle) {
            rival2Hand.push(middle[i]);         
        }

        sortPlayerHand(rival2Hand);
        // choose Trump color then update scoreboard element
        trumpColor = chooseTrump(rival2Hand);
        updateScoreboardElement(trumpBadgeContainer, trumpColor, trumpColor);
    } else {
        for(let i in middle) {
            partnerHand.push(middle[i]);
        }

        sortPlayerHand(partnerHand);
        // choose Trump color then update scoreboard element
        trumpColor = chooseTrump(partnerHand);
        updateScoreboardElement(trumpBadgeContainer, trumpColor, trumpColor);
    }

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

// define function to reveal player's hand and middle back slowly
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

// define function to look for 5 cards of one color
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

    console.log("rCount " + rCount);
    console.log("rNumber " + rNumberCount);

    console.log("bCount " + bCount);
    console.log("bNumber " + bNumberCount);

    console.log("gCount " + gCount);
    console.log("gNumber " + gNumberCount);

    console.log("yCount " + yCount);
    console.log("yNumber " + yNumberCount);

    for(let j in hand) {
        console.log(cardInfo[hand[j]].code);
    }


    // find if one color is more dominant
    if(rCount > bCount && rCount > gCount && rCount > yCount) {
        return 'Red';
    } else if(bCount > gCount && bCount > yCount && bCount > rCount) {
        return 'Black';
    } else if(gCount > yCount && gCount > rCount && gCount > bCount) {
        return 'Green';
    } else if (yCount > rCount && yCount > bCount && yCount > gCount) {
        return 'Yellow';
    }
        
    // if we made it here then there is a tie in colors
    // to make it easy, return the highest or tied highest numberCount

    console.log("There is a tie");
    
    if(rNumberCount >= bNumberCount && rNumberCount >= gNumberCount && rNumberCount >= yNumberCount) {
        return 'Red';
    } else if(bNumberCount >= gNumberCount && bNumberCount >= yNumberCount) {
        return 'Black';
    } else if(gNumberCount >= yNumberCount) {
        return 'Green';
    } else {
        return 'Yellow';
    }
}

// define function to calculate max bid
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

function collectBidsFromAutoPlayers() {
    partnerBid = calculateMaxBid(partnerHand);
    rival1Bid = calculateMaxBid(rival1Hand);
    rival2Bid = calculateMaxBid(rival2Hand);
}

// define function to clear setIntervals
function clearMyIntervals() {
    for(let i in intervalArray) {
        clearInterval(intervalArray[i]);
    }
}

// define function to clear setTimeouts
function clearMyTimeouts() {
    for(let i in timeoutArray) {
        clearTimeout(timeoutArray[i]);
    }
}

// define function to handle the bidding process
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
            
            // makes sure the last bid is at least 50
            if(currentBid < 50 && rival2Bid == 0) {
                rival2Bid = 50;
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
            // makes sure last bid is at least 50
            if(currentBid < 50 && partnerBid == 0) {
                partnerBid = 50;
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
            // makes sure last bid is at least 50
            if(currentBid < 50 && rival1Bid == 0) {
                rival1Bid = 50;
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
            // makes sure last bid is at least 50
            if(currentBid < 50 && rival1Bid == 0) {
                rival1Bid = 50;
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

// define function to prompt the player for their first bid
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

// define function to prompt a player for a second time
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

// define function to update the current status element
function updateCurrentStatus(text) {
    currentStatusElem.innerHTML = text;
}

// define function to update the current bid
function updateCurrentBid(bid) {
    currentBidElem.innerHTML = bid;
}

// define startGame function
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

// define function to reset the game
function resetGame() {
    clearMyIntervals();
    clearMyTimeouts();
    intervalArray = [];
    timeoutArray = [];
    middleFourContainer.innerHTML = "";
    playerHandContainer.innerHTML = "";
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
}



