const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function renderCard(card) {
  const el = document.createElement("div");
  el.className = "card";
  el.textContent = `${card.rank}${card.suit}`;
  el.addEventListener("click", () => {
    el.classList.toggle("selected");
  });
  return el;
}

function main() {
  const board = document.getElementById("board");
  if (!board) return;

  const deck = shuffle(buildDeck());
  for (const card of deck) {
    board.appendChild(renderCard(card));
  }
}

document.addEventListener("DOMContentLoaded", main);
