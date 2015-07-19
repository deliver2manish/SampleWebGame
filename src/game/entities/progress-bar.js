game.module(
    "game.entities.progress-bar"
)
.require(
    "engine.renderer"
)
.body(function() {

EntityProgressBar = game.Container.extend({
    graphics: null,
    w: 0,
    h: 0,

    init: function(x, y, w, h, settings) {
        this._super(settings);
        this.w = w;
        this.h = h;
        this.settings = settings;
        game.merge(this, settings);
        this.graphics = new game.Graphics();
        this.graphics.lineStyle(12, 0xffffff);
        this.graphics.drawRect(0, 0, w, h);
        this.graphics.lineStyle(0, 0);
        this.graphics.beginFill(0x06cb14, 1);
        this.graphics.drawRect(6, 6, w - 12, h - 12);
        this.graphics.endFill();
        this.addChild(this.graphics);
        this.position.set(x, y);
    },

    setProgress: function(percent) {
        this.graphics.clear();
        var w = (this.w - 12) * percent / 100;
        this.graphics.lineStyle(12, 0xffffff);
        this.graphics.drawRect(0, 0, this.w, this.h);
        this.graphics.lineStyle(0, 0);
        this.graphics.beginFill(0x06cb14, 1);
        this.graphics.drawRect(6, 6, w, this.h - 12);
        this.graphics.endFill();
    }
});

});
