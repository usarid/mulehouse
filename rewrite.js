// Constants:

var extensionId = chrome.runtime.id;
var modifierPersistentContainerId = 'scorecard_notes';
var pluginPattern = '::Used with MuleHouse Chrome Plugin::';
var moveQuestionDownPattern = '::v::';
var mulesoftOverallRatings = [ 'Definitely not', 'Not excited', 'Yes', 'Hire ASAP' ];

// Add rotated labels to the columns of numbers showing the detailed ratings:

var scorecardColumnLabelsHTML = `
<div style="padding-left: 260px;">
    
	<style>
	th.rotate {
	  height: 50px;
	  white-space: nowrap;
	  font-size: 6pt
	}
	th.rotate > div {
	  transform: 
	    rotate(315deg);
	  text-align: left;
	  width: 47px;
	}
	</style>

	<table class="table table-header-rotated">
	  <thead>
	    <tr>
			<th class="rotate"><div>Weak</div></th>
			<th class="rotate"><div>Below average for MuleSoft</div></th>
			<th class="rotate"><div>Average for MuleSoft</div></th>
			<th class="rotate"><div>Above average for MuleSoft</div></th>
			<th class="rotate"><div>Exceptional for MuleSoft</div></th>
	    </tr> 
	  </thead>
	</table>
    
</div>
`;

function addScorecardColumnLabels()
{
	appendFirstSelectorHTML('.scorecard-attributes-section > .title', scorecardColumnLabelsHTML);
}

// Take care of KEY TAKEAWAYS:

function handleKeyTakeawaysCreation(keyTakeawaysContainer)
{
	var contentsContainer = keyTakeawaysContainer.querySelector('textarea');
	var contents = contentsContainer.value.trim();
	if ((contents.length > 0) && (contents != pluginPattern)) {
		return; // Don't touch user's text; instead, indicate this was not used with the plugin
	}
	else
	{
		contentsContainer.value = pluginPattern;
	}
	var topNotes = keyTakeawaysContainer.parentNode;
	var newTopNote = document.createElement('div');
	newTopNote.className = 'note-container';
	topNotes.insertBefore(newTopNote, topNotes.firstChild);
	var tipsContainer = keyTakeawaysContainer.getElementsByClassName('tips')[0];
	newTopNote.appendChild(tipsContainer);
	overrideClass('.notes .tips', 'position: relative');
	var publicNotesLinkContainer = keyTakeawaysContainer.getElementsByClassName('new-note-links-container')[0];
	newTopNote.appendChild(publicNotesLinkContainer);

	keyTakeawaysContainer.style.display = 'none';
}

// Hide Download PDF:

function hideDownloadPDF()
{
	doOnSelector('.section a', function (anchor)
	{
		if ((/download pdf/i).test(anchor.innerText))
		{
			anchor.parentNode.style.display = 'none';
		}
	});
	overrideClass('#export_pdf_button', 'display: none');
}

// Change detailed ratings display:

function appendTest(value)
{
	return (
		(value == "Definitely Not") ||
		(value == "No") ||
		(value == "Mixed") ||
		(value == "Yes") ||
		(value == "Strong Yes")
	);
}

function modifyDetailedRatingsDisplay()
{
	var unselected = 'opacity: 0.2 !important; font-weight: normal !important; background-image: none !important; text-align: center';
	var selected   = 'opacity: 1.0 !important; font-weight: bold   !important; background-image: none !important; text-align: center';
	overrideClass('.two-thumbs-down', unselected);
	overrideClass('.two-thumbs-down.selected', selected);
	overrideClass('.thumbs-down', unselected);
	overrideClass('.thumbs-down.selected', selected);
	overrideClass('.mixed-rating', unselected);
	overrideClass('.mixed-rating.selected', selected);
	overrideClass('.thumbs-up', unselected);
	overrideClass('.thumbs-up.selected', selected);
	overrideClass('.two-thumbs-up', unselected);
	overrideClass('.two-thumbs-up.selected', selected);
	var selected1  = 'background-color: #ff0000; border-radius: 50%;'
	var selected2  = 'background-color: #ffdddd; border-radius: 50%;'
	var selected4  = 'background-color: #ddffdd; border-radius: 50%;'
	var selected5  = 'background-color: #00ff00; border-radius: 50%;'
	overrideClass('.two-thumbs-down.selected:not(.rating-with-name)', selected1);
	overrideClass('.thumbs-down.selected:not(.rating-with-name)', selected2);
	overrideClass('.thumbs-up.selected:not(.rating-with-name)', selected4);
	overrideClass('.two-thumbs-up.selected:not(.rating-with-name)', selected5);

	// Overall no-decision should not show any distracting text:
	overrideClass('.no-decision.rating-icon.rating-with-name.selected', 'visibility: hidden');

	// Scorecard criteria ratings picture-buttons
	setSelectorAppendTitleHTML('.two-thumbs-down.rating-icon:not(.rating-with-name)', 'Weak', appendTest, 1);
	setSelectorAppendTitleHTML('.thumbs-down.rating-icon:not(.rating-with-name)', 'Below average for MuleSoft', appendTest, 2);
	setSelectorAppendTitleHTML('.mixed-rating.rating-icon:not(.rating-with-name)', 'Average for MuleSoft', appendTest, 3);
	setSelectorAppendTitleHTML('.thumbs-up.rating-icon:not(.rating-with-name)', 'Above average for MuleSoft', appendTest, 4);
	setSelectorAppendTitleHTML('.two-thumbs-up.rating-icon:not(.rating-with-name)', 'Exceptional for MuleSoft', appendTest, 5);

}

