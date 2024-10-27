const questions = [
    {
        question: `Which country is known as the "Land of the Rising Sun"`,
        correctAnswer: "Japan",
        wrongAnswers: [
            "China",
            "Brazil",
            "New Zealand"
        ]
    },
    {
        question: "Which planet is known as the 'Red Planet'?",
        correctAnswer: "Mars",
        wrongAnswers: [
            "Jupiter",
            "Venus",
            "Saturn"
        ]
    },
    {
        question: "What is the largest mammal in the world?",
        correctAnswer: "Blue whale",
        wrongAnswers: [
            "Elephant",
            "Giraffe",
            "Great white shark"
        ]
    },
    {
        question: "Who painted the Mona Lisa?",
        correctAnswer: "Leonardo da Vinci",
        wrongAnswers: [
            "Pablo Picasso",
            "Vincent van Gogh",
            "Claude Monet"
        ]
    },
    {
        question: "What is the capital city of Canada?",
        correctAnswer: "Ottawa",
        wrongAnswers: [
            "Toronto",
            "Vancouver",
            "Montreal"
        ]
    },
    {
        question: "What is the largest continent by area?",
        correctAnswer: "Asia",
        wrongAnswers: [
            "Africa",
            "North America",
            "South America"
        ]
    },
    {
        question: "Which element has the chemical symbol 'O'?",
        correctAnswer: "Oxygen",
        wrongAnswers: [
            "Gold",
            "Iron",
            "Magnesium"
        ]
    },
    {
        question: "In which country would you find the Eiffel Tower?",
        correctAnswer: "France",
        wrongAnswers: [
            "Italy",
            "Germany",
            "Spain"
        ]
    },
    {
        question: "Which ocean is the largest by area?",
        correctAnswer: "Pacific Ocean",
        wrongAnswers: [
            "Atlantic Ocean",
            "Indian Ocean",
            "Arctic Ocean"
        ]
    },
    {
        question: "Who wrote the play 'Romeo and Juliet'?",
        correctAnswer: "William Shakespeare",
        wrongAnswers: [
            "Charles Dickens",
            "Jane Austen",
            "Mark Twain"
        ]
    },
    {
        question: "What is the smallest prime number?",
        correctAnswer: "2",
        wrongAnswers: [
            "1",
            "3",
            "5"
        ]
    }
]

