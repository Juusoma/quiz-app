import questionDatabase from "./questionDatabase.js";

const time = (function(){
    let timeouts = [];
    let intervals = [];

    function createTimeout(func, delay){
        const timeo = setTimeout(func, delay);
        timeouts.push(timeo);
        return timeo;
    }

    function createInterval(func, delay){
        const inter = setInterval(func, delay)
        intervals.push(inter);
        return inter;
    }

    function clearTimeoutsAndIntervals(){
        timeouts.forEach(x => clearTimeout(x));
        intervals.forEach(x => clearInterval(x));
        timeouts = [];
        intervals = [];
    }

    return {createTimeout, createInterval, clearTimeoutsAndIntervals}
}());

const game = (function() {
    const maxPlayers = 4;
    const questionDisplayTime = 5;
    //const maxAnswerDisplayTime = 20; TODO
    let currentPhase = 0;
    let currentQuiz;
    const playerHues = [220, 120, 60, 280];
    let players = [];
    let buzzedPlayer = null;
    let winnerPlayer = null;
    let awaitingBuzzer = false;
    let correctAnswerIndex = 0;

    const onPlayersChanged = new CustomEvent("onplayerschanged");
    const onQuestionChanged = new CustomEvent("onquestionchanged");
    const onAnswersAvailable = new CustomEvent("onanswersavailable");
    const onPhaseChanged = new CustomEvent("onphasechanged");

    const getPlayers = () => players;
    const getBuzzedPlayer = () => buzzedPlayer;
    const getWinnerPlayer = () => winnerPlayer;
    const isInLobby = () => currentPhase == 0;
    const getQuiz = () => currentQuiz;
    const getPhase = () => currentPhase;

    function setPhase(newPhase){
        currentPhase = newPhase;
        document.dispatchEvent(onPhaseChanged);
    }

    function resetPlayers(){
        players = [];
        document.dispatchEvent(onPlayersChanged);
    }

    function resetQuiz(){
        buzzedPlayer = null;
        winnerPlayer = null;
        awaitingBuzzer = false;
        setPhase(0);
        time.clearTimeoutsAndIntervals();
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
        time.clearTimeoutsAndIntervals();
        resetQuiz();
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

        resetPlayerScores();
        initializeNewQuiz(3);
        setPhase(1);
        displayCurrentQuestion();
    }

    function gotoNextQuestion(){
        currentQuiz.incrementQuestionIndex();
        if(currentQuiz.getCurrentQuestion()){
            displayCurrentQuestion();
        }else{
            winnerPlayer = players.reduce((prev, cur) => {
                return (prev.getScore() < cur.getScore()) ? cur : prev;
            }, players[0]);
            console.log("The quiz has ended!", 
                "\n", `Player ${winnerPlayer.name} won with score of ${winnerPlayer.getScore()}!`
            );
            setPhase(2);
        }
    }

    function displayCurrentQuestion(){
        const currentQuestion = currentQuiz.getCurrentQuestion();

        console.log(currentQuestion.question);
        buzzedPlayer = null;
        console.log("buzzed player set to null")
        document.dispatchEvent(onQuestionChanged);
        time.createTimeout(() => {
            let possibleAnswers = [currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers];
            possibleAnswers.sort(() => Math.random() * 2 - 1);
            const displayAnswers = possibleAnswers.map((x, i) => ((i+1)+ ". " + x));
            displayAnswers.forEach(x => console.log(x))
            correctAnswerIndex = possibleAnswers.indexOf(currentQuestion.correctAnswer);
            awaitingBuzzer = true;
            document.dispatchEvent(onAnswersAvailable);
        }, questionDisplayTime * 1000);
    }

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
            buzzer.dispatchEvent(onPlayerTurn);
            awaitingBuzzer = false;
            
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
                player.incrementScore();
            }
        }

        time.createTimeout(gotoNextQuestion, 3000);

        if(!wasCorrect)
            player.decrementScore();
        return wasCorrect;
    }

    return {addNewPlayer, initializeNewQuiz, startGame, resetQuiz, resetPlayers, gotoNextQuestion, displayCurrentQuestion,
        invokeBuzzer, getPlayerByName, getPlayers, isInLobby, getQuiz, questionDisplayTime, getBuzzedPlayer, getWinnerPlayer, provideAnswer, getPhase
    };
}())

