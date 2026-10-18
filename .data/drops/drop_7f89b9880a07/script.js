let count = 0;
const countSpan = document.getElementById('count');
const btn = document.getElementById('counter-btn');
const timeBtn = document.getElementById('time-btn');
const msg = document.getElementById('msg');

btn.addEventListener('click', () => {
  count++;
  countSpan.textContent = count;
  msg.textContent = 'Interactivity verified! Counter clicked ' + count + ' times.';
});

timeBtn.addEventListener('click', () => {
  msg.textContent = 'Browser local time: ' + new Date().toLocaleTimeString();
});