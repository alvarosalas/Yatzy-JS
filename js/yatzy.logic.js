/*jslint browser:true */
/*global $: false, yatzy: false, alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */

yatzy.logic = (function() {
	"use strict";
	var dices,
		sortedDices,
		playerNames,
		winnerNames,
		playerNameId,
		numOfPlayers,
		activePlayerColumnId,
		roundNumber,
		fullGameRoundsPlayed,
		playerTotalScores,
		highestScore,
		i;

	function getUpperSectionScore(numberToCheck) {
		var sum = 0;
		for (i = 0; i < dices.length; i = i + 1) {
			if (dices[i].val === numberToCheck) {
				sum = sum + dices[i].val;
			}
		}
		return sum;
	}

	function getPairs() {
		var pairs = [];

		for (i = 0; i < sortedDices.length - 1; i = i + 1) {
			if ((sortedDices[i].val === sortedDices[i + 1].val) && (!isAnAlreadyFoundPair(sortedDices[i].val))) {
				pairs.push(sortedDices[i].val);
			}
		}

		function isAnAlreadyFoundPair(value) {
			var i = 0;
			for (i = 0; i < pairs.length; i = i + 1) {
				if (pairs[i] === value) {
					return true;
				}
			}
			return false;
		}

		return pairs.sort(function(val1, val2) {
			return val2 - val1;
		});
	}

	function getThrees(pairs) {
		var j,
			counter = 0;

		for (i = 0; i < pairs.length; i = i + 1) {
			for (j = 0; j < dices.length; j = j + 1) {
				if (dices[j].val === pairs[i]) {
					counter = counter + 1;
					if (counter === 3) {
						return dices[j].val;
					}
				}
			}
			counter = 0;
		}
		return undefined;
	}

	function getFourths(threes) {
		var counter = 0;

		for (i = 0; i < dices.length; i = i + 1) {
			if (dices[i].val === threes) {
				counter = counter + 1;
				if (counter === 4) {
					return dices[i].val;
				}
			}
		}
		return undefined;
	}

	function getStraight() {
		var counter = 0,
			firstVal = sortedDices[0].val;

		if ((firstVal === 1) || (firstVal === 2)) {
			for (i = 0; i < sortedDices.length - 1; i = i + 1) {
				if (sortedDices[i + 1].val === sortedDices[i].val + 1) {
					counter = counter + 1;
					if (counter === 4) {
						return firstVal;
					}
				}
			}
		} else {
			return undefined;
		}
	}

	function getChance() {
		var sum = 0;

		for (i = 0; i < dices.length; i = i + 1) {
			sum = sum + dices[i].val;
		}
		return sum;
	}

	function getYatzy() {
		if (sortedDices[0].val === sortedDices[4].val) {
			return true;
		}
	}

	function checkWinners() {
		highestScore = 0;

		for (i = 0; i < playerTotalScores.length; i = i + 1) {
			if (playerTotalScores[i] > highestScore) {
				highestScore = playerTotalScores[i];
			}
		}

		for (i = 0; i < playerTotalScores.length; i = i + 1) {
			if (playerTotalScores[i] === highestScore) {
				winnerNames.push(playerNames[i]);
			}
		}
	}

	return {
		getDices: function() {
			return dices;
		},

		getRoundNumber: function() {
			return roundNumber;
		},

		getActiveColumnId: function() {
			return activePlayerColumnId;
		},

		playGame: function(nameInputs) {
			playerNames = [];
			winnerNames = [];
			dices = [];
			sortedDices = [];
			playerTotalScores = [];

			nameInputs.each(function() {
				playerNames.push($(this).val().toUpperCase());
			});

			numOfPlayers = nameInputs.length;

			for (i = 1; i <= 5; i = i + 1) {
				dices.push(createDice());
			}
			roundNumber = 0;
			fullGameRoundsPlayed = 0;
			activePlayerColumnId = 2;
			playerNameId = activePlayerColumnId - 2;
			setPlayerName(playerNames[playerNameId]);
		},

		nextGameRound: function() {
			roundNumber = 0;
			activePlayerColumnId = activePlayerColumnId + 1;
			if (activePlayerColumnId > numOfPlayers + 1) {
				fullGameRoundsPlayed = fullGameRoundsPlayed + 1;
				if (fullGameRoundsPlayed === 15) {
					playerTotalScores = updateTotalScore();
					checkWinners();
					alert("The game of YATZY has ended. The winner(s) are " + winnerNames.join(", ") + " with a score of " + highestScore + ". Press OK to submit your score.");

					var highscoreObj = {
						names: winnerNames,
						score: highestScore
					};
					// Send the winnernames and the score to the highscore list webservice.
					$.ajax({
						url: "/",
						type: "post",
						data: JSON.stringify(highscoreObj),
						contentType: "application/json"
					}).done(function() {
						alert("Your score(s) were submitted to the highscore list. Press OK to play again.");
					}).fail(function() {
						alert("Your score(s) were not submitted to the highscore list due to a network error. Press OK to play again.");
					});
					initiateNewGame();
				}
				activePlayerColumnId = 2;
			}
			playerNameId = activePlayerColumnId - 2;
			setPlayerName(playerNames[playerNameId]);
		},

		roll: function(dicesToThrowAgain) {
			for (i = 0; i < dicesToThrowAgain.length; i = i + 1) {
				dicesToThrowAgain[i].roll();
			}
			showDices(dicesToThrowAgain);
			roundNumber = roundNumber + 1;
			setRoundText(roundNumber);
			if (roundNumber === 3) {
				fadeInDices();
			}
		},

		rollAll: function() {
			for (i = 0; i < dices.length; i = i + 1) {
				dices[i].roll();
			}
			showDices(dices);
			roundNumber = roundNumber + 1;
			setRoundText(roundNumber);
		},

		validateDices: function(rowId) {
			var result = 0,
				pairs = [],
				pair,
				threes,
				fourths,
				straightValue;

			sortedDices = dices.slice(0).sort(function(d1, d2) {
				return d1.val - d2.val;
			});

			switch (rowId) {
				case "acesRow":
					result = getUpperSectionScore(1);
					break;
				case "twosRow":
					result = getUpperSectionScore(2);
					break;
				case "threesRow":
					result = getUpperSectionScore(3);
					break;
				case "foursRow":
					result = getUpperSectionScore(4);
					break;
				case "fivesRow":
					result = getUpperSectionScore(5);
					break;
				case "sixesRow":
					result = getUpperSectionScore(6);
					break;
				case "onePairRow":
					pairs = getPairs();
					pair = pairs[0];
					result = pair * 2;
					break;
				case "twoPairsRow":
					pairs = getPairs();
					if (pairs.length > 1) {
						result = (pairs[0] * 2) + (pairs[1] * 2);
					}
					break;
				case "threeOfAKindRow":
					pairs = getPairs();
					if (pairs.length > 0) {
						threes = getThrees(pairs);
						result = threes * 3;
					}
					break;
				case "fourOfAKindRow":
					pairs = getPairs();
					if (pairs.length > 0) {
						threes = getThrees(pairs);
						if (threes !== undefined) {
							fourths = getFourths(threes);
							result = fourths * 4;
						}
					}
					break;
				case "smallStraightRow":
					straightValue = getStraight();
					if (straightValue === 1) {
						result = 15;
					}
					break;
				case "bigStraightRow":
					straightValue = getStraight();
					if (straightValue === 2) {
						result = 20;
					}
					break;
				case "fullHouseRow":
					pairs = getPairs();
					if (pairs.length > 1) {
						threes = getThrees(pairs);
						if (threes !== undefined) {
							result = getChance();
						}
					}
					break;
				case "chanceRow":
					result = getChance();
					break;
				case "yatzyRow":
					if (getYatzy()) {
						result = 50;
					}
					break;
				default:
					// This never occurrs
			}
			return isNaN(result) ? 0 : result;
		}
	};
}());