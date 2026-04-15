const quizData = [
  {
    question: "You prefer a trip that feels...",
    answers: [
      { text: "Calm & healing", type: "calm" },
      { text: "Adventurous", type: "adventure" },
    ],
  },
  {
    question: "Your ideal morning is...",
    answers: [
      { text: "Coffee & nature", type: "calm" },
      { text: "Exploring new streets", type: "adventure" },
    ],
  },
];

let currentQuestion = 0;
let selectedAnswers = [];

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const nextBtn = document.getElementById("nextBtn");
const resultEl = document.getElementById("result");

function loadQuestion() {
  const q = quizData[currentQuestion];
  questionEl.textContent = q.question;
  answersEl.innerHTML = "";

  q.answers.forEach((a) => {
    const div = document.createElement("div");
    div.textContent = a.text;
    div.classList.add("answer");

    div.onclick = () => {
      document.querySelectorAll(".answer").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
      selectedAnswers[currentQuestion] = a.type;
    };

    answersEl.appendChild(div);
  });
}

nextBtn.onclick = () => {
  if (!selectedAnswers[currentQuestion]) return alert("Pick one first!");

  currentQuestion++;

  if (currentQuestion < quizData.length) {
    loadQuestion();
  } else {
    showResult();
  }
};

function showResult() {
  document.querySelector(".container").innerHTML = "";

  const calmCount = selectedAnswers.filter(a => a === "calm").length;
  const result = calmCount > 1 ? "🌿 Calm Traveler" : "🔥 Adventure Seeker";

  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `<h2>${result}</h2><p>This is your Kazei vibe.</p>`;

  document.querySelector(".container").appendChild(resultEl);
}

loadQuestion();