function createQuiz(questionCount){
    questionCount = Math.min(questionDatabase.length, Math.max(questionCount, 1));
    const used = [];
    const questions = [];
    while(questions.length < questionCount){
        let index = Math.floor(Math.random() * questionDatabase.length);
        if(used.includes(index)){
            continue;
        }
        questions.push(questionDatabase[index]);
        used.push(index);
    }
    
    let questionIndex = 0;
    const incrementQuestionIndex = () => questionIndex++;
    const getCurrentQuestion = () => questions[questionIndex];

    return {questions, getCurrentQuestion, incrementQuestionIndex};
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
    const buzzerClickAudio = new Audio("./audio/click.mp3");
    const wrongAnswerAudio = new Audio("./audio/wrong_answer.mp3");
    const correctAnswerAudio = new Audio("./audio/correct_answer.mp3");
    const playerTurnAudio = new Audio("./audio/player_turn.mp3");
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
                    <div class="player-name">Player ${name}</div>
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

    function getPlayerBuzzerElement(playerName){
        return playerBuzzerElements.find(x => x.dataset.playerName == playerName);
    }

    function evaluateKeyDown(key){
        if(game.isInLobby()){
            if(game.addNewPlayer(key)){
                return;     //stop only if player was added
            }
        }

        const buzzer = getPlayerBuzzerElement(key);
        if(buzzer && !buzzersClicked.includes(buzzer)){
            buzzer.classList.add("active");
            buzzer.click();
            buzzersClicked.push(buzzer);
        }
    }

    function evaluateKeyUp(key){
        const buzzer = getPlayerBuzzerElement(key);
        if(buzzer){
            buzzer.classList.remove("active");
            buzzersClicked.pop(buzzer);
        }
    }

    function playerBuzzerClick(e){
        e.preventDefault();
        const buzzer = e.target.closest(".player-buzzer-container");
        const playerName = buzzer.dataset.playerName;
        const player = game.getPlayerByName(playerName);
        if(player){
            buzzerClickAudio.play();
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
    document.addEventListener("onphasechanged", handleGamePhaseChange);

    function startGame(){
        game.startGame();
    } 

    function resetGame(){
        game.resetPlayers();
        game.resetQuiz();
        hideQuiz();
    } 

    function hideQuiz(){
        quizContainer.style.display = "none";
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

        const inter = time.createInterval(() => {
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
        playerTurnAudio.play();
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

        const inter = time.createInterval(() => {
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
                correctAnswerAudio.play();
            }else{
                answerElement.classList.add("wrong");
                wrongAnswerAudio.play();
            }
            displayPlayerScore(game.getBuzzedPlayer());
        }
    }

    function displayPlayerScore(player){
        const buzzer = getPlayerBuzzerElement(player.name);

        if(buzzer){
            const scoreElement = buzzer.querySelector(".player-score");
            if(scoreElement){
                scoreElement.textContent = player.getScore();
            }
        }
    }

    function refreshPlayerScores(){
        game.getPlayers().forEach(x => displayPlayerScore(x));
    }

    function displayQuizWinner(){
        quizCountdown.style.display = "none";
        quizAnswerContainer.style.display = "none";

        const winner = game.getWinnerPlayer()
        if(winner){
            quizQuestion.textContent = `Player ${winner.name} won with a score of ${winner.getScore()}`;
        }else{
            hideQuiz();
        }
    }

    function handleGamePhaseChange(){
        switch(game.getPhase()){
            case 0:
                hideQuiz();;
                break;
            case 1:
                refreshPlayerScores()
                break;
            case 2:
                displayQuizWinner();
                clearBuzzers();
                break;
        }
    }

    return {evaluateKeyDown, evaluateKeyUp, startGame, resetGame};
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
    displayController.resetGame();
});

const startGameButton = document.querySelector(".start-game");
startGameButton.addEventListener("click", e => {
    displayController.startGame();
});