/*jslint browser:true */
/*global yatzy: false, $: false, alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */

$(function() {
	"use strict";
	var scoreTable = $("#scoreTable"),
		rulesTable = $("#rulesTable"),
		dicePanel = $("#dicePanel"),
		numOfPlayersList = $("#numOfPlayersList"),
		playerForm = $("#playerForm"),
		result;

	/* Whenever an image of a dice is clicked,
    mark it as either held or not held. */
	$("#imgList img").click(function() {
		// Do not let the player check the dices after the last(third) round has been played through.
		if (yatzy.logic.getRoundNumber() < 3) {
			var checkbox = $(this).next();

			if (checkbox.is(":checked")) {
				$(this).animate({
					opacity: 1
				}, 500, function() {
					// Animation complete
				});
			} else {
				$(this).animate({
					opacity: 0.25
				}, 500, function() {
					// Animation complete
				});
			}
			checkbox.prop("checked", !checkbox.is(":checked"));
		}
	});

	/* Whenever a player wants to roll the
    dices not meant to be saved. */
	$("#rollBtn").click(function() {
		var dices = yatzy.logic.getDices(),
			rollNr = yatzy.logic.getRoundNumber(),
			activeColumnId = yatzy.logic.getActiveColumnId(),
			dicesToThrowAgain = [];

		// All dices need to be thrown in the first round.
		if (rollNr === 0) {
			yatzy.logic.rollAll();
			fadeInDices();
			$("#imgList img").css("visibility", "visible");

			$("#roundText").animate({
				opacity: 1
			}, 500, function() {
				// Animation complete
			});

			setActiveColumn(activeColumnId);
			// Dices are allowed to be held/saved during round 2 and 3.
		} else if (rollNr < 3) {
			// Traverses through all of the checkboxes.
			$("#imgList input").each(function(i) {
				if (!$(this).is(":checked")) {
					dicesToThrowAgain.push(dices[i]);
				}
			});
			yatzy.logic.roll(dicesToThrowAgain);
		}
	});

	/* Whenever the value in the player drop down list changes. */
	numOfPlayersList.change(function() {
		var i,
			li,
			input;

		// Removes all list items containing the player name input fields.
		$(".textFieldsListItems").remove();

		// Creates player name input fields according to the choice of players.
		for (i = 1; i <= numOfPlayersList.val(); i = i + 1) {
			input = $("<input>");
			input.prop("name", "p" + i).prop("type", "text");

			li = $("<li>");
			li.addClass("textFieldsListItems");
			li.text("Player " + i);

			li.append(input);
			$("#playerNameList").append(li);
		}
	});

	/* Whenever the play button is clicked from within the player name input form,
    check for empty player name input fields and fill the scoretable columns
    if they are all filled out. */
	$("#playBtn").click(function() {
		var empty = false,
			inputFields = $(".textFieldsListItems input");

		$(inputFields).each(function() {
			if ($(this).val() === "") {
				empty = true;
			}
		});

		if (empty) {
			alert("You have empty text fields, fill out all of the player names and try again!");
		} else {
			playerForm.hide();
			dicePanel.show();
			fillPlayerColumns(inputFields);
			inactivateAllColumns();
			yatzy.logic.playGame(inputFields);
			// Before the player has rolled the first round,
			// set the dice pictures to an invisible state.
			$("#imgList img").css("visibility", "hidden").css("opacity", 0);
			$("#roundText").css("opacity", 0);
		}
	});

	/* In case the new game button is clicked, 
    reset the game to its initial state. */
	$("#newGameBtn").click(function() {
		var option = confirm("Are you sure you want to start a new game? Press OK if you do, or CANCEL if you don't.");

		if (option) {
			initiateNewGame();
		}
	});

	/* In case the scoreboard button is clicked,
    switch the content in the information panel. */
	$("#scoreBoardBtn").click(function() {
		scoreTable.slideToggle(1000);
		rulesTable.hide();
		scoreTable.show();
	});

	/* In case the rulesbutton button is clicked,
    switch the content in the information panel. */
	$("#rulesBtn").click(function() {
		rulesTable.slideToggle(1000);
		scoreTable.hide();
		rulesTable.show();
	});

	// $("#highscoresBtn").click(function() {
	// 	window.open("/highscores");
	// });

	/* Fills out the scoretable columns according to the number of players 
chosen in the player input form. */

	function fillPlayerColumns(inputFields) {
		var currentRow,
			td;

		// For each row in the scoretable.
		$("#scoreTable tr").each(function(i) {
			currentRow = $(this);
			if (i === 0) {
				inputFields.each(function(j) {
					td = $("<td>");
					td.text($(inputFields[j]).val().substring(0, 1).toUpperCase());

					td.addClass("scoreBoardCells");
					currentRow.append(td);
				});
			} else {
				inputFields.each(function() {
					td = $("<td>");
					td.text("");
					td.addClass("scoreBoardCells");
					currentRow.append(td);
					// Add listeners to rows which carries a combination,
					// i.e not SUBTOTAL, TOTAL nor BONUS.
					if (!$(currentRow).hasClass("noClickRow")) {
						td.hover(scoreBoardCellHover);
						td.mouseleave(scoreBoardCellMouseLeave);
						td.click(scoreBoardCellClick);
					}
				});
			}
		});
	}

	function scoreBoardCellHover() {
		if (!$(this).hasClass("clicked") && ($(this).hasClass("activeCellInColumn"))) {
			var rowId = $(this).parent().prop("id");

			result = yatzy.logic.validateDices(rowId);
			$(this).css("opacity", 0.4);
			$(this).text(result === 0 ? "/" : result);
		}
	}

	function scoreBoardCellMouseLeave() {
		if (!$(this).hasClass("clicked") && ($(this).hasClass("activeCellInColumn"))) {
			$(this).text("");
		}
	}

	function scoreBoardCellClick() {
		var subTotalCell,
			bonusCell,
			numOfClickedCellsInUpperSection;

		if (!$(this).hasClass("clicked") && ($(this).hasClass("activeCellInColumn"))) {
			$(this).addClass("clicked");
			$(this).fadeTo('fast', 1);
			updateSubTotalScore($(this));
			// Move game to next player.
			yatzy.logic.nextGameRound();
			inactivateAllColumns();
			fadeOutDices();
			$("#roundText").animate({
				opacity: 0
			}, 500, function() {
				$(this).text("");
			});
			$("#imgList input").prop("checked", false);
		}

		// Updates the subtotal score

		function updateSubTotalScore(clickedCell) {
			if (clickedCell.parent().hasClass("upperSection")) {
				subTotalCell = $("#subTotalRow :nth-child(" + yatzy.logic.getActiveColumnId() + ")");
				subTotalCell.text(Number(subTotalCell.text()) + result);
				checkBonus();
			}

			// Checks whether or not the player has a bonus, and updates the bonus cell accordingly

			function checkBonus() {
				bonusCell = $("#bonusRow :nth-child(" + yatzy.logic.getActiveColumnId() + ")");
				numOfClickedCellsInUpperSection = $(".upperSection .clicked:nth-child(" + yatzy.logic.getActiveColumnId() + ")").length;
				if (Number(subTotalCell.text()) >= 63) {
					bonusCell.text(50);
				} else if (numOfClickedCellsInUpperSection === 6) {
					bonusCell.text("/");
				}
			}
		}
	}

	function fadeOutDices() {
		$("#imgList img").animate({
			opacity: 0
		}, 500, function() {
			$("#imgList img").css("visibility", "hidden");
		});
	}

	function inactivateAllColumns() {
		$("#scoreTable tr[class!=noClickRow] td").each(function() {
			$(this).removeClass("activeCellInColumn");
		});
	}

	function setActiveColumn(columnId) {
		$("#scoreTable tr :nth-child(" + columnId + ")").each(function() {
			if (!$(this).parent().hasClass("noClickRow")) {
				$(this).addClass("activeCellInColumn");
			}
		});
	}
});