// Hide scoring:

function hideScoring()
{
	document.getElementById('attribute_prompt').style.display = 'none';
	overrideClass('.scorecard-attributes-section', 'display: none');
	overrideClass('.overall-recommendation', 'display: none');
	var form = document.getElementById('scorecard_form');
	var dividers = form.getElementsByTagName('hr');
	if (dividers.length > 1) dividers[0].style.display = 'none'; // remove duplicate HRs
}

// Change overall scoring display:

function modifyOverallRatingSubmission()
{
	// Hide "Did the candidate pass the interview?":
	var nodes = Array.from(document.getElementsByClassName('overall-recommendation')[0].childNodes);
	nodes.forEach(function (node) { if (/candidate pass the interview/.test(node.textContent)) { node.textContent = ''; } });

	// Change labels:
	doOnSelector('.overall-recommendation [data-rating-id]', function (ratingElt) 
	{ 
		var ratingValue = parseInt(ratingElt.getAttribute('data-rating-id'));
		ratingElt.innerText = mulesoftOverallRatings[ratingValue - 1];
	}); 
}

function modifyOverallRatingViewing()
{
	if (!needOverallRating) return;
	var overallRecommendationSections = Array.from(document.querySelectorAll('.scorecard-section.overall-recommendations #scorecards tr.recommendation'));
	var overallQuestionAnswerSections = Array.from(document.querySelectorAll('.scorecard-section.overall-recommendations #scorecards tr.question-answers'));
	if (overallRecommendationSections.length) needOverallRating = false; // No need to do this more than once
	for (var iPair = 0; iPair < overallRecommendationSections.length; iPair++)
	{
		var recSection = overallRecommendationSections[iPair];
		var qaSection  = overallQuestionAnswerSections[iPair];
		var ratingElt = recSection.querySelector('.rating-with-name');
		if (!ratingElt) continue;
		var ratingValue = parseInt(ratingElt.getAttribute('data-rating-id'));
		var mulesoftNumericRating = mulesoftOverallRatings[ratingValue - 1];
		var usedPlugin = processQuestionAnswerSection(qaSection);
		if (usedPlugin)
		{
			ratingElt.innerHTML = mulesoftNumericRating;
		}
		else
		{
			ratingElt.innerHTML += ' <super style="color: orange">*</super>';
			warnNonPluginOverallScores();
		}
	}
}

// Look for <dt>...</dt><dd>...</dd> where the <dd>...</dd> part looks like the plugin pattern; if found, hide it and return true
function processQuestionAnswerSection(qaSection)
{
	var elts = Array.from(qaSection.querySelectorAll('dt, dd'));
	var found = false;
	elts.forEach(function (elt, iElt)
	{
		if ((elt.tagName == 'DT') && (elt.innerText.startsWith(moveQuestionDownPattern)))
		{
			elt.innerText = elt.innerText.substr(moveQuestionDownPattern.length); // Remove pattern from questions text
		}
		if (elt.innerText.trim() == pluginPattern)
		{
			found = true;
			elt.style.display = 'none';
			if (elts[iElt - 1]) elts[iElt - 1].style.display = 'none'; // Hide the "Key Takeway" label too
		}
	});
	return found;
}