const game = (function() {
    const maxPlayers = 4;
    const questionDisplayTime = 5;
    //const maxAnswerDisplayTime = 20; TODO
    let currentPhase = 0;
    let currentQuiz;
    const playerHues = [220, 120, 60, 280];
    let players = [];
    let buzzedPlayer = null;
    let awaitingBuzzer = false;
    let correctAnswerIndex = 0;

    const onPlayersChanged = new CustomEvent("onplayerschanged");
    const onQuestionChanged = new CustomEvent("onquestionchanged");
    const onAnswersAvailable = new CustomEvent("onanswersavailable");

    const getPlayers = () => players;
    const getBuzzedPlayer = () => buzzedPlayer;
    const isInLobby = () => currentPhase == 0;
    const getQuiz = () => currentQuiz;

    function resetGame(){
        currentPhase = 0;
        players = [];
        document.dispatchEvent(onPlayersChanged);
    }

    function resetPlayerScores(){
        players.forEach(x => x.setScore(0));
    }

    function addNewPlayer(name){
        if(players.length >= maxPlayers){
            console.log("Max players reached!");
            return false;
        }

        if(players.findIndex(x => x.name == name) > -1){
            return false;
        }

        const player = createPlayer(name, playerHues[(players.length ?? 0) % playerHues.length]);
        console.log(player.hue);
        players.push(player);
        document.dispatchEvent(onPlayersChanged);
        console.log(`New player was added: ${name}`);
        return true;
    }

    function initializeNewQuiz(questionCount){
        currentQuiz = createQuiz(questionCount);
        console.log(`Quiz started with ${currentQuiz.questions.length} questions and ${players.length} players: `,
            ...players.map(x => x.name)
        );
    }

    function startGame(){
        if(players.length == 0){
            console.log("No enough players")
            return;
        }

        currentPhase = 1;
        resetPlayerScores();
        initializeNewQuiz(3);
        displayCurrentQuestion();
    }

    function gotoNextQuestion(){
        currentQuiz.incrementQuestionIndex();
        if(currentQuiz.getCurrentQuestion()){
            displayCurrentQuestion();
        }else{
            const winnerPlayer = players.reduce((prev, cur) => {
                return (prev.getScore() < cur.getScore()) ? cur : prev;
            }, players[0]);
            console.log("The quiz has ended!", 
                "\n", `Player ${winnerPlayer.name} won with score of ${winnerPlayer.getScore()}!`
            );
        }
    }

    function displayCurrentQuestion(){
        const currentQuestion = currentQuiz.getCurrentQuestion();

        console.log(currentQuestion.question);
        buzzedPlayer = null;
        console.log("buzzed player set to null")
        document.dispatchEvent(onQuestionChanged);
        setTimeout(() => {
            let possibleAnswers = [currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers];
            possibleAnswers.sort(() => Math.random() * 2 - 1);
            const displayAnswers = possibleAnswers.map((x, i) => ((i+1)+ ". " + x));
            displayAnswers.forEach(x => console.log(x))
            correctAnswerIndex = possibleAnswers.indexOf(currentQuestion.correctAnswer);
            awaitingBuzzer = true;
            document.dispatchEvent(onAnswersAvailable);
        }, questionDisplayTime * 1000);
    }

    /*function evaluateKey(key){
        
        /*const playerWithKey = players.find(x => x.name == key);

        if(playerWithKey){
            playerWithKey.pressBuzzer();
        }else if(currentPhase == 0)
        {
            addNewPlayer(key);
        }
    }*/

    function getPlayerByName(name){
        return players.find(x => x.name == name);
    }

    function invokeBuzzer(buzzer, player){
        if(currentPhase != 1){
            console.log("Game not yet started!");
            return;
        }
        if(player == null){
            console.error("Cannot invoke buzzer of NULL player!");
            return;
        }
        if(buzzedPlayer == null && awaitingBuzzer){
            buzzedPlayer = player;
            const onPlayerTurn = new CustomEvent("onplayerturn", {"detail": {player}});
            console.log(player.name, "Buzzed!")
            buzzer.dispatchEvent(onPlayerTurn);
            awaitingBuzzer = false;
            console.log(buzzedPlayer.name);
            
            /*const answer = prompt(`${buzzedPlayer.name} buzzed! Select a number 1-4`);
            if(correctAnswerIndex == (answer-1)){
                buzzedPlayer.incrementScore();
                console.log(`${buzzedPlayer.name} answered CORRECTLY!`,
                    `Their score is now ${buzzedPlayer.getScore()}`);
            }
            else{
                buzzedPlayer.decrementScore();
                console.log(`${buzzedPlayer.name} answered WRONG!`,
                    `Their score is now ${buzzedPlayer.getScore()}`);
            }

            gotoNextQuestion();*/
        }
    }

    function provideAnswer(player, answer){
        let wasCorrect = false;
        if(player == buzzedPlayer){
            console.log(currentQuiz.getCurrentQuestion().correctAnswer, "got:", answer)
            if(currentQuiz.getCurrentQuestion().correctAnswer == answer){
                wasCorrect = true;
            }
        }

        setTimeout(gotoNextQuestion, 3000);

        return wasCorrect;
    }

    return {addNewPlayer, initializeNewQuiz, startGame, resetGame, gotoNextQuestion, displayCurrentQuestion,
        invokeBuzzer, getPlayerByName, getPlayers, isInLobby, getQuiz, questionDisplayTime, getBuzzedPlayer, provideAnswer
    };
}())

