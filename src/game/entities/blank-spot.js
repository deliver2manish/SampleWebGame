game.module(
    "game.entities.blank-spot"
)
.require(
    "engine.renderer",
    "game.assets"
)
.body(function() {

EntityBlankSpot = game.Sprite.extend({
    index: null,
    correctAlphabet: null,
    currentAlphabet: null,
    bubble: null,

    init: function(i, answer, x, y, settings) {
        this._super("white_rect", x, y, settings);
        this.settings = settings;
        game.merge(this, settings);

        this.index = i;
        this.correctAlphabet = answer;
    },

    setBubble: function(bubble) {
        this.bubble = bubble;
    },

    clear: function() {
        this.remove();
        if (this.bubble !== null) {
            this.bubble.remove();
        }
    },

    overlapping: function(enable) {
        if (enable) {
            this.setTexture("grey_rect");
        } else {
            this.setTexture("white_rect");
        }
    }
});

});
