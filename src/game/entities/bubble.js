game.module(
    "game.entities.bubble"
)
.require(
    "engine.renderer",
    "game.assets"
)
.body(function() {

EntityBubble = game.Sprite.extend({
    grid: null,
    row: null,
    col: null,
    alphabet: null,

    scene: null,

    isDragging: false,
    dragStart: null,
    startPos: null,
    tween: null,

    overlapBlankSpot: null,

    init: function(grid, row, col, alphabet, scene, settings) {
        this._super("white_rect", 0, 0, settings);
        this.settings = settings;
        game.merge(this, settings);
        this.scene = scene;
        this.interactive = true;

        this.grid = grid;
        this.row = row;
        this.col = col;
        this.alphabet = alphabet;

        var label = new game.BitmapText(alphabet, { font: "Classica" });
        label.position.set(-label.textWidth / 2, -label.textHeight / 2);
        this.addChild(label);

        var pos = this.positionInGrid();
        this.position.set(pos.x, pos.y + 144);
        this.moveTo(row, col);
    },

    // Returns position in grid
    positionInGrid: function() {
        var posX = 0, posY = 0;
        posX = this.col * 120;
        posY = this.row * 120;
        posX += (this.scene.refWidth - (8 * 120)) / 2 + 120 / 2;
        posY = this.scene.refHeight - posY - 120 / 2 - 42;
        return { x: posX, y: posY };
    },

    // Move to new row and column
    moveTo: function(r, c) {
        this.grid[this.row][this.col] = null;
        this.row = r;
        this.col = c;
        this.grid[r][c] = this;
        this.interactive = false;
        var pos = this.positionInGrid();
        if (this.tween !== null) {
            this.tween.stop();
            this.tween = null;
        }
        this.tween = new game.Tween(this.position);
        this.tween.to(pos, 250);
        var self = this;
        this.tween.onComplete(function() {
            self.tween.onComplete = null;
            self.interactive = true;
            self.tween = null;
        });
        this.tween.easing("Quadratic.InOut");
        this.tween.start();
    },

    mousedown: function(interactionData) {
        this.isDragging = true;
        if (this.tween !== null) {
            this.tween.stop();
            this.tween = null;
        }
        this.dragStart = interactionData.global.clone();
        this.startPos = this.position.clone();
        var childIndex = this.scene.background.children.length - 1;
        this.scene.background.setChildIndex(this, childIndex);
        this.scene.curBubble = this;
    },

    mousemove: function(interactionData) {
        if (this.isDragging) {
            var diffX = (interactionData.global.x - this.dragStart.x) / this.scene.sceneScale;
            var diffY = (interactionData.global.y - this.dragStart.y) / this.scene.sceneScale;
            this.position.set(this.startPos.x + diffX, this.startPos.y + diffY);
            this.handleOverlap();
        }
    },

    mouseup: function(interactionData) {
        if (this.isDragging) {
            this.isDragging = false;
            this.scene.curBubble = null;
            if (this.overlapBlankSpot !== null) {
                this.tween = new game.Tween(this.position);
                this.tween.to(this.overlapBlankSpot.position, 250);
                this.tween.easing("Quadratic.InOut");
                this.tween.onComplete = null;
                this.tween.start();
                this.interactive = false;
                this.grid[this.row][this.col] = null;
                this.overlapBlankSpot.setBubble(this);
                this.scene.dropColumn(this.col);
            } else {
                this.tween = new game.Tween(this.position);
                this.tween.to(this.positionInGrid(), 500);
                this.tween.easing("Quadratic.InOut");
                this.tween.onComplete = null;
                this.tween.start();
            }
        }
    },

    mouseupoutside: function(interactionData) {
        if (this.isDragging) {
            this.mouseup(interactionData);
        }
    },

    handleOverlap: function() {
        var nearest = null;
        var nearestOverlap = 0;
        var sBounds = this.getBounds();
        for (var i = 0; i < this.scene.questionSpots.length; i++) {
            if (this.scene.questionSpots[i].bubble !== null) {
                continue;
            }
            var overlap = this.getOverlapArea(sBounds, this.scene.questionSpots[i].getBounds());
            if (overlap > nearestOverlap) {
                nearest = this.scene.questionSpots[i];
                nearestOverlap = overlap;
            }
        }
        if (nearest !== null) {
            if (this.overlapBlankSpot !== null) {
                this.overlapBlankSpot.overlapping(false);
            }
            nearest.overlapping(true);
            this.overlapBlankSpot = nearest;
        } else {
            if (this.overlapBlankSpot !== null) {
                this.overlapBlankSpot.overlapping(false);
                this.overlapBlankSpot = null;
            }
        }
    },

    getOverlapArea: function(bounds1, bounds2) {
        var x11 = bounds1.x;
        var x12 = x11 + bounds1.width;
        var y11 = bounds1.y;
        var y12 = y11 + bounds1.height;
        var x21 = bounds2.x;
        var x22 = x21 + bounds2.width;
        var y21 = bounds2.y;
        var y22 = y21 + bounds2.height;
        var overlapX = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
        var overlapY = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
        return overlapX * overlapY;
    }
});

});
