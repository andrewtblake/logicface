function $(elem) { return document.getElementById(elem); }

///////////////////////////////////////////////////////////////
// globals

// the following variables allow the user to type in "s" or "lentes"
// etc., in the expression bar ("assertion"), and the value converts
// to the values given

// note: 10 decimal is 1010 binary, corresponding to the positions of
// the faces with shades
var s = 10;
var l = 10;
var shades = 10;
var lentes = 10;

// note: 12 decimal is 1100 binary, corresponding to the positions of
// the faces with beard
var b = 12;
var beard = 12;
var barba = 12;


// these will allow us to be multi-lingual in the future
var beard_word = 'beard';
var shades_word = 'shades';
var and_word = ' and ';
var or_word = ' or ';
var not_word = '!';

var target_value = 0;
// the value being tried for

// (in the case of formulation, it is the random value that the user
// tries to create an expression to match)

// (in the case of comprehension, it is the value that the user
// creates by configuring the faces image, in the attempt to match the
// randomly generated expression)



var expression_value = 0;
// the value of the randomly generated expression in the comprehension test


// scores
var correct = 0;
var wrong = 0;



function switchVisibility(show, hide)
{
  $(hide).style.display = 'none';
  $(show).style.display = 'block';
}


////////////////////////////////////////////////////////
// functions for luck

// return a random integer between 0 and (range - 1)
function randint(range)
{
  return Math.floor(Math.random() * range);
}

// return true with a 1-in-range probability
function chance(range)
{
  return randint(range) == 0;
}

// return true with a 1-in-2 probability
function coinflip()
{
  return chance(2);
}

// functions for luck
////////////////////////////////////////////////////////



// convert the simple logic phrase into a bitwise equivalent
// spanish allowed: "y" for "and", "o" for "or", "no" for "not"
function convertLogicToBitwise(value)
{
  value = value.replace(/ and /gi, ' & ');
  value = value.replace(/ y /gi, ' & ');
  value = value.replace(/ or /gi, ' | ');
  value = value.replace(/ o /gi, ' | ');
  value = value.replace(/[&][&]/gi, '&');
  value = value.replace(/[|][|]/gi, '|');
  value = value.replace(/!/g, '~');
  value = value.replace(/not/g, '~');
  value = value.replace(/no/g, '~');
  value = value.replace(/true/g, '15');
  return value;
}


function resolve(phrase_string, invert)
{
  if (invert)
    return eval("15 & ~(" + convertLogicToBitwise(phrase_string) + ")");
  else
    return eval("15 & (" + convertLogicToBitwise(phrase_string) + ")");
}

function preloadImages ()
{
  for (i = 0; i<16; i++)
    document.write("<div style='display:none'><img src='logicfaces-" + i.toString(16) + ".png'></div>\n");
}

function formulationAttempt()
{

  try {
    res = resolve ($('assertion').value, !puzzletype)
  } catch(err) { return alert ("mal-formed"); }

  if (res == target_value)
  {
    alert('correct');
    correct ++;
    formulation_reload();
  }
  else {
    document.wrongtry.src = 'logicfaces-' + res.toString(16) + '.png';
    $('wrong-try-display').style.display='block';
    wrong ++;
    $('wrong').innerHTML = wrong;
  }


}

function comprehensionAttempt()
{
  if (expression_value == target_value)
  {
    alert("correct");
    correct ++;
    comprehension_reload();
  }
  else
  {
    alert("wrong");
    wrong ++;
    $('wrong').innerHTML = wrong;
  }
}

function resizeImageMap(map, width, height)
{
  mid_width = width >> 1;
  mid_height = height >> 1;

  coords_array = [
    "0, 0, " + mid_width + ", " + mid_height,
    mid_width + ", 0, " + width + ", " + mid_height,
    "0, " + mid_height + ", " + mid_width + ", " + height,
    mid_width + ", " + mid_height + ", " + width + ", " + height
  ]
  areas = map.getElementsByTagName('area');
  i = 0;
  for (a in coords_array) areas[i].coords = coords_array[i ++];
}

function resizeImage()
{
  best_height = window.innerHeight - 50;
  best_width = Math.floor(best_height * 0.75);
  document.faces.style.height = best_height;
  document.faces.style.width = best_width;

  map = $("facesmap");
  if (map) resizeImageMap(map, best_width, best_height);
}


function update_image()
{
  document.faces.src = "logicfaces-" + target_value.toString(16) + ".png";

  resizeImage();

  $('correct').innerHTML = correct;
  $('wrong').innerHTML = wrong;
}

function pullOutRandomPuzzle()
{
  index = randint(puzzles.length);
  puzzle = puzzles[index];
  puzzles.splice(index, 1); // remove it
  return puzzle;
}

function resetChallenge()
{
  alert("Congratulations, you have completed the challenge -- you may stop now, or do it all again");
  correct = 0;
  wrong = 0;
  for (i = 0; i < 32; i ++) puzzles[i] = i;
}

function formulation_reload()
{
  if (puzzles.length == 0) resetChallenge();

  puzzle = pullOutRandomPuzzle();
  puzzletype = puzzle & 1;
  target_value = puzzle >> 1;


  update_image();

  $('if_unless_space').innerHTML = ( puzzletype ? '<font color=darkgreen>if</font>' : '<font color=red>unless</font>' );


  $('assertion').value = '';
  $('wrong-try-display').style.display='none';
}

function comprehension_reload()
{
  if (puzzles.length == 0) resetChallenge();

  puzzle = pullOutRandomPuzzle();

  $('expression').innerHTML = comprehensions[puzzle];
  expression_value = puzzle >> 1;

  update_image();
}


// return true if the phrase "[left] [comb] [right]" is going to be
// pointlessly elaborate in some way
// e.g. "beard and beard" or "shades and (shades or beard)"
function redundant(left, right, comb)
{
  if (left == right) return true;
  var l = resolve(left);
  var r = resolve(right);
  if (l == r) return true;
  var w = resolve(l + comb + r);
  if (l == w || r == w) return true;
  return false;
}

// here we generate a random logical phrase, trying to avoid anything
// pointlessly elaborate (see above)
function expression (level)
{
  level = level || 0;

  var left, right, comb, neg = '';

  if (level)
    neg = coinflip() ? not_word : '';


  if (chance(3 - level)) return neg + (coinflip() ? beard_word : shades_word);

  comb = coinflip() ? or_word : and_word;

  do {
    left = expression (level + 1);
    right = expression (level + 1);
  } while (redundant(left, right, comb));

  if (level)
    return neg + '(' + left + comb + right + ')';
  else
    return left + comb + right;
}

function toggleface(n)
{
  target_value ^= ( 1 << n );
  update_image();
}

function loadHalfOfComprehensions(inverted)
{
  preamble = inverted ? "<font color=red>unless</font> " : "<font color=darkgreen>if</font> ";
  offset = inverted ? 1 : 0;

  var expressions = [];
  while (expressions.length < 16) {
    do {
      phrase = expression();
      e = resolve (phrase, inverted);
    } while (expressions.indexOf(e) != -1);

    expressions.push(e);
    comprehensions [2 * e + offset] = preamble + phrase;
  }
}
