pandaConfig = {
    name: "English Bubbles",
    version: "0.0.1",
    outputFile: "builds/release/game.min.js",

    system: {
        startScene: "Game",
        width: 1080,
        height: 1920,
        webGL: true,
        disableCache: true,
        finalRelease: false,
        resizeToFill: true
    }
};

function checkDimensionOverrides() {
    if (typeof(document) === "undefined" || pandaConfig.system.finalRelease) {
        return;
    }

    var width = document.location.href.match(/\?w=(\d+)/);
    if (width) {
        pandaConfig.system.width = parseInt(width[1]);
    }

    var height = document.location.href.match(/\?h=(\d+)/);
    if (height) {
        pandaConfig.system.height = parseInt(height[1]);
    }
}

checkDimensionOverrides();