function createQuiz(questionCount){
    questionCount = Math.min(questions.length, Math.max(questionCount, 1));
    const used = [];
    const quizQuestions = [];
    while(quizQuestions.length < questionCount){
        let index = Math.floor(Math.random() * questions.length);
        if(used.includes(index)){
            continue;
        }
        quizQuestions.push(questions[index]);
        used.push(index);
    }
    
    let questionIndex = 0;
    const incrementQuestionIndex = () => questionIndex++;
    const getCurrentQuestion = () => quizQuestions[questionIndex];

    return {questions: quizQuestions, getCurrentQuestion, incrementQuestionIndex};
}

function createPlayer(name, hue){
    let score = 0;
    const getScore = () => score;
    const setScore = (val) => score = val;
    const incrementScore = () => score++;
    const decrementScore = () => score--;

    function pressBuzzer(){
        game.invokeBuzzer(this);
    }

    return {name, hue, getScore, setScore, incrementScore, decrementScore, pressBuzzer};
}

const displayController = (function(){
    const mainContent = document.querySelector(".main-content");
    const fanList = document.querySelector(".fan-list");
    const playerContainer = document.querySelector(".player-container");
    let playerBuzzerElements = [];
    const buzzerAudio = new Audio("./audio/click.mp3");
    const buzzersClicked = [];

    document.addEventListener("onplayerschanged", () => refreshPlayerUI());

    function refreshPlayerUI(){
        playerContainer.innerHTML = "";
        fanList.innerHTML = "";
        playerBuzzerElements = [];
        mainContent.style.setProperty("--player-count", game.getPlayers()? game.getPlayers().length : 0);
        game.getPlayers()?.forEach(player => {
            addPlayerBuzzer(player);
            addPlayerFan();
        });
        console.log("reset ui", game.getPlayers().length);
    }

    function createBuzzerHTML(name){
        name = name.toUpperCase();
        return `<button class="player-buzzer">
                    <p>${name}</p>
                </button>
                <div class="player-info">
                    <div class="player-name">Player A</div>
                    <div class="player-score">0</div>
                </div>`;
    }

    function addPlayerBuzzer(player){
        const newPlayerElement = document.createElement("div");
        newPlayerElement.classList.add("player-buzzer-container");
        newPlayerElement.innerHTML = createBuzzerHTML(player.name);
        newPlayerElement.dataset.playerIndex = playerBuzzerElements.length;
        newPlayerElement.dataset.playerName = player.name;
        playerContainer.appendChild(newPlayerElement);
        playerBuzzerElements.push(newPlayerElement);
        newPlayerElement.addEventListener("click", playerBuzzerClick);
        newPlayerElement.addEventListener("onplayerturn", displayPlayerTurn);
    }

    function addPlayerFan(){
        const newFanElement = document.createElement("div");
        newFanElement.classList.add("fan-item");
        fanList.appendChild(newFanElement);
    }

    function evaluateKeyDown(key){
        if(game.isInLobby()){
            if(game.addNewPlayer(key)){
                return;     //stop only if player was added
            }
        }

        const buzzer = playerBuzzerElements.find(x => x.dataset.playerName == key);
        if(buzzer && !buzzersClicked.includes(buzzer)){
            buzzer.classList.add("active");
            buzzer.click();
            buzzersClicked.push(buzzer);
        }
    }

    function evaluateKeyUp(key){
        const buzzer = playerBuzzerElements.find(x => x.dataset.playerName == key);
        if(buzzer){
            buzzer.classList.remove("active");
            buzzersClicked.pop(buzzer);
        }
    }

    function playerBuzzerClick(e){
        e.preventDefault();
        buzzerAudio.play();
        const buzzer = e.target.closest(".player-buzzer-container");
        const playerName = buzzer.dataset.playerName;
        const player = game.getPlayerByName(playerName);
        if(player){
            if(game.getBuzzedPlayer() == player){
                setAnswerFocus(currentFocusIndex + 1);
            }
            else{
                game.invokeBuzzer(buzzer, player);
            }
        }
    }

    const quizContainer = document.querySelector(".quiz-container");
    const quizQuestion = quizContainer.querySelector(".quiz-question");
    const quizCountdown = quizContainer.querySelector(".quiz-countdown");
    const quizAnswerContainer = quizContainer.querySelector(".quiz-answer-container");
    let currentFocusIndex = 0;

    
    document.addEventListener("onquestionchanged", displayCurrentQuestion);
    document.addEventListener("onanswersavailable", displayCurrentAnswers);

    function startGame(){
        game.startGame();
    } 

    function displayCurrentQuestion(){
        clearBuzzers();
        const currentQuestion = game.getQuiz().getCurrentQuestion();
        quizQuestion.textContent = currentQuestion.question;
        quizContainer.style.display = "flex";
        quizCountdown.style.display = "block";
        quizContainer.style.setProperty("--saturation", "0%");
        quizAnswerContainer.style.display = "none";
        let timeoutLength = game.questionDisplayTime;
        quizCountdown.textContent = timeoutLength;

        const inter = setInterval(() => {
            timeoutLength--;
            quizCountdown.textContent = timeoutLength;
            if(timeoutLength <= 0){
                quizCountdown.style.display = "none";
                clearInterval(inter);
            }
        }, 1000);
    }

    function clearBuzzers(){
        playerBuzzerElements.forEach(x => x.classList.remove("turn"));
    }

    function displayCurrentAnswers(){
        quizAnswerContainer.innerHTML = "";
        const currentQuestion = game.getQuiz().getCurrentQuestion();
        let possibleAnswers = [currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers];
        possibleAnswers.sort(() => Math.random() * 2 - 1);
        //correctAnswerIndex = possibleAnswers.indexOf(currentQuestion.correctAnswer);
        possibleAnswers.forEach(x => createAnswerItem(x));
        quizCountdown.style.display = "none";
        quizAnswerContainer.style.display = "grid";
    }

    function createAnswerItem(answerString){
        const newAnswer = document.createElement("button");
        newAnswer.classList.add("quiz-answer");
        newAnswer.textContent = answerString;
        quizAnswerContainer.appendChild(newAnswer);
    }

    function displayPlayerTurn(e){
        quizContainer.style.setProperty("--hue", e.detail.player.hue + "deg");
        quizContainer.style.setProperty("--saturation", "50%");
        currentFocusIndex = 0;
        e.target.classList.add("turn");
        setAnswerFocus(0);
        startAnswerTimer();
    }

    function setAnswerFocus(focusIndex){
        currentFocusIndex = focusIndex % quizAnswerContainer.childNodes.length;
        const answerElement = quizAnswerContainer.childNodes[currentFocusIndex];
        if(answerElement){
            answerElement.focus();
        }
    }

    function startAnswerTimer(){
        let timeoutLength = game.questionDisplayTime;
        quizCountdown.style.display = "block";
        quizCountdown.textContent = timeoutLength;

        const inter = setInterval(() => {
            timeoutLength--;
            quizCountdown.textContent = timeoutLength;
            if(timeoutLength <= 0){
                quizCountdown.style.display = "none";
                lockInAnswer();
                clearInterval(inter);
            }
        }, 1000);
    }

    function lockInAnswer(){
        const answerElement = quizAnswerContainer.childNodes[currentFocusIndex];
        if(answerElement){
            //answerElement.classList.add("locked-in");
            const correctAnswer = game.provideAnswer(game.getBuzzedPlayer(), answerElement.textContent);
            if(correctAnswer){
                answerElement.classList.add("correct");
            }else{
                answerElement.classList.add("wrong");
            }
        }
    }

    return {evaluateKeyDown, evaluateKeyUp, startGame};
}());

document.addEventListener("keydown", e => {
    if(e.key.length != 1) return;

    e.preventDefault();
    displayController.evaluateKeyDown(e.key.toUpperCase());
});

document.addEventListener("keyup", e => {
    if(e.key.length != 1) return;

    e.preventDefault();
    displayController.evaluateKeyUp(e.key.toUpperCase());
});

const resetGameButton = document.querySelector(".reset-game");
resetGameButton.addEventListener("click", e => {
    game.resetGame();
});

const startGameButton = document.querySelector(".start-game");
startGameButton.addEventListener("click", e => {
    displayController.startGame();
});