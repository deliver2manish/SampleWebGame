game.module(
    "game.entities.button"
)
.require(
    "engine.renderer",
    "game.assets"
)
.body(function() {

EntityButton = game.Sprite.extend({
    bgNorm: null,
    bgHover: null,
    bgDown: null,

    stateNorm: null,
    stateHover: null,
    stateDown: null,

    image: null,
    text: null,

    onClick: null,
    isPressed: false,
    isHovered: false,

    init: function(x, y, settings) {
        this._super(null, 0, 0, settings);
        this.settings = settings;
        game.merge(this, settings);
        this.position.set(x, y);
        this.interactive = true;
        this._createUI();
    },

    _createUI: function() {
        // Create states
        if (this.bgNorm !== null && typeof(this.bgNorm === "string")) {
            this.stateNorm = new game.Sprite(this.bgNorm, 0, 0, { anchor: { x: 0.5, y: 0.5 } });
            this.addChild(this.stateNorm);
        }
        if (this.bgHover !== null && typeof(this.bgHover === "string")) {
            this.stateHover = new game.Sprite(this.bgHover, 0, 0, { anchor: { x: 0.5, y: 0.5 } });
            this.addChild(this.stateHover);
        }
        if (this.bgDown !== null && typeof(this.bgDown === "string")) {
            this.stateDown = new game.Sprite(this.bgDown, 0, 0, { anchor: { x: 0.5, y: 0.5 } });
            this.addChild(this.stateDown);
        }
        this.refreshState();
        // Add image as a child
        if (this.image !== null && this.image !== undefined) {
            var x = this.image.x || 0;
            var y = this.image.y || 0;
            var img = new game.Sprite(this.image.img, x, y, this.image.settings);
            this.addChild(img);
        }
        // TODO : Add text child option
    },

    mousedown: function(interactionData) {
        this.isPressed = true;
        this.refreshState();
    },

    mousemove: function(interactionData) {
        if (game.system.stage.interactionManager.hitTest(this, interactionData)) {
            if (!this.isHovered) {
                this.isHovered = true;
                this.refreshState();
            }
        } else {
            if (this.isHovered) {
                this.isHovered = false;
                this.refreshState();
            }
        }
    },

    mouseup: function(interactionData) {
        if (this.isPressed) {
            this.isPressed = false;
            if (this.onClick !== null && this.onClick !== undefined && typeof(this.onClick) === "function") {
                this.onClick();
            }
            this.refreshState();
        }
    },

    mouseupoutside: function(interactionData) {
        if (this.isPressed) {
            this.isHovered = false;
            this.isPressed = false;
            this.refreshState();
        }
    },

    refreshState: function() {
        if (this.stateNorm !== null) {
            this.stateNorm.visible = false;
        }
        if (this.stateHover !== null) {
            this.stateHover.visible = false;
        }
        if (this.stateDown !== null) {
            this.stateDown.visible = false;
        }
        if (!this.isHovered) {
            if (this.stateNorm !== null) {
                this.stateNorm.visible = true;
            }
        } else if (this.isPressed) {
            if (this.stateDown !== null) {
                this.stateDown.visible = true;
            }
        } else if (this.isHovered) {
            if (this.stateHover !== null) {
                this.stateHover.visible = true;
            }
        }
    }
});

});
