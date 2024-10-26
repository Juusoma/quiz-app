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
    let players = [];
    let buzzedPlayer = null;
    let awaitingBuzzer = false;
    let correctAnswerIndex = 0;

    function resetGame(){
        currentPhase = 0;
        players = [];
        console.log("Game was reset!");
    }

    function resetPlayerScores(){
        players.forEach(x => x.setScore(0));
    }

    function addNewPlayer(name){
        if(players.length >= maxPlayers){
            console.log("Max players reached!");
            return;
        }

        const player = createPlayer(name);
        players.push(player);
        console.log(`New player was added: ${name}`);
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
        setTimeout(() => {
            let possibleAnswers = [currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers];
            possibleAnswers.sort(() => Math.random() * 2 - 1);
            const displayAnswers = possibleAnswers.map((x, i) => ((i+1)+ ". " + x));
            displayAnswers.forEach(x => console.log(x))
            correctAnswerIndex = possibleAnswers.indexOf(currentQuestion.correctAnswer);
            awaitingBuzzer = true;
        }, questionDisplayTime * 1000);
    }

    function evaluateKey(key){
        const playerWithKey = players.find(x => x.name == key);

        if(playerWithKey){
            playerWithKey.pressBuzzer();
        }else if(currentPhase == 0)
        {
            addNewPlayer(key);
        }
    }

    function invokeBuzzer(player){
        if(currentPhase != 1){
            console.log("Game not yet started!");
            return;
        }
        if(buzzedPlayer == null && awaitingBuzzer){
            buzzedPlayer = player;
            awaitingBuzzer = false;
            
            const answer = prompt(`${buzzedPlayer.name} buzzed! Select a number 1-4`);
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

            gotoNextQuestion();
        }
    }

    return {addNewPlayer, initializeNewQuiz, startGame, resetGame, gotoNextQuestion, displayCurrentQuestion,
        evaluateKey, invokeBuzzer
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

function createPlayer(name){
    let score = 0;
    const getScore = () => score;
    const setScore = (val) => score = val;
    const incrementScore = () => score++;
    const decrementScore = () => score--;

    function pressBuzzer(){
        game.invokeBuzzer(this);
    }

    return {name, getScore, setScore, incrementScore, decrementScore, pressBuzzer};
}

document.addEventListener("keypress", e => {
    e.preventDefault();
    game.evaluateKey(e.key);
});

const resetGameButton = document.querySelector(".reset-game");
resetGameButton.addEventListener("click", e => {
    game.resetGame();
});

const startGameButton = document.querySelector(".start-game");
startGameButton.addEventListener("click", e => {
    game.startGame();
});