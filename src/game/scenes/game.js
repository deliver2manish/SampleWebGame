game.module(
    "game.scenes.game"
)
.require(
    "game.assets",
    "game.entities.blank-spot",
    "game.entities.bubble",
    "game.entities.button",
    "game.entities.progress-bar"
)
.body(function() {

game.SceneGame = game.Scene.extend({
    GameState: {
        IDLE: 0,
        PLAYING: 1,
        NEW_QUESTION: 2,
        END: 3
    },
    curState: 0,

    // Temporary word list.
    words: [
        "APPLE",
        "BIRD",
        "COMB",
        "FISH",
        "GOAT",
        "HOUSE",
        "SHIRT"
    ],
    alphabetCount: {},
    totalAlphabets: 0,

    backgroundColor: 0x777777,
    background: null,
    progressBar: null,
    questionBG: null,
    isLoaded: false,

    refHeight: 1920,
    refWidth: 1080,
    sceneScale: 1,

    grid: [],
    questionSpots: [],
    roundTimer: null,
    timeLimit: 0,

    curBubble: null,
    curImage: null,

    init: function() {
        var self = this;

        var w = game.system.width;
        var h = game.system.height;
        var aspect = w / h;
        this.refWidth = aspect * this.refHeight;
        this.sceneScale = w / this.refWidth;

        this.calculateAlphabetCounts();
        this.curState = this.GameState.IDLE;
        var loader = new game.Loader(function() {
            self.loaded();
        });
        loader.start();
    },

    calculateAlphabetCounts: function() {
        var i;
        // Initialize to 0
        var alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (i = 0; i < alphabets.length; i++) {
            this.alphabetCount[alphabets[i]] = 0;
        }
        for (i = 0; i < this.words.length; i++) {
            var word = this.words[i];
            for (var j = 0; j < word.length; j++) {
                this.alphabetCount[word[j]] += 1;
                this.totalAlphabets += 1;
            }
        }
    },

    loaded: function() {
        this._createUI();

        this.roundTimer = new game.Timer();
        this.roundTimer.pause();
        this.roundTimer.reset();

        // Init grid
        for (var i = 0; i < 10; i++) {
            var row = [];
            for (var j = 0; j < 8; j++) {
                row.push(null);
            }
            this.grid.push(row);
        }

        // Set question
        this.setQuestion();

        this.isLoaded = true;
    },

    _createUI: function() {
        this.background = new game.Graphics();
        // Magenta BG for checking
        this.background.lineStyle(4, 0x4f81bd);
        this.background.beginFill(0xff00ff, 1);
        this.background.drawRect(0, 0, this.refWidth, this.refHeight);
        this.background.endFill();
        this.background.lineStyle(12, 0xffffff);
        // Menu Area
        this.background.beginFill(0x4f81bd, 1);
        this.background.drawRect(8, 8, this.refWidth - 16, 120);
        this.background.endFill();
        // Question area
        this.background.beginFill(0x4f81bd, 1);
        this.background.drawRect(8, 128, this.refWidth - 16, 460);
        this.background.endFill();
        // Spikes image
        this.background.beginFill(0x4f81bd, 1);
        this.background.drawRect(8, 588, this.refWidth - 16, 50);
        this.background.endFill();
        // Block area
        this.background.beginFill(0x4f81bd, 1);
        this.background.drawRect(8, 638, this.refWidth - 16, this.refHeight - 646);
        this.background.endFill();
        this.background.scale.set(this.sceneScale, this.sceneScale);
        this.stage.addChild(this.background);

        var self = this;
        var pauseBtn = new EntityButton(this.refWidth - 68, 68, {
            bgNorm: "btn_bg",
            bgHover: "btn_bg_hover",
            bgDown: "btn_bg_down",
            anchor: { x: 0.5, y: 0.5 },
            onClick: function() {
                console.log("Pause clicked");
            },
            image: {
                img: "btn_pause",
                settings: { anchor: { x: 0.5, y: 0.5 } }
            }
        });
        this.background.addChild(pauseBtn);

        var undoBtn = new EntityButton(this.refWidth - 68 - 90, 68, {
            bgNorm: "btn_bg",
            bgHover: "btn_bg_hover",
            bgDown: "btn_bg_down",
            anchor: { x: 0.5, y: 0.5 },
            onClick: function() {
                console.log("Undo clicked");
            },
            image: {
                img: "btn_undo",
                settings: { anchor: { x: 0.5, y: 0.5 } }
            }
        });
        this.background.addChild(undoBtn);

        this.progressBar = new EntityProgressBar(32, 38, this.refWidth - 68 - 90 - 90, 60);
        this.background.addChild(this.progressBar);

        this.questionBG = new game.Container();
        this.questionBG.addTo(this.background);
    },

    setQuestion: function() {
        var question = this.getNextQuestion();
        var word = question.word;
        var x = 100, y = 358, i = 0;
        for (i = 0; i < this.questionSpots.length; i++) {
            this.questionSpots[i].clear();
        }
        this.questionSpots = [];
        for (i = 0; i < word.length; i++) {
            var blankSpot = new EntityBlankSpot(i, word[i], x, y, { anchor: { x: 0.5, y: 0.5 } });
            blankSpot.addTo(this.questionBG);
            this.questionSpots.push(blankSpot);
            x += 120;
        }
        this.roundTimer.reset();
        this.roundTimer.resume();
        this.timeLimit = question.timeLimit * 1000;
        this.curState = this.GameState.PLAYING;

        // Place image
        if (this.curImage !== null) {
            this.curImage.remove();
            this.curImage = null;
        }
        x = this.refWidth - 150 - 50;
        this.curImage = new game.Sprite("word_" + word, x, y, {
            anchor: { x: 0.5, y: 0.5 }
        });
        this.curImage.addTo(this.questionBG);
        // Init bubbles
        this.addCharactersRow(this.getNewCharactersRow(word));
    },

    // Adds 8 bubbles that appear from below and move previous row up
    addCharactersRow: function(chars) {
        var i, j;
        // Move previous bubbles up
        for (i = this.grid.length - 1; i > -1; i--) {
            for (j = 0; j < this.grid[i].length; j++) {
                if (this.grid[i][j] !== null) {
                    this.grid[i][j].moveTo(i + 1, j);
                }
            }
        }
        // Add new bubbles from below
        for (i = 0; i < chars.length; i++) {
            var bubble = new EntityBubble(this.grid, 0, i, chars[i], this, { anchor: { x: 0.5, y: 0.5 } });
            bubble.addTo(this.background);
        }
    },

    // Drops all bubbles in column by 1 row
    dropColumn: function(col) {
        for (i = 1; i < this.grid.length; i++) {
            if (this.grid[i][col] !== null) {
                if (this.grid[i - 1][col] === null) {
                    this.grid[i][col].moveTo(i - 1, col);
                }
            }
        }
    },

    // End game when topmost row has a bubble
    checkEndGame: function() {
        var row = this.grid.length - 1;
        for (var c = 0; c < this.grid[row].length; c++) {
            if (this.grid[row][c] !== null) {
                return true;
            }
        }
        return false;
    },

    update: function() {
        this._super();
        if (this.isLoaded) {
            if (this.curState === this.GameState.PLAYING) {
                var remTime = this.getRemainingTime();
                this.progressBar.setProgress(remTime);
                if (remTime === 0) {
                    this.curState = this.GameState.NEW_QUESTION;
                    this.roundTimer.reset();
                    if (this.curBubble !== null) {
                        this.curBubble.mouseup(null);
                    }
                }
            } else if (this.curState === this.GameState.NEW_QUESTION) {
                if (this.roundTimer.time() >= 1000) {
                    if (this.checkEndGame()) {
                        this.curState = this.GameState.END;
                        for (var i = 0; i < this.grid.length; i++) {
                            for (var j = 0; j < this.grid[i].length; j++) {
                                if (this.grid[i][j] !== null) {
                                    this.grid[i][j].interactive = false;
                                }
                            }
                        }
                    } else {
                        this.setQuestion();
                    }
                }
            }
        }
    },

    getRemainingTime: function() {
        var time = this.roundTimer.time();
        if (time >= this.timeLimit) {
            this.roundTimer.pause();
            return 0;
        }
        return 100 - (time * 100 / this.timeLimit);
    },

    // Placeholder for API call that will return next question
    getNextQuestion: function() {
        var id = this.randomRange(0, this.words.length);
        return {
            word: this.words[id],
            timeLimit: 30
        }
    },

    // Generates a new row of characters
    getNewCharactersRow: function(word) {
        console.log(word);
        var i = 0;
        var chars = [];
        var alphabetCount = {};
        // Calculate number of each alphabet in word
        for (; i < word.length; i++) {
            if (alphabetCount[word[i]] === undefined) {
                alphabetCount[word[i]] = 1;
            } else {
                alphabetCount[word[i]] += 1;
            }
        }
        // Subtract number of each alphabet already in grid and add remaining
        for (i in alphabetCount) {
            alphabetCount[i] -= this.alphabetCountInGrid(i);
            for (var j = 0; j < alphabetCount[i]; j++) {
                chars.push(i);
            }
        }
        for (i = chars.length; i < 8; i++) {
            chars.push(this.chooseRandomAlphabetWeighted());
        }
        // Knuth shuffle
        for (i = 0; i < 7; i++) {
            var j = this.randomRange(i, 8);
            var tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }
        return chars;
    },

    // Choose alphabet completely randomly
    chooseRandomAlphabet: function() {
        var alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return alphabets[this.randomRange(0, alphabets.length)]
    },

    // Choose alphabet based on occurrence in all words
    chooseRandomAlphabetWeighted: function() {
        var r = this.randomRange(0, this.totalAlphabets);
        var c = 0;
        for (var i in this.alphabetCount) {
            c += this.alphabetCount[i];
            if (r <= c) {
                return i;
            }
        }
    },

    // Returns the number of a certain alphabet in grid
    alphabetCountInGrid: function(character) {
        var count = 0;
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < 8; j++) {
                if (this.grid[i][j] !== null && this.grid[i][j].alphabet === character) {
                    count += 1;
                }
            }
        }
        return count;
    },

    randomRange: function(a, b) {
        return a + Math.floor(Math.random() * (b - a));
    }
});

});
