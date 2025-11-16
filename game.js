const canvas = document.getElementById("gameCanvas");
      const ctx = canvas.getContext("2d");

      let gameStarted = false;
      let gameEnded = false;
      let gameWon = false;
      let score = 0;
      let highScore = localStorage.getItem("highScore");
      if (highScore === null) {
        highScore = 0;
      } else {
        highScore = parseInt(highScore, 10);
      }

      const brickGrid = {
        rows: 5,
        cols: 10,
      };
      const brick = {
        width: 30,
        height: 20,
        paddingLeft: 30,
        paddingTop: 15,
        offsetTop: 100,
        offsetLeft: 35,
      };

      const brickColors = [
        "rgb(153, 51, 0)",
        "rgb(255, 0, 0)",
        "rgb(255, 153, 204)",
        "rgb(0, 255, 0)",
        "rgb(255, 255, 153)",
      ];

      const bricks = [];
      for (let r = 0; r < brickGrid.rows; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickGrid.cols; c++) {
          const x = brick.offsetLeft + c * (brick.width + brick.paddingLeft);
          const y = brick.offsetTop + r * (brick.height + brick.paddingTop);
          bricks[r][c] = { x, y, status: 1, color: brickColors[r] };
        }
      }

      const paddle = {
        width: 75,
        height: 15,
        x: (canvas.width - 75) / 2,
        speed: 3,
        dx: 0,
        paddleOffset: 10,
      };

      const ball = {
        size: 20,
        x: 0,
        y: 0,
        dx: Math.random() < 0.5 ? 1 : -1,
        dy: -1.5,
        speed: 1.0,
      };
      ball.x = canvas.width / 2 - ball.size / 2;
      ball.y =
        canvas.height - paddle.paddleOffset - paddle.height - ball.size - 8;

      // Input handling
      document.addEventListener("keydown", (e) => {
        if (!gameStarted && e.key === " ") {
          gameStarted = true;
          return;
        }

        if (e.key === "ArrowRight") paddle.dx = paddle.speed;
        if (e.key === "ArrowLeft") paddle.dx = -paddle.speed;
      });

      document.addEventListener("keyup", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") paddle.dx = 0;
      });

      function update() {
        if (score === brickGrid.rows * brickGrid.cols) {
          gameEnded = true;
          gameWon = true;
          gameWonScreen();
          return;
        }

        paddle.x += paddle.dx;
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > canvas.width)
          paddle.x = canvas.width - paddle.width;

        ball.x += ball.dx * ball.speed;
        ball.y += ball.dy * ball.speed;

        // Ball collisions with bricks
        for (let r = 0; r < brickGrid.rows; r++) {
          for (let c = 0; c < brickGrid.cols; c++) {
            if (checkBrickCollision(bricks[r][c])) {
              score++;
              ball.speed += 0.01;
              break;
            }
          }
        }

        // Ball collisions with walls
        if (ball.x + ball.size > canvas.width || ball.x < 0) {
          ball.dx *= -1;
        }
        if (ball.y < 0) {
          ball.dy *= -1;
        }

        // Ball collision with paddle
        if (
          ball.y + ball.size >
            canvas.height - paddle.height - paddle.paddleOffset &&
          ball.x + ball.size > paddle.x &&
          ball.x < paddle.x + paddle.width
        ) {
          ball.dy *= -1;
          ball.dx =
            ((ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)) *
            ball.speed;
        }

        // Game over
        if (ball.y > canvas.height) {
          gameEnded = true;
          gameOverScreen();
          if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
          }
        }
      }

      function darkerColor(color) {
        return color.replace(/rgb\((\d+), (\d+), (\d+)\)/, (match, r, g, b) => {
          return `rgb(${Math.floor(r * 0.3)}, ${Math.floor(
            g * 0.3
          )}, ${Math.floor(b * 0.3)})`;
        });
      }

      function drawPaddle() {
        const grad = ctx.createLinearGradient(
          paddle.x,
          canvas.height - paddle.height - paddle.paddleOffset,
          paddle.x + paddle.width,
          canvas.height - paddle.paddleOffset
        );
        grad.addColorStop(0, "lightgray");
        grad.addColorStop(1, "darkgray");
        ctx.fillStyle = grad;
        ctx.fillRect(
          paddle.x,
          canvas.height - paddle.height - paddle.paddleOffset,
          paddle.width,
          paddle.height
        );
      }

      function drawBall() {
        const grad = ctx.createLinearGradient(
          ball.x,
          ball.y,
          ball.x + ball.size,
          ball.y + ball.size
        );
        grad.addColorStop(0, "white");
        grad.addColorStop(1, "gray");
        ctx.fillStyle = grad;
        ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
      }

      function drawBricks() {
        for (let r = 0; r < brickGrid.rows; r++) {
          for (let c = 0; c < brickGrid.cols; c++) {
            if (bricks[r][c].status === 1) {
              const b = bricks[r][c];

              const grad = ctx.createLinearGradient(
                b.x,
                b.y,
                b.x + brick.width,
                b.y + brick.height
              );
              grad.addColorStop(0, b.color); // base color
              grad.addColorStop(1, darkerColor(b.color)); // darker edge
              ctx.fillStyle = grad;
              ctx.fillRect(b.x, b.y, brick.width, brick.height);

              // Edge highlight
              ctx.strokeStyle = "white";
              ctx.strokeRect(b.x, b.y, brick.width, brick.height);
            }
          }
        }
      }

      function checkBrickCollision(b) {
        if (b.status === 0) return false;

        // AABB collision check
        if (
          ball.x < b.x + brick.width &&
          ball.x + ball.size > b.x &&
          ball.y < b.y + brick.height &&
          ball.y + ball.size > b.y
        ) {
          const overlapLeft = ball.x + ball.size - b.x;
          const overlapRight = b.x + brick.width - ball.x;
          const overlapTop = ball.y + ball.size - b.y;
          const overlapBottom = b.y + brick.height - ball.y;

          const minOverlap = Math.min(
            overlapLeft,
            overlapRight,
            overlapTop,
            overlapBottom
          );

          // Flip direction based on the smallest overlap
          if (minOverlap === overlapLeft) {
            ball.dx = -Math.abs(ball.dx);
          } else if (minOverlap === overlapRight) {
            ball.dx = Math.abs(ball.dx);
          } else if (minOverlap === overlapTop) {
            ball.dy = -Math.abs(ball.dy);
          } else if (minOverlap === overlapBottom) {
            ball.dy = Math.abs(ball.dy);
          }

          b.status = 0;
          return true;
        }

        return false;
      }

      function startScreen() {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.font = "bold 36px Helvetica";
        const title = "BREAKOUT";
        const titleMetrics = ctx.measureText(title);
        const titleHeight =
          (titleMetrics.actualBoundingBoxAscent || 28) +
          (titleMetrics.actualBoundingBoxDescent || 8);
        ctx.fillText(title, centerX, centerY);

        ctx.font = "bold italic 18px Verdana";
        const sub = "Press SPACE to begin";
        const subMetrics = ctx.measureText(sub);
        const subHeight =
          (subMetrics.actualBoundingBoxAscent || 12) +
          (subMetrics.actualBoundingBoxDescent || 6);

        const subY = centerY + titleHeight / 2 + 10 + subHeight / 2;
        ctx.fillText(sub, centerX, subY);
      }

      function scoreText() {
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`Score: ${score}`, 20, 20);
      }

      function highScoreText() {
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(`High Score: ${highScore}`, canvas.width - 100, 20);
      }

      function gameWonScreen() {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.fillStyle = "lime";
        ctx.font = "bold 40px Helvetica";
        const title = "YOU WIN!";
        ctx.fillText(title, centerX, centerY);

        ctx.font = "bold italic 18px Verdana";
        const sub = `Score: ${score}`;
        ctx.fillText(sub, centerX, centerY + 35);

        const restartMsg = "Refresh to Play Again";
        ctx.fillText(restartMsg, centerX, centerY + 60);

        gameStarted = false;
      }

      function gameOverScreen() {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.fillStyle = "yellow";
        ctx.font = "bold 40px Helvetica";
        const title = "GAME OVER";
        ctx.fillText(title, centerX, centerY);

        ctx.font = "bold italic 18px Verdana";
        const sub = `Score: ${score}`;
        ctx.fillText(sub, centerX, centerY + 35);

        const restartMsg = "Refresh to Restart";
        ctx.fillText(restartMsg, centerX, centerY + 60);

        gameStarted = false;
      }

      function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPaddle();
        drawBricks();
        drawBall();
        scoreText();
        highScoreText();
      }

      function gameLoop() {
        if (gameWon) {
          render();
          gameWonScreen();
          return;
        } else if (gameEnded) {
          render();
          gameOverScreen();
          return;
        } else if (!gameStarted) {
          render();
          startScreen();
          requestAnimationFrame(gameLoop);
          return;
        }

        update();
        render();
        requestAnimationFrame(gameLoop);
      }

      gameLoop();