const board = document.getElementById("board");
const addGlobal = document.getElementById("addGlobal");
const supportBtn = document.getElementById("supportBtn");
const supportModal = document.getElementById("supportModal");
const closeSupport = document.getElementById("closeSupport");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

const modal = document.getElementById("cardModal");
const closeModal = modal.querySelector(".close");
const modalTitle = document.getElementById("modalTitle");
const cardDescription = document.getElementById("cardDescription");
const commentsList = document.getElementById("commentsList");
const commentInput = document.getElementById("commentInput");
const addCommentBtn = document.getElementById("addCommentBtn");
const historyList = document.getElementById("historyList");
const deleteCardBtn = document.getElementById("deleteCardBtn");

let currentCard = null;


const defaultData = [
  { title: "Vagas", cards: [] },
  { title: "Candidatei", cards: [] },
  { title: "Reunião com RH", cards: [] },
  { title: "Reunião Técnica", cards: [] },
  { title: "Teste Prático", cards: [] },
  { title: "Concluído", cards: [] }
];

function saveData() { localStorage.setItem("MeCandidateiData", JSON.stringify(columnsData)); }
function loadData() {
  const data = localStorage.getItem("MeCandidateiData");
  return data ? JSON.parse(data) : defaultData;
}

let columnsData = loadData();

function renderBoard() {
  board.innerHTML = "";
  columnsData.forEach((col, colIndex) => {
    const columnEl = document.createElement("div");
    columnEl.className = "column";
    columnEl.innerHTML = `<h2>${col.title}</h2>`;

    col.cards.forEach((card, cardIndex) => {
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      cardEl.innerHTML = `<div class="card-title">${card.title}</div>
                          <div class="card-desc">${card.description || ""}</div>`;
      cardEl.draggable = true;

      cardEl.addEventListener("dragstart", e => {
        cardEl.classList.add("dragging");
        e.dataTransfer.setData("colIndex", colIndex);
        e.dataTransfer.setData("cardIndex", cardIndex);
      });
      cardEl.addEventListener("dragend", () => cardEl.classList.remove("dragging"));
      cardEl.addEventListener("click", () => openCardModal(colIndex, cardIndex));

      columnEl.appendChild(cardEl);
    });

    columnEl.addEventListener("dragover", e => e.preventDefault());
    columnEl.addEventListener("drop", e => {
      const fromCol = e.dataTransfer.getData("colIndex");
      const fromCard = e.dataTransfer.getData("cardIndex");
      const movedCard = columnsData[fromCol].cards.splice(fromCard, 1)[0];
      const date = new Date().toLocaleString("pt-BR");
      movedCard.history = movedCard.history || [];
      movedCard.history.push(`${date} - Movido para "${col.title}"`);
      col.cards.push(movedCard);
      saveData(); renderBoard();
    });

    board.appendChild(columnEl);
  });
}

// Criar nova vaga
addGlobal.onclick = () => {
  const vaga = prompt("Digite o nome da vaga:");
  if (!vaga) return;
  columnsData[0].cards.push({
    title: vaga,
    description: "",
    comments: [],
    history: [`${new Date().toLocaleString("pt-BR")} - Criado`]
  });
  saveData(); renderBoard();
};

// Modal Card
function openCardModal(colIndex, cardIndex) {
  currentCard = { colIndex, cardIndex };
  const card = columnsData[colIndex].cards[cardIndex];
  modalTitle.value = card.title;
  cardDescription.value = card.description || "";
  renderComments(card.comments);
  renderHistory(card.history || []);
  modal.style.display = "flex";
}

function renderComments(comments) {
  commentsList.innerHTML = "";
  comments.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "comment";
    el.innerHTML = `<div><p>${c.text}</p><small>${c.date}</small></div>`;
    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => deleteComment(i);
    el.appendChild(delBtn);
    commentsList.appendChild(el);
  });
}

function renderHistory(history) {
  historyList.innerHTML = "";
  history.slice().reverse().forEach(h => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.innerHTML = `<p>${h}</p>`;
    historyList.appendChild(el);
  });
}

function deleteComment(index) {
  const card = columnsData[currentCard.colIndex].cards[currentCard.cardIndex];
  card.comments.splice(index, 1);
  saveData(); renderComments(card.comments);
}

// Fechar modal
closeModal.onclick = () => closeCardModal();
window.onclick = e => {
  if (e.target === modal) closeCardModal();
  if (e.target === supportModal) supportModal.style.display = "none";
};
function closeCardModal() { saveCardDetails(); modal.style.display = "none"; }

// Salvar card
function saveCardDetails() {
  if (!currentCard) return;
  const card = columnsData[currentCard.colIndex].cards[currentCard.cardIndex];
  card.title = modalTitle.value;
  card.description = cardDescription.value;
  saveData(); renderBoard();
}

// Comentário
addCommentBtn.onclick = () => {
  const text = commentInput.value.trim();
  if (!text) return;
  const card = columnsData[currentCard.colIndex].cards[currentCard.cardIndex];
  const date = new Date().toLocaleString("pt-BR");
  card.comments.push({ text, date });
  saveData(); renderComments(card.comments); commentInput.value = "";
};

// Excluir card com segurança
deleteCardBtn.onclick = () => {
  if (!currentCard) return;
  const confirmDelete = confirm("Tem certeza que deseja excluir este card?");
  if (!confirmDelete) return;
  const { colIndex, cardIndex } = currentCard;
  modal.style.display = "none";
  columnsData[colIndex].cards.splice(cardIndex, 1);
  currentCard = null;

  saveData();
  renderBoard();
};


// Modal de apoio
supportBtn.onclick = () => supportModal.style.display = "flex";
closeSupport.onclick = () => supportModal.style.display = "none";

// EXPORTAR DADOS
exportBtn.onclick = () => {
  const dataStr = JSON.stringify(columnsData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MeCandidatei_backup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// IMPORTAR DADOS
importBtn.onclick = () => importFile.click();

importFile.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const importedData = JSON.parse(ev.target.result);
      if (!Array.isArray(importedData)) throw new Error("Formato inválido.");
      columnsData = importedData;
      saveData();
      renderBoard();
      alert("Dados importados com sucesso!");
    } catch (err) {
      alert("Erro ao importar dados: " + err.message);
    }
  };
  reader.readAsText(file);
};

renderBoard();
