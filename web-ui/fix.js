document.addEventListener('DOMContentLoaded', function() {

  // Homepage: "Quizzes" menu → Quiz List page
  document.querySelectorAll('d2l-menu-item-link[text="Quizzes"]').forEach(function(el) {
    el.setAttribute('href', 'Quiz List - CON0101-23W-Sec1-Conestoga 101 - eConestoga.html');
    var a = el.querySelector('a');
    if (a) a.href = 'Quiz List - CON0101-23W-Sec1-Conestoga 101 - eConestoga.html';
  });

  // Quiz List: quiz links → Summary page
  document.querySelectorAll('a[title="Quiz summary"]').forEach(function(el) {
    el.href = 'Summary - Quiz_ My Rights and Responsibilities - CON0101-23W-Sec1-Conestoga 101 - eConestoga.html';
    el.onclick = null;
    el.removeAttribute('onclick');
  });

  // Summary: "Continue Quiz..." button → Quizzes page
  document.querySelectorAll('button.d2l-button').forEach(function(el) {
    if (el.textContent.trim().includes('Continue Quiz')) {
      el.textContent = 'Start Assessment';
      el.onclick = function() { window.location.href = 'Quizzes - CON0101-23W-Sec1-Conestoga 101 - eConestoga.html'; };
    }
  });

});
