module.exports = function(grunt) {
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks("grunt-mkdir");
	grunt.loadNpmTasks("grunt-shell");

	var pkg = grunt.file.readJSON("package.json");

	var build = grunt.option("build") || "debug";
	var timestamp = Date.now();

	if (["debug", "release"].indexOf(build) === -1) {
		grunt.fatal("Unknown build: " + build);
	}

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		mkdir: {
			debug: { options: { create: ["builds/debug"] } },
			release: { options: { create: ["builds/release"] } }
		},
		clean: {
			debug: ["builds/debug"],
			release: ["builds/release"]
		},
		copy: {
			debug: {
				files: [
					{ expand: true, src: ["index.html"], dest: "builds/debug/", filter: "isFile" },
					{ expand: true, src: ["src/**", "media/**"], dest: "builds/debug/" }
				]
			},
			release: {
				files: [
					{ expand: true, src: ["build.html"], dest: "builds/release/", filter: "isFile", rename: function(d, s) { return d + 'index.html'; } },
					{ expand: true, src: ["media/**"], dest: "builds/release/" }
				]
			}
		},
		shell: {
			buildPanda: {
				command: "panda build",
				options: {
					stdout: true
				}
			}
		},
		jscs: {
			fail: {
				options: {
					config: ".jscsrc",
					force: false
				},
				files: {
					src: ["src/game/**", "src/plugins/**"]
				}
			}
		}
	});

	// Helper tasks
	grunt.registerTask("clean-release", ["clean:release", "mkdir:release"]);
	grunt.registerTask("build-release", ["shell:buildPanda", "copy:release"]);
	grunt.registerTask("build-debug", ["clean:debug", "mkdir:debug", "copy:debug"]);

	// Basic builds
	grunt.registerTask("debug", ["jscs:fail", "build-debug"]);
	grunt.registerTask("release", ["jscs:fail", "clean-release", "build-release"]);

	// Dev tasks
	grunt.registerTask("lint", ["jscs:fail"]);
};
