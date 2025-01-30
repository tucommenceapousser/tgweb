(function() {
    // Création du conteneur pour l'animation
    const overlay = document.createElement("div");
    overlay.id = "trhacknon-overlay";
    document.body.appendChild(overlay);

    // Ajout du texte animé
    const creditText = document.createElement("div");
    creditText.id = "trhacknon-credit";
    creditText.innerHTML = '🚀 Mis en ligne grâce à <span>trhacknon</span>';
    overlay.appendChild(creditText);

    // Ajout du canevas pour les particules
    const canvas = document.createElement("canvas");
    canvas.id = "trhacknon-canvas";
    overlay.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    // Styles CSS pour l'animation
    const style = document.createElement("style");
    style.innerHTML = `
        #trhacknon-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        }
        #trhacknon-credit {
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 18px;
            font-family: Arial, sans-serif;
            color: #00ffcc;
            background: rgba(0, 0, 0, 0.6);
            padding: 8px 15px;
            border-radius: 8px;
            animation: floatUp 3s infinite alternate;
        }
        #trhacknon-credit span {
            color: #ffcc00;
            font-weight: bold;
        }
        #trhacknon-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        @keyframes floatUp {
            0% { transform: translate(-50%, 0); }
            100% { transform: translate(-50%, -5px); }
        }
    `;
    document.head.appendChild(style);

    // Ajustement du canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Création des particules
    let particles = [];
    const numParticles = 50;
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            color: `hsl(${Math.random() * 360}, 100%, 75%)`
        });
    }

    // Animation des particules
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
})();