function fadeInDices() {
	"use strict";
	$("#imgList input").each(function() {
		$(this).prop("checked", false);
		// Fades in all pictures to full opacity
		$(this).prev().animate({
			opacity: 1
		}, 500, function() {
			// Animation complete
		});
	});
}

/* Calculates the sum of each player score and puts it in the total score table cell. */

function updateTotalScore() {
	"use strict";
	var playerTotalScores = [],
		tableValue;

	$(".totalScore").each(function(rowIndex) {
		$(this).children().each(function(columnIndex) {
			if (columnIndex > 0) {
				tableValue = $(this).text() === "/" ? 0 : Number($(this).text());
				if (rowIndex === 0) {
					playerTotalScores.push(tableValue);
				} else {
					playerTotalScores[columnIndex - 1] = playerTotalScores[columnIndex - 1] + tableValue;
				}
			}
		});
	});

	$("#totalRow").children().each(function(columnIndex) {
		if (columnIndex > 0) {
			$(this).text(playerTotalScores[columnIndex - 1]);
		}
	});

	return playerTotalScores;
}

function setRoundText(rollNr) {
	"use strict";
	$("#roundText").text("ROLL " + rollNr);
}

function initiateNewGame() {
	"use strict";
	$("#dicePanel").hide();
	$("#playerForm").show();
	$(".scoreBoardCells").remove();
}

function setPlayerName(name) {
	"use strict";
	$("#playerName").text(name);
}

/* Changes the dice pictures of the dices not on hold,
i.e the ones rethrown. */

function showDices(dices) {
	"use strict";
	$("#imgList input:not(:checked)").each(function(i) {
		// Change the picture only of the dices not on hold
		$(this).prev().prop("src", "resources/d" + dices[i].val + ".png");
	});
}