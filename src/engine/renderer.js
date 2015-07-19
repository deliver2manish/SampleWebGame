/**
    @module renderer
    @namespace game
**/
game.module(
    'engine.renderer'
)
.require(
    'engine.pixi'
)
.body(function() {
'use strict';

game.PIXI.dontSayHello = true;
game.PIXI.RETINA_PREFIX = false;

game.autoDetectRenderer = game.PIXI.autoDetectRenderer;

game.PIXI.extend = function(prop) {
    var name;
    var proto = this.prototype;
    var base = this.prototype.base || this;

    function Class() {
        var name;

        for (name in proto) {
            if (typeof proto[name] !== 'function') this[name] = game.copy(proto[name]);
        }
        for (name in prop) {
            if (typeof prop[name] !== 'function') this[name] = game.copy(prop[name]);
        }
        if (this.init) this.init.apply(this, arguments);
        else this.base.apply(this, arguments);
    }

    Class.prototype = Object.create(base.prototype);

    var makeFn = function(name, fn) {
        var from = proto[name];
        if (name === 'init' && !from) from = base;
        return function() {
            var tmp = this._super;
            this._super = from;
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
        };
    };

    for (name in proto) {
        if (typeof proto[name] === 'function') {
            Class.prototype[name] = makeFn(name, proto[name]);
        }
        else {
            Class.prototype[name] = game.copy(proto[name]);
        }
    }

    for (name in prop) {
        if (typeof prop[name] === 'function') {
            Class.prototype[name] = makeFn(name, prop[name]);
        }
        else {
            Class.prototype[name] = game.copy(prop[name]);
        }
    }

    Class.prototype.constructor = Class;
    Class.prototype.base = base;

    Class.extend = game.PIXI.extend;

    return Class;
};

for (var i in game.PIXI) {
    if (game.PIXI[i].prototype instanceof Object) {
        game.PIXI[i].extend = game.PIXI.extend;
    }
}

/**
    http://www.goodboydigital.com/pixijs/docs/classes/MovieClip.html
    @class Animation
    @extends game.DisplayObject
    @constructor
    @param {Array} textures Textures this animation made up of
**/
game.Animation = function(textures) {
    /**
        Play animation in reverse.
        @property {Boolean} reverse
        @default false
    **/
    this.reverse = false;

    if (typeof textures === 'string') {
        var frames = Array.prototype.slice.call(arguments);

        var textures = [];
        for (var i = 0; i < frames.length; i++) {
            textures.push(game.Texture.fromImage(frames[i]));
        }
    }

    game.PIXI.MovieClip.call(this, textures);
};

game.Animation.prototype = Object.create(game.PIXI.MovieClip.prototype);
game.Animation.prototype.constructor = game.Animation;

/**
    Play animation.
    @method play
    @param {Boolean} loop
**/
game.Animation.prototype.play = function(loop) {
    if (typeof loop === 'boolean') this.loop = loop;
    this.playing = true;
};

game.Animation.prototype.updateTransform = function() {
    if (this.playing) {
        this.currentFrame -= this.animationSpeed;
        this.currentFrame += this.animationSpeed * (this.reverse ? -1 : 1) * 60 * game.system.delta;

        if (this.currentFrame < 0 && this.reverse) {
            if (!this.loop) {
                if (this.onComplete) this.onComplete();
                this.currentFrame = 0;
                this.playing = false;
            }
            else this.currentFrame = this.totalFrames - 1 + this.currentFrame;
        }
    }
    game.PIXI.MovieClip.prototype.updateTransform.call(this);
};

/**
    @method fromFrames
    @static
    @param {String} name
    @param {Boolean} reverse
**/
game.Animation.fromFrames = function(name, reverse) {
    var textures = [];

    for (var key in game.TextureCache) {
        if (key.indexOf(name) !== -1) {
            if (reverse) textures.unshift(game.TextureCache[key]);
            else textures.push(game.TextureCache[key]);
        }
    }

    return new game.Animation(textures);
};

game.AssetLoader = game.PIXI.AssetLoader;
game.blendModes = game.PIXI.blendModes;

/**
    http://www.goodboydigital.com/pixijs/docs/classes/BaseTexture.html
    @class BaseTexture
**/
game.BaseTexture = game.PIXI.BaseTexture;

/**
    http://www.goodboydigital.com/pixijs/docs/classes/BitmapText.html
    @class BitmapText
**/
game.BitmapText = game.PIXI.BitmapText;
game.CanvasRenderer = game.PIXI.CanvasRenderer;

/**
    http://www.goodboydigital.com/pixijs/docs/classes/DisplayObjectContainer.html
    @class Container
    @extends game.DisplayObject
**/
game.Container = game.PIXI.DisplayObjectContainer.extend({
    debugDraw: true,
    init: function() {
        this._super();
        // Auto bind touch events
        if (game.device.touch && !this.tap && this.click) this.tap = this.click;
        if (game.device.touch && !this.touchmove && this.mousemove) this.touchmove = this.mousemove;
        if (game.device.touch && !this.touchstart && this.mousedown) this.touchstart = this.mousedown;
        if (game.device.touch && !this.touchend && this.mouseup) this.touchend = this.mouseup;
        if (game.device.touch && !this.touchendoutside && this.mouseupoutside) this.touchendoutside = this.mouseupoutside;
    },

    /**
        Remove container from it's parent.
        @method remove
    **/
    remove: function() {
        if (this.parent) this.parent.removeChild(this);
    },

    /**
        Add object to container.
        @method addChild
    **/
    addChild: function(obj) {
        this._super(obj);
        if (game.debugDraw && obj.interactive && obj.debugDraw) game.debugDraw.addSprite(obj);
    },

    /**
        Add to container.
        @method addTo
        @param {game.Container} container
    **/
    addTo: function(container) {
        container.addChild(this);
        return this;
    },
    /**
        Make a global coordinate local to this container.
        @method globalToLocal
        @param {game.Point} position
    **/
    globalToLocal: function(position) {
        var worldTransform = this.worldTransform;
        var a00 = worldTransform.a, a01 = worldTransform.c, a02 = worldTransform.tx;
        var a10 = worldTransform.b, a11 = worldTransform.d, a12 = worldTransform.ty;
        var id = 1 / (a00 * a11 + a01 * -a10);
        return {
            x: a11 * id * position.x + -a01 * id * position.y + (a12 * a01 - a02 * a11) * id,
            y: a00 * id * position.y + -a10 * id * position.x + (-a12 * a00 + a02 * a10) * id
        };
    }
});

/**
    http://www.goodboydigital.com/pixijs/docs/classes/DisplayObject.html
    @class DisplayObject
**/
game.DisplayObject = game.PIXI.DisplayObject;

/**
    Remove from it's parent.
    @method remove
**/
game.DisplayObject.prototype.remove = function() {
    if (this.parent) this.parent.removeChild(this);
};

/**
    Add to container.
    @method addTo
    @param {game.DisplayObject|game.Container} container
**/
game.DisplayObject.prototype.addTo = function(container) {
    container.addChild(this);
    return this;
};

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Graphics.html
    @class Graphics
    @extends game.DisplayObject
**/
game.Graphics = game.PIXI.Graphics;
game.HitCircle = game.PIXI.Circle;
game.HitEllipse = game.PIXI.Ellipse;
game.HitPolygon = game.PIXI.Polygon;
game.HitRectangle = game.PIXI.Rectangle;
/**
    http://www.goodboydigital.com/pixijs/docs/classes/Point.html
    @class Point
**/
game.Point = game.PIXI.Point;

/**
    http://www.goodboydigital.com/pixijs/docs/classes/RenderTexture.html
    @class RenderTexture
**/
game.RenderTexture = game.PIXI.RenderTexture;

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Spine.html
    @class Spine
    @extends game.DisplayObject
    @constructor
    @param {String} id Asset ID
    @param {Object} [properties] Properties to merge to this animation
**/
game.Spine = function(id, properties) {
    game.PIXI.Spine.call(this, game.paths[id] || id);
    game.merge(this, properties);
};

game.Spine.prototype = Object.create(game.PIXI.Spine.prototype);
game.Spine.prototype.constructor = game.Spine;

/**
    Play animation.
    @method play
    @param {String} anim Name of animation.
    @param {Boolean} loop Animation looping.
    @param {Boolean} after Start after current animation.
**/
game.Spine.prototype.play = function(anim, loop, after) {
    if (after) this.state.addAnimationByName(anim, !!loop);
    else this.state.setAnimationByName(anim, !!loop);
};

/**
    Mix two animations for smooth transition.
    @method mix
    @param {String} from Animation name to mix from.
    @param {String} to Animation name to mix to.
    @param {Number} value Percent of mix.
**/
game.Spine.prototype.mix = function(from, to, value) {
    this.stateData.setMixByName(from, to, value / 100);
};

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Sprite.html
    @class Sprite
    @extends game.DisplayObject
    @constructor
    @param {String} texture
    @param {Number} [x]
    @param {Number} [y]
    @param {Object} [properties]
**/
game.Sprite = game.PIXI.Sprite.extend({
	debugDraw: true,
    id: null,

    init: function(id, x, y, settings) {
        if (typeof id === 'string') {
            this.id = id;
            id = game.paths[id] || id;
            id = game.Texture.fromFrame(id);
        }
        this._super(id);

        game.merge(this, settings);

        if (typeof x === 'number') this.position.x = x;
        if (typeof y === 'number') this.position.y = y;

        // Auto bind touch events
        if (game.device.touch && !this.tap && this.click) this.tap = this.click;
        if (game.device.touch && !this.touchmove && this.mousemove) this.touchmove = this.mousemove;
        if (game.device.touch && !this.touchstart && this.mousedown) this.touchstart = this.mousedown;
        if (game.device.touch && !this.touchend && this.mouseup) this.touchend = this.mouseup;
        if (game.device.touch && !this.touchendoutside && this.mouseupoutside) this.touchendoutside = this.mouseupoutside;
    },

    /**
        Change sprite texture.
        @method setTexture
        @param {String} id
    **/
    setTexture: function(id) {
        this.id = null;
        if (typeof id === 'string') {
            this.id = id;
            id = game.paths[id] || id;
            id = game.Texture.fromFrame(id);
        }
        this._super(id);
    },

	/**
        Crop sprite.
        @method crop
        @param {Number} x
        @param {Number} y
        @param {Number} width
        @param {Number} height
    **/
    crop: function(x, y, width, height) {
        var texture = new game.PIXI.Texture(this.texture, new game.HitRectangle(x, y, width, height));
        this.setTexture(texture);
        return this;
    },

    /**
        Position sprite to system center.
        @method center
        @param {Number} offsetX
        @param {Number} offsetY
    **/
    center: function(offsetX, offsetY) {
        this.position.x = game.system.width / 2 - this.width / 2 + this.width * this.anchor.x;
        this.position.y = game.system.height / 2 - this.height / 2 + this.height * this.anchor.y;
        this.position.x += offsetX || 0;
        this.position.y += offsetY || 0;
        return this;
    }
});

game.Sprite.fromFrame = game.PIXI.Sprite.fromFrame;
game.Sprite.fromImage = game.PIXI.Sprite.fromImage;

game.Stage = game.PIXI.Stage;

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Text.html
    @class Text
**/
game.Text = game.PIXI.Text;

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Texture.html
    @class Texture
**/
game.Texture = game.PIXI.Texture;

/**
    @property {Object} TextureCache
    @for game.Core
**/
game.TextureCache = game.PIXI.TextureCache;

/**
    http://www.goodboydigital.com/pixijs/docs/classes/TilingSprite.html
    @class TilingSprite
    @extends game.DisplayObject
    @constructor
    @param {String|game.Texture} texture Texture to be repeated
    @param {Number} width Sprite width
    @param {Number} height Sprite height
    @param {Object} [properties] Properties to be merged into this sprite
**/
game.TilingSprite = function(path, width, height, properties) {
    /**
        Texture scroll speed
        @property {game.Point} speed
    **/
    this.speed = new game.Point();
    path = game.paths[path] || path;
    var texture = path instanceof game.Texture ? path : path instanceof game.RenderTexture ? path : game.Texture.fromFrame(this.path || path);
    game.PIXI.TilingSprite.call(this, texture, width || texture.width, height || texture.height);
    game.merge(this, properties);
};

game.TilingSprite.prototype = Object.create(game.PIXI.TilingSprite.prototype);
game.TilingSprite.prototype.constructor = game.TilingSprite;

/**
    Update tile position with speed.
    @method update
**/
game.TilingSprite.prototype.update = function() {
    this.tilePosition.x += this.speed.x * game.system.delta;
    this.tilePosition.y += this.speed.y * game.system.delta;
};

/**
    @class SpriteSheet
    @extends game.Class
    @constructor
    @param {String} id Asset ID
    @param {Number} width Sprite frame width
    @param {Number} height Sprite frame height
**/
game.createClass('SpriteSheet', {
    /**
        @propety {Array} textures
    **/
    textures: [],
    /**
        Number of frames
        @property {Number} frames
    **/
    frames: 0,

    init: function(id, width, height) {
        this.width = width;
        this.height = height;
        var baseTexture = game.TextureCache[game.paths[id]];
        this.sx = Math.floor(baseTexture.width / this.width);
        this.sy = Math.floor(baseTexture.height / this.height);
        this.frames = this.sx * this.sy;

        for (var i = 0; i < this.frames; i++) {
            var x = (i % this.sx) * this.width;
            var y = Math.floor(i / this.sx) * this.height;
            var texture = new game.Texture(baseTexture, new game.HitRectangle(x, y, this.width, this.height));
            this.textures.push(texture);
        }
    },

    /**
        Create sprite from specific frame.
        @method frame
        @param {Number} index Frame index
        @return {game.Sprite}
    **/
    frame: function(index) {
        index = index.limit(0, this.frames - 1);
        return new game.Sprite(this.textures[index]);
    },

    /**
        Create animation from spritesheet.
        @method anim
        @param {Number|Array} frames List or number of frames
        @param {Number} [startIndex] The index to begin with, default to 0
        @param {Boolean} [onlyTextures] Return only textures
        @return {game.Animation|Array}
    **/
    anim: function(frames, startIndex, onlyTextures) {
        startIndex = startIndex || 0;
        frames = frames || this.frames;
        var textures = [];
        if (frames.length > 0) {
            for (var i = 0; i < frames.length; i++) {
                textures.push(this.textures[startIndex + frames[i]]);
            }
        }
        else {
            for (var i = 0; i < frames; i++) {
                textures.push(this.textures[startIndex + i]);
            }
        }
        if (onlyTextures) return textures;
        return new game.Animation(textures);
    }
});

/**
    @class Video
    @extends game.Class
    @constructor
    @param {String} source
**/
game.createClass('Video', {
    /**
        @property {Boolean} loop
        @default false
    **/
    loop: false,
    /**
        Video element.
        @property {Video} videoElem
    **/
    videoElem: null,
    /**
        Video sprite.
        @property {game.Sprite} sprite
    **/
    sprite: null,

    init: function() {
        this.videoElem = document.createElement('video');
        this.videoElem.addEventListener('ended', this._complete.bind(this));

        var urls = Array.prototype.slice.call(arguments);
        var source;
        for (var i = 0; i < urls.length; i++) {
            source = document.createElement('source');
            source.src = game.getMediaPath(urls[i]);
            this.videoElem.appendChild(source);
        }

        var videoTexture = game.PIXI.VideoTexture.textureFromVideo(this.videoElem);
        videoTexture.baseTexture.addEventListener('loaded', this._loaded.bind(this));

        this.sprite = new game.Sprite(videoTexture);
    },

    /**
        @method _loaded
        @private
    **/
    _loaded: function() {
        if (typeof this._loadCallback === 'function') this._loadCallback();
    },

    /**
        @method _complete
        @private
    **/
    _complete: function() {
        if (typeof this._completeCallback === 'function') this._completeCallback();
    },

    /**
        @method onLoaded
        @param {Function} callback
    **/
    onLoaded: function(callback) {
        this._loadCallback = callback;
    },

    /**
        @method onComplete
        @param {Function} callback
    **/
    onComplete: function(callback) {
        this._completeCallback = callback;
    },

    /**
        @method play
    **/
    play: function() {
        this.videoElem.loop = !!this.loop;
        this.videoElem.play();
    },

    /**
        @method stop
        @param {Boolean} remove
    **/
    stop: function(remove) {
        this.videoElem.pause();
        if (remove) this.sprite.remove();
    }
});

});