function warnNonPluginOverallScores()
{
	var warningId = 'non_plugin_overall_scores_warning';
	if (document.getElementById(warningId)) return; // warning already shown
	var warningNote = document.createElement('div');
	warningNote.style.paddingTop = '20px';
	warningNote.id = warningId;
	var scorecardsTable = document.getElementById('scorecards');
	insertAfter(warningNote, scorecardsTable);
	warningNote.innerHTML = '<super style="color: orange; font-weight: bold">*</super> This score was submitted without the MuleHouse Chrome plugin';
}

// Move some questions to the bottom:

function moveQuestionsDown(containers)
{
	var overallRecommendationNode = document.querySelectorAll('.overall-recommendation')[0];
	var bottomNotes = document.createElement('div');
	bottomNotes.className = 'notes';
	bottomNotes.style.margin = '12px 0 0 0px';
	overallRecommendationNode.parentNode.insertBefore(bottomNotes, overallRecommendationNode);
	containers.forEach(function (container)
	{
		bottomNotes.appendChild(container);
	});
}

/////////////////////////
// Put it all together //
/////////////////////////


// Things that only need redrawing once
function redrawOnce()
{
	// Only when editing recognized-type scorecard:
	if (hasSelector('.note-button') && hasSelector('#' + modifierPersistentContainerId)) 
	{

		var keyTakeawaysContainer;
		var containersToMoveDown = [];
		doOnSelector('.notes .note-container', function (container)
		{
			var label = container.getElementsByClassName('scorecard-label')[0];
			var labelText = label.innerText;
			if (container.querySelector('#' + modifierPersistentContainerId)) // is "key take-aways" node
			{
				keyTakeawaysContainer = container;
			}
			else if (labelText.startsWith(moveQuestionDownPattern))
			{
				label.innerText = labelText.substr(moveQuestionDownPattern.length).trim();
				containersToMoveDown.push(container);
			}
		});
		handleKeyTakeawaysCreation(keyTakeawaysContainer);
		moveQuestionsDown(containersToMoveDown);

		if (/^Interview Kit\: (Reference|Backchannel)/.test(document.title)) // not scorable
		{
			hideScoring();
		}
		else
		{
			addScorecardColumnLabels();
			modifyOverallRatingSubmission();
		}
		
	}

	hideDownloadPDF();

	modifyDetailedRatingsDisplay();
}

// Things that need redrawing potentially multiple times
function redraw()
{
	modifyOverallRatingViewing();
}


///////////////////
// Activate      //
///////////////////

needOverallRating = true;

window.onload = function ()
{
	redrawOnce();
	redraw();
	[100, 250, 500, 1000, 3000].forEach(function (delay)
	{
		setTimeout(redraw, delay);
	});
	window.onhashchange = function () // scorecards (in overall view) are only loaded when this hash value is appended
	{
		if (location.hash === '#scorecard')
		{
			[100, 250, 500, 1000, 3000].forEach(function (delay)
			{
				setTimeout(redraw, delay);
			});
		}
	}
}


//////////////////
// HTML Helpers //
//////////////////

function overrideClass(selector, overrideText)
{
	var style = document.createElement('style');
	style.textContent = selector + ' {' + overrideText + '}';
	document.head.appendChild(style);
}

function insertAfter(newNode, afterThisNode) 
{
    afterThisNode.parentNode.insertBefore(newNode, afterThisNode.nextSibling);
}

function hasSelector(selector)
{
	var matches = document.querySelectorAll(selector);
	return matches.length > 0;
}

function doOnSelector(selector, onSelector)
{
	var matches = document.querySelectorAll(selector);
	Array.from(matches).forEach(onSelector);
}

function doOnFirstSelector(selector, onSelector)
{
	var matched = document.querySelector(selector);
	if (matched) onSelector(matched);
}


function appendFirstSelectorHTML(selector, value) 
{ 
	doOnFirstSelector(selector, function (elt)
	{
		elt.innerHTML = elt.innerHTML + value;
	});
}

function setSelectorAppendTitleHTML(selector, titleValue, appendTest, htmlValue) 
{ 
	doOnSelector(selector, function (elt)
	{
		if (!elt.hasAttribute('data-orig-title')) elt.setAttribute('data-orig-title', elt.title);
		var origTitle = elt.getAttribute('data-orig-title');
		elt.title = (elt.hasAttribute('data-orig-title') && origTitle && !appendTest(origTitle)) ?
			elt.getAttribute('data-orig-title') + ": " + titleValue :
			titleValue;
		elt.innerHTML = htmlValue;
	});
}

