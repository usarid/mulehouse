var extensionId = chrome.runtime.id;  //'jbjdbhbofcfmeenfjigdbbnklohgoiia';

var scorecardColumnsHTML = `
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

var scorecardInputOverallRecomendationHTML = `
<li mulesoft-rating-id="1" >1 </li>
<li mulesoft-rating-id="2-">2-</li>
<li mulesoft-rating-id="2" >2 </li>
<li mulesoft-rating-id="2+">2+</li>
<li mulesoft-rating-id="4-">4-</li>
<li mulesoft-rating-id="4" >4 </li>
<li mulesoft-rating-id="4+">4+</li>
<li mulesoft-rating-id="5" >5 </li>
`;

var scorecardExplainOverallRecommendationHTML = `
<style>
	.rating-legend-container { padding-left: 25px; padding-top: 10px }
	.rating-legend-item {}
	.rating-legend-number { font-weight: bold }
</style>
<div class="rating-legend-container">
	<div class="rating-legend-item"><span class="rating-legend-number">1</span> - I oppose hiring</div>
	<div class="rating-legend-item"><span class="rating-legend-number">2</span>  - I have some concerns hiring</div>
	<div class="rating-legend-item"><span class="rating-legend-number">4</span>  - I support hiring</div>
	<div class="rating-legend-item"><span class="rating-legend-number">5</span>  - Hire ASAP</div>
