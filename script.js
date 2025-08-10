const socket = new WebSocket("wss://bloom-humdrum-save.glitch.me"); // Dein WebSocket-Link

socket.onopen = () => {
    console.log("✅ WebSocket verbunden!");
};

socket.onmessage = event => {
    try {
        let data = JSON.parse(event.data); // JSON umwandeln
        if (data.text) {
            showMessage(data.text); // Nachricht in den Chat schreiben
        }
    } catch (error) {
        console.error("❌ Fehler beim Parsen der Nachricht:", error);
    }
};

socket.onerror = error => {
    console.error("⚠️ WebSocket-Fehler:", error);
};

socket.onclose = () => {
    console.log("❌ WebSocket getrennt!");
};

// Funktion zum Senden von Nachrichten (nur bei Gewinn > 1000 und x3)
function sendMessage(message) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
    } else {
        console.warn("❌ WebSocket noch nicht bereit, versuche erneut...");
        setTimeout(() => sendMessage(message), 500);
    }
}


function toggleMenu() {
    let menu = document.getElementById("menu");
    menu.classList.toggle("active");
}

function showMessage(message) {
    let chatBox = document.getElementById("chat"); // Stelle sicher, dass du ein <div id="chat"> im HTML hast
    if (!chatBox) return;
    
    let msgElement = document.createElement("div");
    msgElement.textContent = message;
    msgElement.classList.add("chat-message");
    
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Nachrichten nur senden, wenn WebSocket wirklich offen ist

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("money-link").addEventListener("click", function(event) {
        event.preventDefault(); // Verhindert das Standardverhalten des Links
        window.location.href = "login.html"; // Weiterleitung zur Login-Seite
    });
});



let fakeMoney = localStorage.getItem("fakeMoney") ? Number(localStorage.getItem("fakeMoney")) : 1000;
updateMoney();

function placeBet(amount) {
    amount = Math.floor(Number(amount));
    if (isNaN(amount) || amount <= 0 || amount > fakeMoney) {
        return;
    }
    fakeMoney -= amount;
    updateMoney();
    dropBall(amount);
}

function dropBall(betAmount) {
    let ball = document.createElement("div");
    ball.classList.add("ball");
    document.getElementById("board").appendChild(ball);

    let x = 325 + (Math.random() * 20 - 10); 
    let y = 10;
    let velocityX = (Math.random() * 2 - 1) * 1.0;
    let velocityY = 0;
    let gravity = 0.35;
    let bounceFactor = 0.6;
    let friction = 0.99;

    let interval = setInterval(() => {
        velocityY += gravity;
        velocityX *= friction;
        x += velocityX;
        y += velocityY;

        let pegs = document.querySelectorAll(".peg");
        pegs.forEach(peg => {
            let rect = peg.getBoundingClientRect();
            let ballRect = ball.getBoundingClientRect();
            let dx = ballRect.x - rect.x;
            let dy = ballRect.y - rect.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 14) {
                let angle = Math.atan2(dy, dx);
                let speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY) * bounceFactor;
                velocityX = Math.cos(angle) * speed;
                velocityY = -Math.abs(Math.sin(angle) * speed) * bounceFactor;
                y -= 5;
            }
        });

        ball.style.left = x + "px";
        ball.style.top = y + "px";

        if (y > 750) {
            clearInterval(interval);
            let slotIndex = Math.round(x / 50);
            let multipliers = [0, 0.5, 0.75, 1.5, 1.75, 2.5, 3, 2.5, 1.75, 1.5, 0.75, 0.5, 0];
            let winMultiplier = multipliers[slotIndex] || 0;
            let winnings = betAmount * winMultiplier;
            fakeMoney += winnings;
            updateMoney();
            ball.remove();

            // ✅ Nachricht nur senden, wenn Gewinn > 1000 und Multiplier >= 3
            if (winMultiplier >= 3 && winnings > 1000) {
                let message = JSON.stringify({ text: `🎉 a Person won $${winnings}🎉🎊🥳` });
                sendMessage(message);
            }
        }
    }, 16);
}


function waitForWebSocket(callback, retries = 10) {
    if (socket.readyState === WebSocket.OPEN) {
        callback();
    } else if (retries > 0) {
        console.log(`⌛ Warte auf WebSocket-Verbindung... (${retries})`);
        setTimeout(() => waitForWebSocket(callback, retries - 1), 500);
    } else {
        console.error("❌ WebSocket-Verbindung fehlgeschlagen!");
    }
}



function updateMoney() {
    localStorage.setItem("fakeMoney", fakeMoney);
    let moneyElement = document.getElementById("money");
    
    // Aktualisiert nur den Text, ohne den Link zu löschen
    moneyElement.innerHTML = `Money: $${fakeMoney} <a id="money-link" href="login.html">+</a>`;
}

function createBoard() {
    let board = document.getElementById("board");
    let pegSpacing = 50;
    let rows = 12;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col <= row; col++) {
            let peg = document.createElement("div");
            peg.classList.add("peg");
            let offsetX = (650 - pegSpacing * row) / 2;  
            peg.style.left = (offsetX + col * pegSpacing) + "px";
            peg.style.top = (50 + row * 55) + "px";
            board.appendChild(peg);
        }
    }

    let multipliers = [0, 0.5, 0.75, 1.5, 1.75, 2.5, 3, 2.5, 1.75, 1.5, 0.75, 0.5, 0];

    for (let i = 0; i < multipliers.length; i++) {
        let slot = document.createElement("div");
        slot.classList.add("slot");
        slot.style.left = (i * 50) + "px";
        slot.innerText = "x" + multipliers[i];

        if (multipliers[i] === 0) {
            slot.style.background = "red";
            slot.style.color = "black";
        }

        document.getElementById("board").appendChild(slot);
    }
}

createBoard();