</div>
`;

var mulesoftRatings = [ '1', '2', '4', '5' ]; // no 3's!

var modifierPersistentContainerId = 'scorecard_notes';

function getMuleSoftOverallRecommendationValue(candidateValue)
{
	var match;
	if (typeof candidateValue != 'string') 
	{
		candidateValue = document.getElementById(modifierPersistentContainerId).value;
	}
	match = /^\s*\:\:(.*)\:\:\s*$/.exec(candidateValue);
	if (!match) return null;
	candidateValue = match[1];
	return parseMuleSoftOverallRecommendationValue(candidateValue);
}

function parseMuleSoftOverallRecommendationValue(candidateValue)
{
	match = /^([12345])([+-]?)$/.exec(candidateValue);
	if (!match) return null;
	var parsedValue = { numeric: match[1], modifier: match[2], value: match[1] + match[2] };
	if ((parsedValue.numeric == '1') || (parsedValue.numeric == '5')) 
	{
		parsedValue.modifier = '';
	}
	return parsedValue;
}

function setMuleSoftOverallRecommendationPersistentContainerValue(value)
{
	var modifierPersistentContainer = document.getElementById(modifierPersistentContainerId);
	modifierPersistentContainer.value = '::' + value + '::';
}

function replaceInputOverallRecommendation()
{
	// hide existing controls:
	doOnSelector('.overall-recommendation [data-rating-id]', function (elt) { elt.style.display = 'none'; }); 
	// add new controls:
	appendFirstSelectorHTML('#candidate_rating_options', scorecardInputOverallRecomendationHTML); 
	overrideClass('.overall-recommendation #candidate_rating_options li', 
		'width: 8%');
	overrideClass('.overall-recommendation #candidate_rating_options li.selected', 
		'background-color: transparent !important; border: 1px solid #000000 !important; color: #000000 !important');
	// if there is a valid saved value, select accordingly:
	var savedNumericValue = mulesoftRatings[document.getElementById('scorecard_candidate_rating_id').value - 1];
	if (savedNumericValue)
	{
		var savedValue = getMuleSoftOverallRecommendationValue();
		var valueToUse = (savedValue && (savedValue.numeric == savedNumericValue)) ? savedValue : parseMuleSoftOverallRecommendationValue(savedNumericValue);
		selectMulesoftRating(valueToUse);
	}
	// listen for clicks:
	doOnSelector('[mulesoft-rating-id]', function (elt)
	{
		elt.addEventListener('click', onOverallRecommendationClick, false);
	});
	// add instructions
	document.getElementById('candidate_rating_options').insertAdjacentHTML('afterend', scorecardExplainOverallRecommendationHTML);
}

function selectMulesoftRating(parsedValue)
{
	doOnSelector('[mulesoft-rating-id]', function (elt)
	{
		if (elt.getAttribute('mulesoft-rating-id') == parsedValue.value)
		{
			elt.className = elt.className.replace(/\s*(selected)?\s*$/, ' selected');
		} 
		else 
		{
			elt.className = elt.className.replace(/\s*selected\s*/, '');
		}
	});
	document.getElementById('scorecard_candidate_rating_id').value = mulesoftRatings.indexOf(parsedValue.numeric) + 1;
	setMuleSoftOverallRecommendationPersistentContainerValue(parsedValue.value);
}

function onOverallRecommendationClick(evt)
{
	var ratingValue = evt.srcElement.getAttribute('mulesoft-rating-id');
	selectMulesoftRating(parseMuleSoftOverallRecommendationValue(ratingValue));
;}

function overrideClass(selector, overrideText)
{
	var style = document.createElement('style');
	style.textContent = selector + ' {' + overrideText + '}';
	document.head.appendChild(style);
}

function lookupNotesTitle(text)
{
	var matches = /^\s*\d+/.exec(text);
	var index = matches ? parseInt(matches[0]) : -1;
	var newText = (index < 0) ? '' :
		[ 'Accomplishments/Pros', 'Concerns/Gaps', 'OPTIONAL: Raw Interview Notes', 'Final Score Justification' ][index - 1];
	return { index: index, newText: newText };
}

function redrawOnce()
{
	// Only when editing recognized-type scorecard:
	if (hasSelector('.note-button') && hasSelector('#' + modifierPersistentContainerId)) 
	{
		// Find certain recognized notes fields:
		var containerModifier, containerPros, containerCons, containerRaw, containerJustification;
		doOnSelector('.notes .note-container', function (container)
		{
			var label = container.getElementsByClassName('scorecard-label')[0];
			var notesContainerData = lookupNotesTitle(label.innerText);
			switch (notesContainerData.index)
			{
				case -1:
					if (container.querySelector('#' + modifierPersistentContainerId)) // is "key take-aways" node
					{
						containerModifier = container;
					}
					break;
				case 1:
					containerPros = container;
					break;
				case 2:
					containerCons = container;
					break;
				case 3:
					containerRaw = container;
					break;
				case 4:
					containerJustification = container;
					break;
			}
			if (notesContainerData.index > 0)
			{
				label.innerText = notesContainerData.newText;
			}
		});
		// Move remaining decorators off key-takeaways notes before hiding it for use as modifier storage
		var topNotes = containerModifier.parentNode;
		var newTopNote = document.createElement('div');
		newTopNote.className = 'note-container';
		topNotes.insertBefore(newTopNote, topNotes.firstChild);
		var tipsContainer = containerModifier.getElementsByClassName('tips')[0];
		var firstNotesContainer = containerPros || containerCons || containerRaw || containerJustification || topNotes;
		newTopNote.appendChild(tipsContainer);
		overrideClass('.notes .tips', 'position: relative');
		var publicNotesLinkContainer = containerModifier.getElementsByClassName('new-note-links-container')[0];
		newTopNote.appendChild(publicNotesLinkContainer);
		containerModifier.style.display = 'none';

		if (/^Interview Kit\: Reference/.test(document.title) ||
		    /^Interview Kit\: Backchannel/.test(document.title)) // not scorable
		{
			document.getElementById('attribute_prompt').style.display = 'none';
			overrideClass('.scorecard-attributes-section', 'display: none');
			overrideClass('.overall-recommendation', 'display: none');
			var form = document.getElementById('scorecard_form');
			var dividers = form.getElementsByTagName('hr');
			if (dividers.length > 1) dividers[0].style.display = 'none'; // remove duplicate HRs
		}
		else
		{
			// Add scorecard criteria ratings column headers
			appendFirstSelectorHTML('.scorecard-attributes-section > .title', scorecardColumnsHTML);
			// Replace overall recommendation input fields
			replaceInputOverallRecommendation();
			// Move justification notes to bottom:
			var overallRecommendationNode = document.querySelectorAll('.overall-recommendation')[0];
			if (containerJustification) // found
			{
				var bottomNotes = document.createElement('div');
				bottomNotes.className = 'notes';
				bottomNotes.style.margin = '12px 0 0 25px';
				insertAfter(bottomNotes, overallRecommendationNode);
				bottomNotes.appendChild(containerJustification);
				containerJustification.getElementsByClassName('scorecard-label')[0].style.padding = '0 0 0 1%';
			}
		}
	}
	else if (/\/scorecards\/\d+$/.test(document.location.pathname)) // Only when viewing recognized-type scorecard:
	{
		var reviewerNotes = document.querySelector('.notes');
		var mulesoftOverallRating = convertScorecardHTML(reviewerNotes);
		var ratingElt = document.querySelector('.rating-with-name.selected');
		if (ratingElt)
		{
			var ratingValue = parseInt(ratingElt.getAttribute('data-rating-id'));
			var mulesoftNumericRating = mulesoftRatings[ratingValue - 1];
			if (mulesoftNumericRating)
			{
				ratingElt.innerText = (mulesoftOverallRating && (mulesoftOverallRating.numeric == mulesoftNumericRating)) ?
					mulesoftOverallRating.value : mulesoftNumericRating; // Only change if they agree on the numerics
			}
		}
	}

	// Hide "Download PDF" link
	doOnSelector('.section a', function (anchor)
	{
		if ((/download pdf/i).test(anchor.innerText))
		{
			anchor.parentNode.style.display = 'none';
		}
	});

	// The rating images:
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

	// No PDF export (but note this doesn't cover all cases):
	overrideClass('.export-as-pdf', 'display: none');
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

function doOnClass(className, onClass)
{
	var matches = document.getElementsByClassName(className);
	if (matches.length == 0) return;
	onClass(matches[0]);	
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
function setClassHTML(className, value) 
{ 
	doOnClass(className, function (elt)
	{
		elt.innerHTML = value;
	});
};
function setSelectorHTML(selector, value) 
{ 
	doOnSelector(selector, function (elt)
	{
		elt.innerHTML = value;
	});
};
function appendFirstSelectorHTML(selector, value) 
{ 
	doOnFirstSelector(selector, function (elt)
	{
		elt.innerHTML = elt.innerHTML + value;
	});
};
function setSelectorTitle(selector, value) 
{ 
	doOnSelector(selector, function (elt)
	{
		elt.title = value;
	});
};
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
};

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

function redraw()
{
	// Scorecard criteria ratings picture-buttons
	setSelectorAppendTitleHTML('.two-thumbs-down.rating-icon:not(.rating-with-name)', 'Weak', appendTest, 1);
	setSelectorAppendTitleHTML('.thumbs-down.rating-icon:not(.rating-with-name)', 'Below average for MuleSoft', appendTest, 2);
	setSelectorAppendTitleHTML('.mixed-rating.rating-icon:not(.rating-with-name)', 'Average for MuleSoft', appendTest, 3);
	setSelectorAppendTitleHTML('.thumbs-up.rating-icon:not(.rating-with-name)', 'Above average for MuleSoft', appendTest, 4);
	setSelectorAppendTitleHTML('.two-thumbs-up.rating-icon:not(.rating-with-name)', 'Exceptional for MuleSoft', appendTest, 5);
	doOnClass('overall-recommendation', function (elt)
	{
		elt.childNodes[2].textContent = ''
	});
	getSummaries();
}

needSummaries = true;
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

///////
// Load scorecards for summarization

function getScorecardSummary(iScorecard, scorecardUrl, onLoad)
{
	var xhr = new XMLHttpRequest();
	xhr.onload = function() 
	{
	  onLoad(iScorecard, this.responseXML);
	}
	xhr.open('GET', scorecardUrl);
	xhr.responseType = 'document';
	xhr.send();
}

function warnNonPluginOverallScores()
{
	var warningId = 'non_plugin_overall_scores_warning';
	if (document.getElementById(warningId)) return; // warning already shown
	var warningNote = document.createElement('div');
	warningNote.id = warningId;
	var scorecardsTable = document.getElementById('scorecards');
	insertAfter(warningNote, scorecardsTable);
	warningNote.innerHTML = '<super style="color: orange; font-weight: bold">*</super> This score was submitted without the MuleHouse Chrome plugin';
}

function warnPluginDiscrepancyOverallScores()
{
	var warningId = 'plugin_discrepancy_overall_scores_warning';
	if (document.getElementById(warningId)) return; // warning already shown
	var warningNote = document.createElement('div');
	warningNote.id = warningId;
	var scorecardsTable = document.getElementById('scorecards');
	insertAfter(warningNote, scorecardsTable);
	warningNote.innerHTML = '<super style="color: red; font-weight: bold">**</super> This score wasn\'t saved properly by the MuleHouse Chrome plugin. Please email this URL to Uri!';
}

function getSummaries()
{
	if (!needSummaries) return;
	var scorecardSections = Array.from(document.querySelectorAll('.scorecards-section h4'));
	iScorecardSection = scorecardSections.findIndex(function (h4) { return /Scorecard Summary/.test(h4.innerText)});
	if (iScorecardSection < 0) return;                // No scorecard section
	needSummaries = false; // won't fire again since data will have already been loaded
	var links = Array.from(document.querySelectorAll('table#scorecards td.name a'));
	var scorecards = links.map(function (link, iLink) 
	{ 
		return { i: iLink, reviewer: link.innerText, url: link.href, html: '', link: link } 
	});
	var lastNode = scorecardSections[iScorecardSection];
	scorecards.forEach(function (scorecard) 
	{ 
		var summaryContainer = document.createElement('div');
		summaryContainer.id = 'summary_' + scorecard.i;
		var isLast = (scorecard.i == scorecards.length - 1);
		insertAfter(summaryContainer, lastNode);
		lastNode = summaryContainer;
		getScorecardSummary(scorecard.i, scorecard.url, function (i, doc)
		{
			wrapScorecardHTML(document.getElementById('summary_' + i), scorecard.reviewer, doc, scorecard.link, isLast);
		})
	});
}

function convertScorecardHTML(notesContainer)
{
	// Get MuleSoft overall rating (digit and +/-) and remove its container:
	var mulesoftOverallRatingContainer = notesContainer.getElementsByTagName('p')[0]; // Crazy, but that's where the key take-aways come back
	var mulesoftOverallRatingValue = getMuleSoftOverallRecommendationValue(mulesoftOverallRatingContainer.innerText);
	if (mulesoftOverallRatingValue) mulesoftOverallRatingContainer.style.display = 'none';
	// Map proper notes section titles:
	var reviewerNotesLabels = Array.from(notesContainer.querySelectorAll('strong'));
	reviewerNotesLabels.forEach(function (label)
	{
		var notesContainerData = lookupNotesTitle(label.innerText);
		if (notesContainerData.index > 0)
		{
			label.innerText = notesContainerData.newText;
		}
	});
	return mulesoftOverallRatingValue;
}

function wrapScorecardHTML(container, reviewerName, doc, link, isLast)
{
	var reviewer = document.createElement('div');
	reviewer.innerText = reviewerName;
	reviewer.style = 'font-size: 14px; font-weight: bold; padding-bottom: 10px';
	container.appendChild(document.createElement('hr'));
	container.appendChild(reviewer);
	var reviewerNotes = container.appendChild(doc.getElementsByClassName('notes')[0]);

	var mulesoftOverallRating = convertScorecardHTML(reviewerNotes);

	// Convert overall rating to MuleSoft rating, if available and consistent:
	var ratingElt = link.closest('tr').querySelector('.rating span');
	if (ratingElt)
	{
		var ratingValue = parseInt(ratingElt.getAttribute('data-rating-id'));
		var mulesoftNumericRating = mulesoftRatings[ratingValue - 1];
		if (mulesoftNumericRating)
		{
			if (mulesoftOverallRating)
			{
				if (mulesoftOverallRating.numeric == mulesoftNumericRating)
				{
					ratingElt.innerHTML = mulesoftOverallRating.value;
				}
				else
				{
					ratingElt.innerHTML = mulesoftNumericRating + ' <super style="color: red">**</super>';
					warnPluginDiscrepancyOverallScores();
				}
			}
			else
			{
				ratingElt.innerHTML = mulesoftNumericRating + ' <super style="color: orange">*</super>';
				warnNonPluginOverallScores();
			}
		}
	}
	if (isLast)
	{
		container.appendChild(document.createElement('hr'));
	}
}
